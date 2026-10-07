import mongoose, { Document, Schema } from 'mongoose'

export interface IThreatIntel extends Document {
  indicator: string
  type: 'ip' | 'hash' | 'url'
  virustotal?: { malicious: number; suspicious: number; harmless: number; totalVendors: number; permalink?: string }
  abuseipdb?: { abuseConfidenceScore: number; totalReports: number; countryCode?: string; isp?: string; domain?: string }
  otx?: { pulseCount: number; malwareFamilies: string[]; tags: string[] }
  geoip?: { country?: string; countryCode?: string; city?: string; lat?: number; lon?: number; isp?: string; org?: string }
  reputation: 'malicious' | 'suspicious' | 'clean' | 'unknown'
  reputationScore: number
  fetchedAt: Date
  expiresAt: Date
}

const ThreatIntelSchema = new Schema<IThreatIntel>({
  indicator: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['ip', 'hash', 'url'], required: true },
  virustotal: Schema.Types.Mixed,
  abuseipdb: Schema.Types.Mixed,
  otx: Schema.Types.Mixed,
  geoip: Schema.Types.Mixed,
  reputation: { type: String, enum: ['malicious', 'suspicious', 'clean', 'unknown'], default: 'unknown' },
  reputationScore: { type: Number, default: 0 },
  fetchedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
})

export const ThreatIntel = mongoose.model<IThreatIntel>('ThreatIntel', ThreatIntelSchema)
