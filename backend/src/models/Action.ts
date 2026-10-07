import mongoose, { Document, Schema } from 'mongoose'

export interface IAction extends Document {
  incidentId: mongoose.Types.ObjectId
  playbookId?: mongoose.Types.ObjectId
  type: string
  label: string
  params: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'failed' | 'simulated' | 'skipped'
  simulationOutput: string[]
  result?: Record<string, unknown>
  error?: string
  executedAt: Date
  completedAt?: Date
  duration?: number
}

const ActionSchema = new Schema<IAction>({
  incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
  playbookId: { type: Schema.Types.ObjectId, ref: 'Playbook' },
  type: { type: String, required: true },
  label: { type: String, default: '' },
  params: { type: Schema.Types.Mixed, default: {} },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed', 'simulated', 'skipped'],
    default: 'pending',
  },
  simulationOutput: [String],
  result: Schema.Types.Mixed,
  error: String,
  executedAt: { type: Date, default: Date.now },
  completedAt: Date,
  duration: Number,
})

export const Action = mongoose.model<IAction>('Action', ActionSchema)
