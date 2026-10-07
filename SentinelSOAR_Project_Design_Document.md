# SentinelSOAR: Intelligent Security Orchestration, Automation and Response Platform

## Executive Summary

SentinelSOAR is a full-stack, AI-assisted SOAR platform designed as a
final-year cybersecurity project. It automates the complete incident
response lifecycle: ingesting alerts, normalizing data, correlating
incidents, enriching with threat intelligence, mapping to MITRE ATT&CK,
calculating risk, selecting response playbooks, executing automated
actions (simulated or real), notifying analysts, generating reports, and
maintaining complete audit trails.

## Problem Statement

Modern SOC teams receive thousands of alerts from firewalls, IDS/IPS,
EDR, antivirus, SIEMs, and operating systems. Manual triage causes alert
fatigue, slow response, duplicate investigations, and human error.
Commercial SOAR platforms are expensive and difficult to customize.
SentinelSOAR provides an affordable educational implementation using
open-source tools and free APIs.

## Objectives

-   Alert ingestion from multiple sources
-   Alert normalization
-   Incident correlation
-   Threat intelligence enrichment
-   AI-assisted incident analysis
-   MITRE ATT&CK mapping
-   Risk scoring
-   Playbook recommendation
-   Automated response execution
-   Notifications
-   Audit logging
-   Executive and technical reporting
-   Analytics dashboard

## Functional Modules

1.  Authentication
2.  Alert Ingestion
3.  Alert Normalization
4.  Correlation Engine
5.  Threat Intelligence
6.  AI Analysis
7.  MITRE ATT&CK Mapping
8.  Risk Engine
9.  Playbook Engine
10. Automation Engine
11. Notification Service
12. Report Generator
13. Audit Logging
14. Analytics Dashboard

## Technology Stack

### Frontend

-   React
-   TypeScript
-   Tailwind CSS
-   React Router
-   React Query
-   Axios
-   Recharts
-   React Flow
-   Framer Motion

### Backend

-   Node.js
-   Express.js
-   TypeScript

### Database

-   MongoDB

Collections: Users, Alerts, Incidents, ThreatIntel, Playbooks, Actions,
Reports, AuditLogs, Notifications

### Authentication

-   JWT
-   bcrypt
-   Helmet
-   CORS
-   express-rate-limit

### AI

-   Google Gemini API (Free Tier)

### Free APIs

-   VirusTotal
-   AbuseIPDB
-   AlienVault OTX
-   MITRE ATT&CK Dataset
-   CIRCL CVE API
-   NVD API
-   GeoIP (ip-api)

### Backend Libraries

express, mongoose, axios, multer, socket.io, winston, pdfkit, uuid,
csv-parser, xml2js, dotenv, zod

## High-Level Architecture

``` text
User
 │
 ▼
React Dashboard
 │
 ▼
REST API + WebSocket
 │
 ▼
Express Backend
 │
 ▼
Alert Ingestion
 │
 ▼
Alert Normalization
 │
 ▼
Correlation Engine
 │
 ▼
Threat Intelligence
 │
 ▼
AI Analysis
 │
 ▼
MITRE Mapping
 │
 ▼
Risk Engine
 │
 ▼
Playbook Engine
 │
 ▼
Automation Engine
 ├── Firewall (Simulated)
 ├── Email
 ├── Ticket
 └── Notifications
 │
 ▼
Audit Logs
 │
 ▼
Reports & Dashboard
```

## Complete Workflow

1.  Upload alerts/logs (CSV, JSON, Syslog, Apache, SSH, Windows)
2.  Validate input
3.  Parse logs
4.  Normalize into a common schema
5.  Correlate duplicate alerts
6.  Query threat intelligence providers
7.  AI analyzes incident
8.  Map to MITRE ATT&CK
9.  Calculate risk score
10. Select playbook
11. Execute automation
12. Notify analysts
13. Store audit logs
14. Update live dashboard
15. Generate PDF report

## Module Design

### 1. Authentication

Functions: - login() - register() - logout() - verifyJWT() -
refreshToken() - changePassword()

### 2. Alert Ingestion

Functions: - uploadAlert() - validateFile() - parseCSV() - parseJSON() -
parseSyslog() - parseWindowsEvent() - saveRawAlert()

### 3. Alert Normalization

Common fields: timestamp, sourceIP, destinationIP, hostname, username,
severity, eventType

Functions: - normalize() - validateSchema() - extractIPs() -
classifyEvent()

Algorithm: Dictionary-based schema mapping

### 4. Correlation Engine

Rules: - Same IP - Same hostname - Same user - Same attack type - Time
window

Functions: - findSimilarIncidents() - mergeIncident() -
createIncident() - updateIncident()

Algorithm: Sliding time window + HashMap

### 5. Threat Intelligence

Sources: VirusTotal, AbuseIPDB, OTX, GeoIP

Functions: - lookupIP() - lookupHash() - lookupURL() -
calculateReputation() - cacheResponse()

Algorithm: Redis caching

### 6. AI Analysis

Functions: - generateSummary() - predictSeverity() -
recommendMitigation() - generateExecutiveSummary()

Technique: Prompt engineering with Gemini

### 7. MITRE Mapping

Functions: - mapTechnique() - findTactic() - findMitigation()

Technique: Keyword matching with optional embedding similarity

### 8. Risk Engine

Weighted score: Severity + Threat Intel + MITRE + History + AI
Confidence

Functions: - calculateRisk() - assignPriority()

### 9. Playbook Engine

Functions: - evaluateConditions() - selectPlaybook() - executeActions()

Technique: Rule engine / decision tree

### 10. Automation Engine

Actions: - blockIP() - disableUser() - killProcess() - notify() -
generateTicket() - quarantineFile()

Pattern: Command Pattern

### 11. Notification Service

Channels: Email, Slack, Discord, WebSocket

### 12. Report Generator

Outputs: Executive PDF, Technical PDF, Incident Timeline

### 13. Audit Logging

Record: Timestamp, user, action, status, previous/new values

### 14. Dashboard

Widgets: - Live incidents - Threat distribution - Response time -
Automation success - Attack trends

## DTO Communication

AlertDTO → IncidentDTO → ThreatIntelDTO → AnalysisDTO → PlaybookDTO →
AutomationDTO

## Core Algorithms

  Module         Technique
  -------------- --------------------------
  Parser         Regex + Validation
  Normalizer     Dictionary Mapping
  Correlation    Sliding Window + HashMap
  Threat Intel   Redis Cache
  AI             Prompt Engineering
  MITRE          Keyword Matching
  Risk           Weighted Scoring
  Playbook       Decision Tree
  Automation     Command Pattern
  Dashboard      WebSockets

## Sequence

User → Upload → Parser → Normalizer → Correlator → Threat Intel → AI →
MITRE → Risk → Playbook → Automation → Notification → Audit → Dashboard

## Testing Strategy

### Unit Testing

Parser, Normalizer, Correlation, Risk Engine, Playbook Engine

### Integration Testing

-   Parser → Database
-   Threat Intel → AI
-   Playbook → Automation

### End-to-End Scenarios

1.  SSH brute force
2.  SQL injection
3.  Malware hash
4.  Benign login

### Negative Testing

-   Invalid JSON
-   Missing timestamps
-   Invalid IP
-   Unsupported file
-   API timeout

### Security Testing

-   JWT
-   RBAC
-   Injection resistance
-   XSS
-   Rate limiting

### Performance Testing

-   Ingestion throughput
-   Correlation latency
-   AI response time
-   Dashboard latency

### Automation Verification

  Alert             Expected
  ----------------- ------------------------
  SSH Brute Force   Block IP + Notify
  SQL Injection     Notify + Report
  Malware           Quarantine (Simulated)
  Port Scan         Threshold-based Block
  Benign Login      Log Only

## Suggested 4-Day Plan

### Day 1

Authentication, dashboard, ingestion, parser, MongoDB.

### Day 2

Threat intelligence, AI analysis, MITRE mapping.

### Day 3

Risk engine, playbooks, automation, notifications, audit.

### Day 4

Reports, analytics, testing, deployment, documentation.

## Future Enhancements

-   Drag-and-drop playbook builder
-   Multi-tenancy
-   Evidence vault
-   Incident replay
-   SIEM integrations
-   Kubernetes deployment
-   Microservice decomposition
