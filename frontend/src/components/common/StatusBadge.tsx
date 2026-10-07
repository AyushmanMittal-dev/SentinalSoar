import React from 'react'
import clsx from 'clsx'
import { AlertTriangle, Info, ShieldAlert, CheckCircle, Clock } from 'lucide-react'

type StatusType = 'open' | 'in_progress' | 'resolved' | 'false_positive'
type SeverityType = 'critical' | 'high' | 'medium' | 'low' | 'info'

interface StatusBadgeProps {
  type: 'status' | 'severity'
  value: StatusType | SeverityType
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className }) => {
  if (type === 'severity') {
    const config: Record<SeverityType, { color: string, icon: React.FC<any>, label: string }> = {
      critical: { color: 'bg-critical/20 text-critical border-critical/50', icon: ShieldAlert, label: 'Critical' },
      high: { color: 'bg-high/20 text-high border-high/50', icon: AlertTriangle, label: 'High' },
      medium: { color: 'bg-medium/20 text-medium border-medium/50', icon: AlertTriangle, label: 'Medium' },
      low: { color: 'bg-low/20 text-low border-low/50', icon: Info, label: 'Low' },
      info: { color: 'bg-info/20 text-info border-info/50', icon: Info, label: 'Info' },
    }
    
    const { color, icon: Icon, label } = config[value as SeverityType] || config['info']
    
    return (
      <span className={clsx(`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`, className)}>
        <Icon className="w-3.5 h-3.5 mr-1" />
        {label}
      </span>
    )
  }

  const statusConfig: Record<StatusType, { color: string, icon: React.FC<any>, label: string }> = {
    open: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: AlertTriangle, label: 'Open' },
    in_progress: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: Clock, label: 'In Progress' },
    resolved: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle, label: 'Resolved' },
    false_positive: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', icon: Info, label: 'False Positive' },
  }

  const { color, icon: Icon, label } = statusConfig[value as StatusType] || statusConfig['open']

  return (
    <span className={clsx(`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`, className)}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {label}
    </span>
  )
}
