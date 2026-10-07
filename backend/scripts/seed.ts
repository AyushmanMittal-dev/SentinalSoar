import mongoose from 'mongoose'
import { config } from 'dotenv'
import { env } from '../src/config/validateEnv'
import { Incident } from '../src/models/Incident'
import { Alert } from '../src/models/Alert'

config()

const run = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(env.MONGODB_URI || 'mongodb://localhost:27017/sentinel-soar')
    console.log('Connected.')

    console.log('Clearing existing data...')
    await Incident.deleteMany({})
    await Alert.deleteMany({})

    const incidents = [
      {
        incidentNumber: 'INC-1A2B3C4',
        title: 'Multiple Failed SSH Logins',
        description: 'Repeated authentication failures detected from external IP.',
        status: 'open',
        severity: 'high',
        alertCount: 15,
        sourceIPs: ['192.168.1.100', '203.0.113.50'],
        destinationIPs: ['10.0.0.5'],
        hostnames: ['jump-server-01'],
        usernames: ['root', 'admin'],
        eventTypes: ['authentication_failure'],
        attackType: 'brute_force',
        firstSeen: new Date(Date.now() - 3600000),
        lastSeen: new Date(),
        pipeline: {
          ingested: true,
          normalized: true,
          correlated: true,
          threatIntelDone: true,
          aiAnalysisDone: true,
          mitreMapped: true,
          riskCalculated: true,
          playbookSelected: false,
          automationDone: false
        },
        threatIntel: {
          overallReputation: 'suspicious',
          indicators: [
            { indicator: '203.0.113.50', type: 'ip', reputation: 'suspicious', reputationScore: 45, country: 'RU', vtMalicious: 2, abuseConfidence: 30 }
          ]
        },
        aiAnalysis: {
          summary: 'A coordinated brute force attack attempting to guess credentials on the jump server.',
          predictedSeverity: 'high',
          mitigation: ['Block 203.0.113.50 on the external firewall.', 'Ensure key-based auth is enforced on SSH.'],
          executiveSummary: 'External actors are trying to breach our perimeter via SSH. Standard mitigations apply.',
          confidence: 0.88,
          generatedAt: new Date()
        }
      },
      {
        incidentNumber: 'INC-9F8E7D6',
        title: 'SQL Injection Payload Detected',
        description: 'WAF blocked multiple requests containing union select statements.',
        status: 'in_progress',
        severity: 'critical',
        alertCount: 3,
        sourceIPs: ['198.51.100.12'],
        destinationIPs: ['10.0.0.10'],
        hostnames: ['web-frontend-prod'],
        usernames: [],
        eventTypes: ['waf_block'],
        attackType: 'sql_injection',
        firstSeen: new Date(Date.now() - 7200000),
        lastSeen: new Date(Date.now() - 3600000),
        pipeline: {
          ingested: true,
          normalized: true,
          correlated: true,
          threatIntelDone: true,
          aiAnalysisDone: true,
          mitreMapped: true,
          riskCalculated: true,
          playbookSelected: true,
          automationDone: false
        },
        threatIntel: {
          overallReputation: 'malicious',
          indicators: [
            { indicator: '198.51.100.12', type: 'ip', reputation: 'malicious', reputationScore: 89, country: 'CN', vtMalicious: 15, abuseConfidence: 100 }
          ]
        },
        aiAnalysis: {
          summary: 'High confidence SQL injection attempt against the main web application.',
          predictedSeverity: 'critical',
          mitigation: ['Verify WAF rules are active in blocking mode.', 'Review application code for vulnerable endpoints.'],
          executiveSummary: 'An automated scan attempted to dump the database. The WAF successfully intercepted it.',
          confidence: 0.95,
          generatedAt: new Date()
        }
      },
      {
        incidentNumber: 'INC-4B5A6C7',
        title: 'Suspicious Network Scanning',
        description: 'Internal endpoint performing rapid port scans across the subnet.',
        status: 'resolved',
        severity: 'medium',
        alertCount: 450,
        sourceIPs: ['10.0.0.22'],
        destinationIPs: [],
        hostnames: ['dev-workstation-03'],
        usernames: ['jdoe'],
        eventTypes: ['network_scan'],
        attackType: 'port_scan',
        firstSeen: new Date(Date.now() - 86400000), // 1 day ago
        lastSeen: new Date(Date.now() - 80000000),
        resolvedAt: new Date(Date.now() - 50000000),
        pipeline: {
          ingested: true,
          normalized: true,
          correlated: true,
          threatIntelDone: true,
          aiAnalysisDone: true,
          mitreMapped: true,
          riskCalculated: true,
          playbookSelected: true,
          automationDone: true
        },
        threatIntel: {
          overallReputation: 'clean',
          indicators: []
        },
        aiAnalysis: {
          summary: 'Internal port scan detected originating from a developer workstation.',
          predictedSeverity: 'medium',
          mitigation: ['Investigate if scanning was authorized.', 'Isolate endpoint if unauthorized.'],
          executiveSummary: 'A developer workstation was observed scanning the internal network. This was determined to be an authorized vulnerability scan.',
          confidence: 0.75,
          generatedAt: new Date()
        }
      }
    ]

    console.log('Inserting mock incidents...')
    await Incident.insertMany(incidents)
    console.log('Mock data inserted successfully.')

    process.exit(0)
  } catch (err) {
    console.error('Error inserting mock data:', err)
    process.exit(1)
  }
}

run()
