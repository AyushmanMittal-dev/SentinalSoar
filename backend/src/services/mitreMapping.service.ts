import { Incident } from '../models/Incident'

const MITRE_KNOWLEDGE_BASE = [
  {
    techniqueId: 'T1110',
    techniqueName: 'Brute Force',
    tactic: 'Credential Access',
    tacticId: 'TA0006',
    description: 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained.',
    mitigations: ['Account Use Policies', 'Password Policies', 'User Account Management', 'Multi-factor Authentication'],
    url: 'https://attack.mitre.org/techniques/T1110/',
    keywords: ['brute_force', 'failed password', 'login failure', 'authentication_failure']
  },
  {
    techniqueId: 'T1190',
    techniqueName: 'Exploit Public-Facing Application',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program using software, data, or commands in order to cause unintended or unanticipated behavior.',
    mitigations: ['Application Isolation and Sandboxing', 'Exploit Protection', 'Network Segmentation', 'Update Software', 'Vulnerability Scanning'],
    url: 'https://attack.mitre.org/techniques/T1190/',
    keywords: ['sql_injection', 'xss', 'command_injection', 'apache']
  },
  {
    techniqueId: 'T1046',
    techniqueName: 'Network Service Discovery',
    tactic: 'Discovery',
    tacticId: 'TA0007',
    description: 'Adversaries may attempt to get a listing of services listening on remote hosts and local network infrastructure devices.',
    mitigations: ['Disable or Remove Feature or Program', 'Network Intrusion Prevention', 'Network Segmentation'],
    url: 'https://attack.mitre.org/techniques/T1046/',
    keywords: ['port_scan', 'nmap', 'masscan', 'syn scan']
  },
  {
    techniqueId: 'T1486',
    techniqueName: 'Data Encrypted for Impact',
    tactic: 'Impact',
    tacticId: 'TA0040',
    description: 'Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt availability to system and network resources.',
    mitigations: ['Data Backup', 'Network Segmentation'],
    url: 'https://attack.mitre.org/techniques/T1486/',
    keywords: ['ransomware', '.locked', 'malware']
  },
  {
    techniqueId: 'T1566',
    techniqueName: 'Phishing',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Adversaries may send phishing messages to gain access to victim systems. All forms of phishing are electronically delivered social engineering.',
    mitigations: ['Antivirus/Antimalware', 'Network Intrusion Prevention', 'Restrict Web-Based Content', 'Software Configuration', 'User Training'],
    url: 'https://attack.mitre.org/techniques/T1566/',
    keywords: ['phishing', 'suspicious link', 'email']
  },
  {
    techniqueId: 'T1068',
    techniqueName: 'Exploitation for Privilege Escalation',
    tactic: 'Privilege Escalation',
    tacticId: 'TA0004',
    description: 'Adversaries may exploit software vulnerabilities in an attempt to elevate privileges.',
    mitigations: ['Application Isolation and Sandboxing', 'Exploit Protection', 'Update Software', 'Vulnerability Scanning'],
    url: 'https://attack.mitre.org/techniques/T1068/',
    keywords: ['privilege_escalation', 'sudo', 'root']
  },
  {
    techniqueId: 'T1021',
    techniqueName: 'Remote Services',
    tactic: 'Lateral Movement',
    tacticId: 'TA0008',
    description: 'Adversaries may use Valid Accounts to log into a service specifically designed to accept remote connections, such as telnet, SSH, and RDP.',
    mitigations: ['Disable or Remove Feature or Program', 'Network Segmentation', 'Limit Access to Resource Over Network', 'Multi-factor Authentication'],
    url: 'https://attack.mitre.org/techniques/T1021/',
    keywords: ['lateral_movement', 'smb', 'ssh', 'rdp']
  },
  {
    techniqueId: 'T1048',
    techniqueName: 'Exfiltration Over Alternative Protocol',
    tactic: 'Exfiltration',
    tacticId: 'TA0010',
    description: 'Adversaries may steal data by exfiltrating it over a different protocol than that of the existing command and control channel.',
    mitigations: ['Network Intrusion Prevention'],
    url: 'https://attack.mitre.org/techniques/T1048/',
    keywords: ['exfiltration', 'dns tunnel']
  }
]

class MITREMappingService {
  public async mapIncident(incidentId: string) {
    const incident = await Incident.findById(incidentId)
    if (!incident) throw new Error('Incident not found')

    const searchSpace = [
      incident.attackType,
      ...incident.eventTypes,
      incident.title,
      incident.description
    ].join(' ').toLowerCase()

    const mappedTechniques = MITRE_KNOWLEDGE_BASE.filter(technique => {
      return technique.keywords.some(keyword => searchSpace.includes(keyword))
    }).map(t => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { keywords, ...rest } = t
      return rest
    })

    incident.mitreMapping = mappedTechniques
    incident.pipeline.mitreMapped = true
    await incident.save()

    return mappedTechniques
  }
}

export const mitreMappingService = new MITREMappingService()
