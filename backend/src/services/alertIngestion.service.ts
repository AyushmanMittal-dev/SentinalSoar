import fs from 'fs'
import csvParser from 'csv-parser'
import xml2js from 'xml2js'
import { v4 as uuidv4 } from 'uuid'
import { Alert } from '../models/Alert'
import { pipelineRunner } from '../utils/pipelineRunner'
import { ValidationError } from '../utils/AppError'

class AlertIngestionService {
  public async uploadAlert(file: Express.Multer.File, userId: string) {
    const format = this.detectFormat(file.originalname)
    const records = await this.parseFile(file.path, format)

    if (records.length === 0) {
      fs.unlinkSync(file.path)
      throw new ValidationError('File contains no valid records')
    }

    const alertsToInsert = records.map(r => ({
      rawData: r,
      source: format,
      fileName: file.originalname,
      uploadedBy: userId,
    }))

    const inserted = await Alert.insertMany(alertsToInsert)
    const alertIds = inserted.map(a => a._id.toString())

    // Fire off async normalisation
    pipelineRunner.runNormalization(alertIds).catch(console.error)

    // Clean up temp file
    fs.unlinkSync(file.path)

    return {
      jobId: uuidv4(),
      uploaded: records.length,
      fileName: file.originalname
    }
  }

  private detectFormat(filename: string): 'csv' | 'json' | 'syslog' | 'windows' | 'apache' | 'ssh' | 'unknown' {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.csv')) return 'csv'
    if (lower.endsWith('.json')) return 'json'
    if (lower.endsWith('.xml') || lower.endsWith('.evtx')) return 'windows'
    if (lower.includes('auth')) return 'ssh'
    if (lower.includes('access')) return 'apache'
    if (lower.endsWith('.log') || lower.includes('syslog')) return 'syslog'
    return 'unknown'
  }

  private async parseFile(filePath: string, format: string): Promise<Record<string, unknown>[]> {
    switch (format) {
      case 'csv': return this.parseCSV(filePath)
      case 'json': return this.parseJSON(filePath)
      case 'windows': return this.parseWindows(filePath)
      case 'syslog':
      case 'apache':
      case 'ssh':
      case 'unknown':
        return this.parseLines(filePath, format)
      default:
        return []
    }
  }

  private parseCSV(filePath: string): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = []
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject)
    })
  }

  private async parseJSON(filePath: string): Promise<Record<string, unknown>[]> {
    const data = await fs.promises.readFile(filePath, 'utf-8')
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      throw new ValidationError('Invalid JSON file format')
    }
  }

  private async parseWindows(filePath: string): Promise<Record<string, unknown>[]> {
    const data = await fs.promises.readFile(filePath, 'utf-8')
    try {
      const parsed = await xml2js.parseStringPromise(data)
      // Extract Event elements
      const events = parsed.Events?.Event || parsed.Event || []
      return Array.isArray(events) ? events : [events]
    } catch {
      throw new ValidationError('Invalid XML/Windows Event format')
    }
  }

  private async parseLines(filePath: string, format: string): Promise<Record<string, unknown>[]> {
    const data = await fs.promises.readFile(filePath, 'utf-8')
    const lines = data.split(/\r?\n/).filter(line => line.trim().length > 0)
    
    return lines.map(line => {
      // Basic fallback wrapper for plain text lines
      if (format === 'ssh') return { rawLine: line, _type: 'ssh_log' }
      if (format === 'apache') return { rawLine: line, _type: 'apache_log' }
      return { rawLine: line, _type: 'syslog' }
    })
  }
}

export const alertIngestionService = new AlertIngestionService()
