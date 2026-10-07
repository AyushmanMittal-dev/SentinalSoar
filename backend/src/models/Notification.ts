import mongoose, { Document, Schema } from 'mongoose'

export interface INotification extends Document {
  incidentId: mongoose.Types.ObjectId
  channel: 'email' | 'slack' | 'discord' | 'websocket' | 'internal'
  recipient: string
  subject: string
  message: string
  payload?: Record<string, unknown>
  status: 'sent' | 'failed' | 'pending' | 'simulated'
  sentAt?: Date
  error?: string
  retryCount: number
}

const NotificationSchema = new Schema<INotification>(
  {
    incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
    channel: {
      type: String,
      enum: ['email', 'slack', 'discord', 'websocket', 'internal'],
      required: true,
    },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending', 'simulated'],
      default: 'pending',
      index: true,
    },
    sentAt: Date,
    error: String,
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
