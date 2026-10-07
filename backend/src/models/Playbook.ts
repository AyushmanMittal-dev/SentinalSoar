import mongoose, { Document, Schema } from 'mongoose'

export interface IPlaybookCondition {
  field: string
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in'
  value: unknown
}

export interface IPlaybookAction {
  id: string
  type: 'blockIP' | 'disableUser' | 'killProcess' | 'quarantineFile' | 'notify' | 'generateTicket' | 'logOnly' | 'isolateHost'
  label: string
  params: Record<string, unknown>
  order: number
  continueOnError: boolean
}

export interface IPlaybook extends Document {
  name: string
  description: string
  icon: string
  color: string
  attackTypes: string[]
  severityLevels: string[]
  conditions: IPlaybookCondition[]
  actions: IPlaybookAction[]
  executionCount: number
  successRate: number
  isDefault: boolean
  isActive: boolean
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PlaybookSchema = new Schema<IPlaybook>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🛡️' },
    color: { type: String, default: '#06b6d4' },
    attackTypes: [String],
    severityLevels: [String],
    conditions: [Schema.Types.Mixed],
    actions: [Schema.Types.Mixed],
    executionCount: { type: Number, default: 0 },
    successRate: { type: Number, default: 100 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

export const Playbook = mongoose.model<IPlaybook>('Playbook', PlaybookSchema)
