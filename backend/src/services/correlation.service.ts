import mongoose from 'mongoose'
import { Alert, INormalizedData } from '../models/Alert'
import { Incident } from '../models/Incident'
import { CONSTANTS } from '../config/constants'
import { pipelineRunner } from '../utils/pipelineRunner'
import { io } from '../index'

class CorrelationEngine {
  /**
   * Evaluates a newly normalized alert against open incidents.
   * Groups by Source IP and Attack Type within a time window.
   */
  public async correlateAlert(alertId: string, normData: INormalizedData) {
    const timeWindow = new Date()
    timeWindow.setMinutes(timeWindow.getMinutes() - CONSTANTS.TIME_WINDOW_MINUTES)

    // 1. Try to find an existing open incident that matches signature + time window
    const query = {
      status: { $in: ['open', 'in_progress'] },
      attackType: normData.attackType || 'unknown',
      lastSeen: { $gte: timeWindow },
      $or: [
        { sourceIPs: normData.sourceIP },
        { hostnames: normData.hostname }
      ]
    }

    let incident = await Incident.findOne(query)

    if (incident) {
      // 2a. Update existing incident
      await this.addToIncident(incident, alertId, normData)
    } else {
      // 2b. Create new incident
      incident = await this.createNewIncident(alertId, normData)
      // Fire enrichment pipeline for new incidents
      pipelineRunner.runEnrichment(incident._id.toString()).catch(console.error)
    }

    // Push socket event
    io.emit('incident_updated', {
      incidentId: incident._id,
      attackType: incident.attackType,
      alertCount: incident.alertCount
    })
  }

  private async addToIncident(incident: any, alertId: string, normData: INormalizedData) {
    const update: any = {
      $inc: { alertCount: 1 },
      $push: { alertIds: alertId },
      $set: { lastSeen: new Date() }
    }

    if (normData.sourceIP && !incident.sourceIPs.includes(normData.sourceIP)) {
      update.$addToSet = update.$addToSet || {}
      update.$addToSet.sourceIPs = normData.sourceIP
    }
    if (normData.destinationIP && !incident.destinationIPs.includes(normData.destinationIP)) {
      update.$addToSet = update.$addToSet || {}
      update.$addToSet.destinationIPs = normData.destinationIP
    }
    if (normData.username && normData.username !== 'unknown' && !incident.usernames.includes(normData.username)) {
      update.$addToSet = update.$addToSet || {}
      update.$addToSet.usernames = normData.username
    }
    if (normData.eventType && !incident.eventTypes.includes(normData.eventType)) {
      update.$addToSet = update.$addToSet || {}
      update.$addToSet.eventTypes = normData.eventType
    }

    await Incident.findByIdAndUpdate(incident._id, update)
    await Alert.findByIdAndUpdate(alertId, { incidentId: incident._id })
  }

  private async createNewIncident(alertId: string, normData: INormalizedData) {
    const incidentNumber = `INC-${Math.floor(Date.now() / 1000).toString(16).toUpperCase()}`
    
    let title = `${normData.attackType.replace(/_/g, ' ').toUpperCase()} attack detected`
    if (normData.sourceIP && normData.sourceIP !== '0.0.0.0') {
      title += ` from ${normData.sourceIP}`
    }

    const incident = await Incident.create({
      incidentNumber,
      title,
      description: normData.message || 'Auto-generated incident from correlated alerts.',
      status: 'open',
      severity: normData.severity || 'medium',
      alertCount: 1,
      alertIds: [new mongoose.Types.ObjectId(alertId)],
      sourceIPs: normData.sourceIP && normData.sourceIP !== '0.0.0.0' ? [normData.sourceIP] : [],
      destinationIPs: normData.destinationIP && normData.destinationIP !== '0.0.0.0' ? [normData.destinationIP] : [],
      hostnames: normData.hostname && normData.hostname !== 'unknown' ? [normData.hostname] : [],
      usernames: normData.username && normData.username !== 'unknown' ? [normData.username] : [],
      eventTypes: normData.eventType ? [normData.eventType] : [],
      attackType: normData.attackType || 'unknown',
      firstSeen: normData.timestamp || new Date(),
      lastSeen: new Date(),
      pipeline: {
        ingested: true,
        normalized: true,
        correlated: true,
        threatIntelDone: false,
        aiAnalysisDone: false,
        mitreMapped: false,
        riskCalculated: false,
        playbookSelected: false,
        automationDone: false
      }
    })

    await Alert.findByIdAndUpdate(alertId, { incidentId: incident._id })
    return incident
  }
}

export const correlationEngine = new CorrelationEngine()

// Hook into pipeline
pipelineRunner.runCorrelation = async (normData: INormalizedData, alertId: string) => {
  await correlationEngine.correlateAlert(alertId, normData)
}
