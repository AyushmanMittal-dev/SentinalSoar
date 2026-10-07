import { Incident } from '../models/Incident'
import { Action } from '../models/Action'
import { io } from '../index'
import { logger } from '../utils/logger'

class AutomationService {
  public async executePlaybook(playbook: any, incident: any) {
    incident.automationStatus = 'running'
    await incident.save()
    
    io.emit('automation_started', { incidentId: incident._id, playbookName: playbook.name })

    const actions = playbook.actions.sort((a: any, b: any) => a.order - b.order)
    let allSuccess = true

    for (const actionDef of actions) {
      const actionDoc = await Action.create({
        incidentId: incident._id,
        playbookId: playbook._id,
        type: actionDef.type,
        label: actionDef.label,
        params: actionDef.params,
        status: 'running',
        simulationOutput: [`[${new Date().toLocaleTimeString()}] ⚙ Executing: ${actionDef.type}(${JSON.stringify(actionDef.params)})`],
        executedAt: new Date()
      })

      incident.actionIds.push(actionDoc._id)
      await incident.save()

      try {
        const result = await this.simulateAction(actionDef, incident, actionDoc)
        
        actionDoc.status = 'simulated' // we use 'simulated' instead of 'success' for UI clarity
        actionDoc.simulationOutput = result.output
        actionDoc.result = result.data
        actionDoc.completedAt = new Date()
        actionDoc.duration = actionDoc.completedAt.getTime() - actionDoc.executedAt.getTime()
        await actionDoc.save()
        
        io.emit('action_completed', { actionId: actionDoc._id, status: 'simulated' })
      } catch (err) {
        actionDoc.status = 'failed'
        actionDoc.error = (err as Error).message
        actionDoc.completedAt = new Date()
        await actionDoc.save()
        io.emit('action_completed', { actionId: actionDoc._id, status: 'failed' })

        if (!actionDef.continueOnError) {
          allSuccess = false
          break
        }
      }
    }

    incident.automationStatus = allSuccess ? 'completed' : 'failed'
    incident.pipeline.automationDone = true
    await incident.save()
    io.emit('automation_finished', { incidentId: incident._id, status: incident.automationStatus })
  }

  private async simulateAction(actionDef: any, incident: any, actionDoc: any) {
    // Artificial delay to simulate real execution and allow UI streaming
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))
    
    const output = [...actionDoc.simulationOutput]
    const now = () => `[${new Date().toLocaleTimeString()}]`

    switch (actionDef.type) {
      case 'blockIP': {
        const ip = actionDef.params.ip || incident.sourceIPs[0] || 'unknown_ip'
        output.push(`${now()} $ iptables -A INPUT -s ${ip} -j DROP`)
        output.push(`${now()} ✓ Rule added to iptables chain INPUT`)
        output.push(`${now()} $ ip route add blackhole ${ip}/32`)
        output.push(`${now()} ✅ IP ${ip} successfully blocked [SIMULATED]`)
        return { output, data: { ipBlocked: ip } }
      }
      case 'disableUser': {
        const user = actionDef.params.username || incident.usernames[0] || 'unknown_user'
        output.push(`${now()} $ net user ${user} /active:no`)
        output.push(`${now()} ✓ Active Directory API call successful`)
        output.push(`${now()} ✅ User ${user} disabled [SIMULATED]`)
        return { output, data: { userDisabled: user } }
      }
      case 'notify': {
        output.push(`${now()} ⚙ Sending notifications via configured channels...`)
        output.push(`${now()} ✓ WebSocket broadcast → 2 active analysts`)
        if (actionDef.params.slack) output.push(`${now()} ✓ Slack webhook → ${actionDef.params.slackChannel}`)
        if (actionDef.params.email) output.push(`${now()} ✓ Email → ${actionDef.params.emailAddress}`)
        output.push(`${now()} ✅ All notifications dispatched`)
        return { output, data: { notified: true } }
      }
      default:
        output.push(`${now()} ✅ Action ${actionDef.type} executed [SIMULATED]`)
        return { output, data: {} }
    }
  }
}

export const automationService = new AutomationService()
