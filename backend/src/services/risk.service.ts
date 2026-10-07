import { Incident } from '../models/Incident'

class RiskService {
  public async calculateRisk(incidentId: string) {
    const incident = await Incident.findById(incidentId)
    if (!incident) throw new Error('Incident not found')

    let severityScore = 0
    switch (incident.severity) {
      case 'critical': severityScore = 40; break
      case 'high': severityScore = 30; break
      case 'medium': severityScore = 20; break
      case 'low': severityScore = 10; break
      case 'info': severityScore = 0; break
    }

    let threatIntelScore = 0
    if (incident.threatIntel) {
      if (incident.threatIntel.overallReputation === 'malicious') threatIntelScore = 25
      else if (incident.threatIntel.overallReputation === 'suspicious') threatIntelScore = 15
    }

    const mitreScore = Math.min((incident.mitreMapping?.length || 0) * 5, 15)
    
    let historyScore = 0
    if (incident.alertCount > 100) historyScore = 10
    else if (incident.alertCount > 10) historyScore = 5

    let aiScore = 0
    if (incident.aiAnalysis?.predictedSeverity === 'critical') aiScore = 10
    else if (incident.aiAnalysis?.predictedSeverity === 'high') aiScore = 5

    const riskScore = Math.min(severityScore + threatIntelScore + mitreScore + historyScore + aiScore, 100)

    incident.riskScore = riskScore
    incident.riskFactors = {
      severityScore,
      threatIntelScore,
      mitreScore,
      historyScore,
      aiScore
    }
    
    incident.pipeline.riskCalculated = true
    await incident.save()

    return riskScore
  }
}

export const riskService = new RiskService()
