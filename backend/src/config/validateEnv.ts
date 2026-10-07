import dotenv from 'dotenv'
dotenv.config()

import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),

  MONGODB_URI: z.string().min(10, 'MONGODB_URI is required'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.coerce.boolean().default(false),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  GEMINI_TIMEOUT_MS: z.coerce.number().default(10000),
  GEMINI_MAX_RETRIES: z.coerce.number().default(2),

  VIRUSTOTAL_API_KEY: z.string().optional(),
  VIRUSTOTAL_BASE_URL: z.string().default('https://www.virustotal.com/api/v3'),
  VIRUSTOTAL_RATE_LIMIT_RPM: z.coerce.number().default(4),

  ABUSEIPDB_API_KEY: z.string().optional(),
  ABUSEIPDB_BASE_URL: z.string().default('https://api.abuseipdb.com/api/v2'),
  ABUSEIPDB_MAX_AGE_DAYS: z.coerce.number().default(90),

  OTX_API_KEY: z.string().optional(),
  OTX_BASE_URL: z.string().default('https://otx.alienvault.com/api/v1'),

  GEOIP_BASE_URL: z.string().default('http://ip-api.com/json'),
  GEOIP_PRO_KEY: z.string().optional(),

  SMTP_ENABLED: z.coerce.boolean().default(false),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('SentinelSOAR <noreply@sentinel.io>'),
  SMTP_TIMEOUT_MS: z.coerce.number().default(5000),

  SLACK_WEBHOOK_URL: z.string().optional(),
  SLACK_CHANNEL: z.string().default('#security-alerts'),
  DISCORD_WEBHOOK_URL: z.string().optional(),

  UPLOAD_DIR: z.string().default('./uploads/logs'),
  REPORTS_DIR: z.string().default('./uploads/reports'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  ALLOWED_FILE_TYPES: z.string().default('.csv,.json,.log,.txt,.xml'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),
  UPLOAD_RATE_LIMIT_MAX: z.coerce.number().default(10),

  SEED_ON_STARTUP: z.coerce.boolean().default(true),
  SEED_FORCE: z.coerce.boolean().default(false),

  FEATURE_MOCK_THREAT_INTEL: z.coerce.boolean().default(true),
  FEATURE_MOCK_AI: z.coerce.boolean().default(true),
  FEATURE_SIMULATION_DELAY: z.coerce.boolean().default(true),
  SIMULATION_DELAY_MS: z.coerce.number().default(150),
  FEATURE_DEMO_ENDPOINTS: z.coerce.boolean().default(true),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment configuration:')
    result.error.issues.forEach(issue => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }
  const optionalKeys = ['GEMINI_API_KEY', 'VIRUSTOTAL_API_KEY', 'ABUSEIPDB_API_KEY', 'OTX_API_KEY']
  const missing = optionalKeys.filter(k => !process.env[k])
  if (missing.length > 0) {
    console.warn(`⚠  Optional API keys missing: ${missing.join(', ')} — mock fallbacks will be used`)
  }
  return result.data
}

export const env = validateEnv()
