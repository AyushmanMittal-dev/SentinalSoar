import { Incident } from '../models/Incident'
import { Playbook } from '../models/Playbook'
import { automationService } from './automation.service'

class PlaybookService {
  public async selectPlaybookForIncident(incidentId: string) {
    const incident = await Incident.findById(incidentId)
    if (!incident) throw new Error('Incident not found')

    // Find active playbooks that match attack type and severity
    const playbooks = await Playbook.find({
      isActive: true,
      $and: [
        {
          $or: [
            { attackTypes: incident.attackType },
            { attackTypes: 'any' }
          ]
        },
        {
          $or: [
            { severityLevels: incident.severity },
            { severityLevels: 'any' }
          ]
        }
      ]
    })

    // Filter by conditions
    let selectedPlaybook = null
    for (const pb of playbooks) {
      if (this.evaluateConditions(pb.conditions, incident)) {
        selectedPlaybook = pb
        break // Pick the first matched playbook
      }
    }

    if (selectedPlaybook) {
      incident.playbookId = selectedPlaybook._id
      incident.playbookName = selectedPlaybook.name
      incident.pipeline.playbookSelected = true
      await incident.save()

      // Trigger automation execution
      await automationService.executePlaybook(selectedPlaybook, incident)
      return selectedPlaybook
    } else {
      incident.pipeline.playbookSelected = true
      incident.automationStatus = 'skipped'
      await incident.save()
      return null
    }
  }

  private evaluateConditions(conditions: any[], incident: any): boolean {
    if (!conditions || conditions.length === 0) return true
    
    return conditions.every(c => {
      const fieldVal = incident[c.field]
      switch (c.operator) {
        case 'eq': return fieldVal === c.value
        case 'gt': return fieldVal > c.value
        case 'lt': return fieldVal < c.value
        case 'gte': return fieldVal >= c.value
        case 'lte': return fieldVal <= c.value
        case 'contains': return Array.isArray(fieldVal) ? fieldVal.includes(c.value) : String(fieldVal).includes(c.value)
        case 'in': return Array.isArray(c.value) && c.value.includes(fieldVal)
        default: return false
      }
    })
  }
}

export const playbookService = new PlaybookService()
