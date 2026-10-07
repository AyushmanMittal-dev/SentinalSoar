import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/validateEnv'
import { Incident } from '../models/Incident'
import { logger } from '../utils/logger'

export class AIAnalysisService {
  private genAI: GoogleGenerativeAI | null = null

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    }
  }

  public async analyzeIncident(incidentId: string) {
    const incident = await Incident.findById(incidentId).populate('alertIds')
    if (!incident) throw new Error('Incident not found')

    const prompt = this.buildPrompt(incident)

    let analysisResult
    if (this.genAI && !env.FEATURE_MOCK_AI) {
      try {
        analysisResult = await this.callGemini(prompt)
      } catch (err) {
        logger.error(`Gemini API failed for incident ${incidentId}`, { error: (err as Error).message })
        analysisResult = this.getMockAnalysis(incident.attackType)
      }
    } else {
      analysisResult = this.getMockAnalysis(incident.attackType)
    }

    // Save back to incident
    incident.aiAnalysis = {
      ...analysisResult,
      prompt,
      model: env.FEATURE_MOCK_AI || !this.genAI ? 'mock-ai' : env.GEMINI_MODEL,
      generatedAt: new Date()
    }
    incident.pipeline.aiAnalysisDone = true
    await incident.save()

    return incident.aiAnalysis
  }

  private buildPrompt(incident: any): string {
    return `
      You are an expert SOC Analyst. Analyze the following security incident and return a JSON response.
      Do not include markdown blocks, just return raw JSON matching this schema:
      {
        "summary": "String (1-2 sentences explaining what happened)",
        "predictedSeverity": "critical | high | medium | low | info",
        "mitigation": ["String (action 1)", "String (action 2)"],
        "executiveSummary": "String (Non-technical summary for management)",
        "confidence": Number (0.0 to 1.0)
      }

      INCIDENT DETAILS:
      Title: ${incident.title}
      Attack Type: ${incident.attackType}
      Source IPs: ${incident.sourceIPs.join(', ')}
      Target Hostnames: ${incident.hostnames.join(', ')}
      Threat Intel Reputation: ${incident.threatIntel?.overallReputation || 'unknown'}
      Total Alerts: ${incident.alertCount}
    `
  }

  private async callGemini(prompt: string) {
    if (!this.genAI) throw new Error('GenAI not initialized')
    const model = this.genAI.getGenerativeModel({ model: env.GEMINI_MODEL })
    
    // Add timeout handling
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), env.GEMINI_TIMEOUT_MS)

    try {
      // Note: the Gemini SDK currently doesn't directly support AbortSignal in all methods,
      // but we wrap the promise to enforce timeout
      const resultPromise = model.generateContent(prompt)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), env.GEMINI_TIMEOUT_MS)
      })

      const result = await Promise.race([resultPromise, timeoutPromise]) as any
      clearTimeout(timeout)
      
      const responseText = result.response.text()
      // Strip markdown json blocks if present
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
      
      const parsed = JSON.parse(cleanJson)
      return {
        summary: parsed.summary || 'Analysis completed',
        predictedSeverity: parsed.predictedSeverity || 'medium',
        mitigation: parsed.mitigation || [],
        executiveSummary: parsed.executiveSummary || '',
        confidence: parsed.confidence || 0.8,
        rawResponse: responseText
      }
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }

  private getMockAnalysis(attackType: string) {
    const mocks: Record<string, any> = {
      brute_force: {
        summary: 'Multiple failed authentication attempts detected from a single source, followed by a potential success, indicating a password spraying or brute force attack.',
        predictedSeverity: 'high',
        mitigation: ['Block source IP at the external firewall', 'Force password reset for targeted users', 'Enable MFA for affected accounts'],
        executiveSummary: 'An attacker attempted to guess user passwords and may have gained access. Immediate password resets and IP blocking are recommended.',
        confidence: 0.95,
      },
      sql_injection: {
        summary: 'Suspicious HTTP requests containing SQL syntax payloads were observed targeting the web application backend.',
        predictedSeverity: 'critical',
        mitigation: ['Deploy WAF rules to block SQLi signatures', 'Audit application code for parameterized queries', 'Review database logs for exfiltration'],
        executiveSummary: 'Attackers are probing the web application database. Immediate WAF rule deployment is required to prevent data theft.',
        confidence: 0.9,
      },
      malware: {
        summary: 'A file hash matching known malware families was detected executing on an endpoint.',
        predictedSeverity: 'critical',
        mitigation: ['Isolate the infected host from the network', 'Quarantine the malicious file', 'Run full EDR sweep on the network'],
        executiveSummary: 'Known malware has been detected on an internal machine. The machine should be immediately disconnected to prevent spreading.',
        confidence: 0.99,
      }
    }

    const fallback = {
      summary: 'Anomalous activity detected matching suspicious patterns.',
      predictedSeverity: 'medium',
      mitigation: ['Investigate source IP reputation', 'Review related logs around the timestamp'],
      executiveSummary: 'Unusual activity was observed that requires manual analyst review.',
      confidence: 0.6,
    }

    return mocks[attackType] || fallback
  }
}

export const aiAnalysisService = new AIAnalysisService()
