export function extractIPs(text: string): string[] {
  if (!text) return []
  // Matches IPv4 addresses
  const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
  const matches = text.match(ipv4Regex) || []
  
  // Filter out common private/local IPs if needed, but for SOAR we often want to track internal lateral movement
  // So we just return unique matches
  return [...new Set(matches)]
}

export function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return false

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127 || // localhost
    parts[0] === 169 && parts[1] === 254 // link-local
  )
}
