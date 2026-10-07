import { Alert, INormalizedData } from '../models/Alert'
import { extractIPs } from '../utils/ipUtils'
import { pipelineRunner } from '../utils/pipelineRunner'
import { logger } from '../utils/logger'

class AlertNormalizationService {
  public async normalizeBatch(alertIds: string[]) {
    const alerts = await Alert.find({ _id: { $in: alertIds }, normalized: false })
    
    for (const alert of alerts) {
      try {
        const normalizedData = this.mapFields(alert.source, alert.rawData)
        normalizedData.attackType = this.classifyAttack(normalizedData.message || JSON.stringify(alert.rawData))
        
        await Alert.updateOne(
          { _id: alert._id },
          { normalized: true, normalizedData }
        )

        // Pass to correlation engine individually
        // pipelineRunner.runCorrelation(normalizedData, alert._id.toString())
      } catch (err) {
        logger.error(`Failed to normalize alert ${alert._id}`, { error: (err as Error).message })
      }
    }
  }

  private mapFields(source: string, rawData: any): INormalizedData {
    const norm: INormalizedData = {
      timestamp: new Date(),
      sourceIP: '0.0.0.0',
      destinationIP: '0.0.0.0',
      hostname: 'unknown',
      username: 'unknown',
      severity: 'info',
      eventType: 'unknown',
      message: '',
    }

    if (source === 'ssh' || source === 'syslog' || source === 'apache') {
      const line = rawData.rawLine || ''
      norm.message = line
      
      const ips = extractIPs(line)
      if (ips.length > 0) norm.sourceIP = ips[0]
      if (ips.length > 1) norm.destinationIP = ips[1]

      if (line.includes('Failed password') || line.includes('Invalid user')) {
        norm.eventType = 'authentication_failure'
        norm.severity = 'high'
        const userMatch = line.match(/(?:for|user) ([^\s]+) from/)
        if (userMatch) norm.username = userMatch[1]
      } else if (line.includes('Accepted password')) {
        norm.eventType = 'authentication_success'
        const userMatch = line.match(/for ([^\s]+) from/)
        if (userMatch) norm.username = userMatch[1]
      }
    } else if (source === 'csv' || source === 'json') {
      // Map common JSON/CSV fields
      norm.timestamp = rawData.timestamp || rawData.date || rawData.time ? new Date(rawData.timestamp || rawData.date || rawData.time) : new Date()
      norm.sourceIP = rawData.src_ip || rawData.sourceIP || rawData.source_ip || '0.0.0.0'
      norm.destinationIP = rawData.dest_ip || rawData.destinationIP || rawData.dst_ip || '0.0.0.0'
      norm.hostname = rawData.hostname || rawData.host || 'unknown'
      norm.username = rawData.username || rawData.user || 'unknown'
      norm.severity = (rawData.severity || rawData.level || 'info').toLowerCase()
      norm.eventType = rawData.event_type || rawData.action || 'unknown'
      norm.message = rawData.message || rawData.msg || JSON.stringify(rawData)
    }

    return norm
  }

  private classifyAttack(text: string): string {
    const lower = text.toLowerCase()
    if (/failed password|invalid user|brute/.test(lower)) return 'brute_force'
    if (/union select|' or 1=1|sql syntax/.test(lower)) return 'sql_injection'
    if (/syn scan|nmap|port scan|masscan/.test(lower)) return 'port_scan'
    if (/malware|trojan|virus|ransomware|\.locked/.test(lower)) return 'malware'
    if (/phish|suspicious link/.test(lower)) return 'phishing'
    if (/sudo|privilege|escalat/.test(lower)) return 'privilege_escalation'
    if (/smb|lateral|pass.the.hash|mimikatz/.test(lower)) return 'lateral_movement'
    if (/dns tunnel|exfil/.test(lower)) return 'exfiltration'
    if (/accepted password|login success/.test(lower)) return 'login_success'
    return 'unknown'
  }
}

export const alertNormalizationService = new AlertNormalizationService()

// Hook up the pipeline runner
pipelineRunner.runNormalization = async (alertIds: string[]) => {
  await alertNormalizationService.normalizeBatch(alertIds)
}
