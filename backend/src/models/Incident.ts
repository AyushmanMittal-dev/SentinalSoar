import mongoose, { Document, Schema } from 'mongoose'

export interface IThreatIntelIndicator {
  indicator: string
  type: 'ip' | 'hash' | 'url'
  reputation: 'malicious' | 'suspicious' | 'clean' | 'unknown'
  reputationScore: number
  country?: string
  isp?: string
  vtMalicious?: number
  abuseConfidence?: number
  otxPulses?: number
  lat?: number
  lon?: number
}

export interface IIncident extends Document {
  incidentNumber: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'contained' | 'resolved' | 'false_positive'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  alertCount: number
  alertIds: mongoose.Types.ObjectId[]
  sourceIPs: string[]
  destinationIPs: string[]
  hostnames: string[]
  usernames: string[]
  eventTypes: string[]
  attackType: string
  firstSeen: Date
  lastSeen: Date
  pipeline: {
    ingested: boolean
    normalized: boolean
    correlated: boolean
    threatIntelDone: boolean
    aiAnalysisDone: boolean
    mitreMapped: boolean
    riskCalculated: boolean
    playbookSelected: boolean
    automationDone: boolean
  }
  threatIntel?: {
    indicators: IThreatIntelIndicator[]
    overallReputation: 'malicious' | 'suspicious' | 'clean' | 'unknown'
  }
  aiAnalysis?: {
    summary: string
    predictedSeverity: string
    mitigation: string[]
    executiveSummary: string
    confidence: number
    prompt?: string
    rawResponse?: string
    model: string
    generatedAt: Date
  }
  mitreMapping: Array<{
    techniqueId: string
    techniqueName: string
    tactic: string
    tacticId: string
    description: string
    mitigations: string[]
    url: string
  }>
  riskScore: number
  riskFactors?: {
    severityScore: number
    threatIntelScore: number
    mitreScore: number
    historyScore: number
    aiScore: number
  }
  playbookId?: mongoose.Types.ObjectId
  playbookName?: string
  automationStatus: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  actionIds: mongoose.Types.ObjectId[]
  assignedTo?: mongoose.Types.ObjectId
  notes?: string
  tags: string[]
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentNumber: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'contained', 'resolved', 'false_positive'],
      default: 'open',
      index: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      default: 'medium',
      index: true,
    },
    alertCount: { type: Number, default: 1 },
    alertIds: [{ type: Schema.Types.ObjectId, ref: 'Alert' }],
    sourceIPs: [String],
    destinationIPs: [String],
    hostnames: [String],
    usernames: [String],
    eventTypes: [String],
    attackType: { type: String, default: 'unknown', index: true },
    firstSeen: { type: Date, default: Date.now, index: true },
    lastSeen: { type: Date, default: Date.now },
    pipeline: {
      ingested: { type: Boolean, default: false },
      normalized: { type: Boolean, default: false },
      correlated: { type: Boolean, default: false },
      threatIntelDone: { type: Boolean, default: false },
      aiAnalysisDone: { type: Boolean, default: false },
      mitreMapped: { type: Boolean, default: false },
      riskCalculated: { type: Boolean, default: false },
      playbookSelected: { type: Boolean, default: false },
      automationDone: { type: Boolean, default: false },
    },
    threatIntel: {
      indicators: [Schema.Types.Mixed],
      overallReputation: { type: String, enum: ['malicious', 'suspicious', 'clean', 'unknown'], default: 'unknown' },
    },
    aiAnalysis: {
      summary: String,
      predictedSeverity: String,
      mitigation: [String],
      executiveSummary: String,
      confidence: { type: Number, default: 0 },
      prompt: String,
      rawResponse: String,
      model: String,
      generatedAt: Date,
    },
    mitreMapping: [Schema.Types.Mixed],
    riskScore: { type: Number, default: 0, index: true },
    riskFactors: Schema.Types.Mixed,
    playbookId: { type: Schema.Types.ObjectId, ref: 'Playbook' },
    playbookName: String,
    automationStatus: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
      default: 'pending',
    },
    actionIds: [{ type: Schema.Types.ObjectId, ref: 'Action' }],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    tags: [String],
    resolvedAt: Date,
  },
  { timestamps: true }
)

IncidentSchema.index({ createdAt: -1 })
IncidentSchema.index({ sourceIPs: 1 })
IncidentSchema.index({ hostnames: 1 })
IncidentSchema.index({ usernames: 1 })

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema)
