import axios from 'axios'
import { env } from '../config/validateEnv'
import { redis, REDIS_KEYS } from '../config/redis'
import { IThreatIntelIndicator } from '../models/Incident'
import { ThreatIntel } from '../models/ThreatIntel'
import { logger } from '../utils/logger'

export class ThreatIntelService {
  /**
   * Look up an indicator (IP, Hash, Domain). 
   * Checks Redis first, then external APIs, falling back to Mocks if keys missing.
   */
  public async lookupIndicator(indicator: string, type: 'ip' | 'hash' | 'url'): Promise<IThreatIntelIndicator> {
    const cacheKey = REDIS_KEYS.threatIntel(indicator)
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    let result: IThreatIntelIndicator = {
      indicator,
      type,
      reputation: 'unknown',
      reputationScore: 0,
    }

    if (env.FEATURE_MOCK_THREAT_INTEL && this.isMissingKeys()) {
      result = this.getMockIntel(indicator, type)
    } else {
      try {
        const [vtData, abuseData, otxData, geoData] = await Promise.all([
          this.lookupVirusTotal(indicator),
          type === 'ip' ? this.lookupAbuseIPDB(indicator) : Promise.resolve(null),
          this.lookupOTX(indicator, type),
          type === 'ip' ? this.lookupGeoIP(indicator) : Promise.resolve(null),
        ])

        // Aggregate results
        if (geoData) {
          result.country = geoData.countryCode
          result.isp = geoData.isp
          result.lat = geoData.lat
          result.lon = geoData.lon
        }
        if (vtData) result.vtMalicious = vtData.malicious
        if (abuseData) result.abuseConfidence = abuseData.abuseConfidenceScore
        if (otxData) result.otxPulses = otxData.pulseCount

        result = this.calculateReputation(result)
      } catch (err) {
        logger.error(`Threat Intel lookup failed for ${indicator}`, { error: (err as Error).message })
        // Fallback to mock on error so pipeline doesn't break
        result = this.getMockIntel(indicator, type)
      }
    }

    // Cache for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(result))
    return result
  }

  private isMissingKeys(): boolean {
    return !env.VIRUSTOTAL_API_KEY && !env.ABUSEIPDB_API_KEY && !env.OTX_API_KEY
  }

  private calculateReputation(data: IThreatIntelIndicator): IThreatIntelIndicator {
    let score = 0
    if (data.vtMalicious) score += (data.vtMalicious / 90) * 100
    if (data.abuseConfidence) score += (data.abuseConfidence / 100) * 50
    if (data.otxPulses) score += Math.min(data.otxPulses * 5, 30)

    data.reputationScore = Math.min(Math.round(score), 100)

    if (data.reputationScore > 60) data.reputation = 'malicious'
    else if (data.reputationScore > 20) data.reputation = 'suspicious'
    else if (data.reputationScore > 0) data.reputation = 'clean'
    else data.reputation = 'unknown'

    return data
  }

  private async lookupVirusTotal(indicator: string) {
    if (!env.VIRUSTOTAL_API_KEY) return null
    try {
      const { data } = await axios.get(`${env.VIRUSTOTAL_BASE_URL}/search?query=${indicator}`, {
        headers: { 'x-apikey': env.VIRUSTOTAL_API_KEY }
      })
      if (!data.data || data.data.length === 0) return null
      const stats = data.data[0].attributes.last_analysis_stats
      return { malicious: stats.malicious, suspicious: stats.suspicious, harmless: stats.harmless }
    } catch { return null }
  }

  private async lookupAbuseIPDB(ip: string) {
    if (!env.ABUSEIPDB_API_KEY) return null
    try {
      const { data } = await axios.get(`${env.ABUSEIPDB_BASE_URL}/check`, {
        params: { ipAddress: ip, maxAgeInDays: 90 },
        headers: { Key: env.ABUSEIPDB_API_KEY, Accept: 'application/json' }
      })
      return data.data
    } catch { return null }
  }

  private async lookupOTX(indicator: string, type: string) {
    if (!env.OTX_API_KEY) return null
    try {
      const otxType = type === 'hash' ? 'file' : type === 'ip' ? 'IPv4' : 'domain'
      const { data } = await axios.get(`${env.OTX_BASE_URL}/indicators/${otxType}/${indicator}/general`, {
        headers: { 'X-OTX-API-KEY': env.OTX_API_KEY }
      })
      return { pulseCount: data.pulse_info?.count || 0 }
    } catch { return null }
  }

  private async lookupGeoIP(ip: string) {
    try {
      // Always free, no key needed
      const { data } = await axios.get(`${env.GEOIP_BASE_URL}/${ip}`)
      if (data.status === 'success') return data
      return null
    } catch { return null }
  }

  private getMockIntel(indicator: string, type: 'ip' | 'hash' | 'url'): IThreatIntelIndicator {
    // Deterministic mock generation based on string length/char codes
    const charSum = indicator.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    
    // Simulate some IPs being malicious, some clean
    const isMalicious = charSum % 3 === 0
    const isSuspicious = charSum % 3 === 1

    const result: IThreatIntelIndicator = {
      indicator,
      type,
      reputation: isMalicious ? 'malicious' : isSuspicious ? 'suspicious' : 'clean',
      reputationScore: isMalicious ? 85 : isSuspicious ? 40 : 5,
      country: ['US', 'CN', 'RU', 'BR', 'DE'][charSum % 5],
      isp: 'Mock ISP Data Co.',
      vtMalicious: isMalicious ? 15 : isSuspicious ? 3 : 0,
      abuseConfidence: type === 'ip' ? (isMalicious ? 100 : isSuspicious ? 50 : 0) : undefined,
      otxPulses: isMalicious ? 5 : 0,
    }

    return result
  }
}

export const threatIntelService = new ThreatIntelService()
