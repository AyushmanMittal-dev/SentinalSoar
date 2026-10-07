import { logger } from './logger'
import { io } from '../index'
import { Incident } from '../models/Incident'
// These are injected at runtime by the services to avoid circular dependencies
// but we declare the types here for clarity.
type NormalizationFn = (alertIds: string[]) => Promise<void>
type CorrelationFn = (normData: any, alertId: string) => Promise<void>

import { threatIntelService } from '../services/threatIntel.service'
import { aiAnalysisService } from '../services/aiAnalysis.service'
import { mitreMappingService } from '../services/mitreMapping.service'
import { riskService } from '../services/risk.service'
import { playbookService } from '../services/playbook.service'

class PipelineRunner {
  public runNormalization: NormalizationFn = async () => {}
  public runCorrelation: CorrelationFn = async () => {}

  public async runEnrichment(incidentId: string) {
    try {
      logger.info(`Pipeline: Starting enrichment for incident ${incidentId}`)
      const incident = await Incident.findById(incidentId)
      if (!incident) return

      // 1. Threat Intel Gathering
      const indicators = []
      for (const ip of incident.sourceIPs) {
        indicators.push({ val: ip, type: 'ip' as const })
      }
      // Add domains/hashes if available in the future...

      const tiResults = []
      for (const ind of indicators) {
        const result = await threatIntelService.lookupIndicator(ind.val, ind.type)
        tiResults.push(result)
      }

      const maliciousCount = tiResults.filter(r => r.reputation === 'malicious').length
      const suspiciousCount = tiResults.filter(r => r.reputation === 'suspicious').length
      
      const overallReputation = maliciousCount > 0 ? 'malicious' 
        : suspiciousCount > 0 ? 'suspicious' 
        : tiResults.length > 0 ? 'clean' : 'unknown'

      incident.threatIntel = {
        indicators: tiResults,
        overallReputation
      }
      incident.pipeline.threatIntelDone = true
      await incident.save()

      // 2. AI Analysis
      await this.runAIAnalysis(incidentId)

      // 3. MITRE Mapping
      await this.runMITREMapping(incidentId)

      // 4. Trigger Phase 3 (Response Engine) - Risk & Playbooks
      await this.runRiskCalculation(incidentId)

      // Notify Frontend
      io.emit('incident_enriched', { incidentId })

    } catch (err) {
      logger.error(`Pipeline Enrichment failed for ${incidentId}`, { error: (err as Error).message })
    }
  }

  public async runAIAnalysis(incidentId: string) {
    logger.info(`Pipeline: Starting AI analysis for incident ${incidentId}`)
    await aiAnalysisService.analyzeIncident(incidentId)
  }

  public async runMITREMapping(incidentId: string) {
    logger.info(`Pipeline: Starting MITRE mapping for incident ${incidentId}`)
    await mitreMappingService.mapIncident(incidentId)
  }

  public async runRiskCalculation(incidentId: string) {
    logger.info(`Pipeline: Starting Risk Calculation for incident ${incidentId}`)
    await riskService.calculateRisk(incidentId)
    
    // Immediately after risk calculation, we select a playbook
    await this.runPlaybookSelection(incidentId)
  }

  public async runPlaybookSelection(incidentId: string) {
    logger.info(`Pipeline: Starting Playbook Selection for incident ${incidentId}`)
    await playbookService.selectPlaybookForIncident(incidentId)
  }
}

export const pipelineRunner = new PipelineRunner()

