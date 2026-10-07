import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  passwordHash: string
  name: string
  role: 'admin' | 'analyst' | 'viewer'
  avatar: string
  isActive: boolean
  lastLogin?: Date
  preferences: {
    emailNotifications: boolean
    slackNotifications: boolean
    theme: 'dark' | 'light'
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      slackNotifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    },
  },
  { timestamps: true }
)

UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

export const User = mongoose.model<IUser>('User', UserSchema)
