import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'analyst', 'viewer']).optional(),
})

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const incidentFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
  severity: z.string().optional(),
  attackType: z.string().optional(),
  search: z.string().optional(),
})

export const geminiResponseSchema = z.object({
  summary: z.string(),
  predictedSeverity: z.string(),
  mitigation: z.array(z.string()),
  executiveSummary: z.string(),
  confidence: z.number().min(0).max(1),
})
