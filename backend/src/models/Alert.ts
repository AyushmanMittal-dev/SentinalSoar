import mongoose, { Document, Schema } from 'mongoose'

export interface INormalizedData {
  timestamp?: Date
  sourceIP?: string
  destinationIP?: string
  hostname?: string
  username?: string
  severity?: string
  eventType?: string
  port?: number
  protocol?: string
  message?: string
  attackType?: string
}

export interface IAlert extends Document {
  rawData: Record<string, unknown>
  source: 'csv' | 'json' | 'syslog' | 'windows' | 'apache' | 'ssh' | 'unknown'
  fileName: string
  uploadedBy: mongoose.Types.ObjectId
  normalized: boolean
  normalizedData?: INormalizedData
  incidentId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const NormalizedDataSchema = new Schema<INormalizedData>(
  {
    timestamp: Date,
    sourceIP: String,
    destinationIP: String,
    hostname: String,
    username: String,
    severity: String,
    eventType: String,
    port: Number,
    protocol: String,
    message: String,
    attackType: String,
  },
  { _id: false }
)

const AlertSchema = new Schema<IAlert>(
  {
    rawData: { type: Schema.Types.Mixed, required: true },
    source: {
      type: String,
      enum: ['csv', 'json', 'syslog', 'windows', 'apache', 'ssh', 'unknown'],
      default: 'unknown',
    },
    fileName: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    normalized: { type: Boolean, default: false, index: true },
    normalizedData: NormalizedDataSchema,
    incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', index: true },
  },
  { timestamps: true }
)

AlertSchema.index({ createdAt: -1 })
AlertSchema.index({ 'normalizedData.sourceIP': 1 })
AlertSchema.index({ 'normalizedData.attackType': 1 })

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema)
