export const CONSTANTS = {
  // App
  API_VERSION: 'v1',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Time
  TIME_WINDOW_MINUTES: 30, // Default window for correlation

  // Security
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 mins

  // Priorities
  PRIORITY: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info',
  },

  // Incident Status
  STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    CONTAINED: 'contained',
    RESOLVED: 'resolved',
    FALSE_POSITIVE: 'false_positive',
  },

  // Automation
  AUTOMATION_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
  },
}
