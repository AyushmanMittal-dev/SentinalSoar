import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

const { combine, timestamp, colorize, printf, json, errors } = winston.format

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
  return `${ts} [${level}]: ${message}${metaStr}`
})

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    // Console — colourised in dev
    new winston.transports.Console({
      format: combine(colorize(), devFormat),
    }),
    // Daily rotating file — JSON for parsing
    new DailyRotateFile({
      dirname: path.join(process.cwd(), 'logs'),
      filename: 'sentinel-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      maxSize: '20m',
      format: combine(json()),
    }),
  ],
})

// HTTP request logger stream for Morgan
export const httpLogStream = {
  write: (message: string) => logger.http(message.trim()),
}
