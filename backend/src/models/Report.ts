import mongoose, { Document, Schema } from 'mongoose'

export interface IReport extends Document {
  incidentId: mongoose.Types.ObjectId
  type: 'executive' | 'technical' | 'timeline'
  format: 'pdf'
  fileName: string
  filePath: string
  fileSize: number
  generatedBy: mongoose.Types.ObjectId
  generatedAt: Date
  metadata: {
    incidentNumber?: string
    severity?: string
    riskScore?: number
    pageCount?: number
  }
  downloadCount: number
}

const ReportSchema = new Schema<IReport>({
  incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
  type: { type: String, enum: ['executive', 'technical', 'timeline'], required: true },
  format: { type: String, default: 'pdf' },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} },
  downloadCount: { type: Number, default: 0 },
})

export const Report = mongoose.model<IReport>('Report', ReportSchema)
