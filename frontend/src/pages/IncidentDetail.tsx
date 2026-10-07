import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/axios'
import { 
  ArrowLeft, ShieldAlert, Terminal, AlertTriangle, 
  BrainCircuit, Activity, Server, FileText, CheckCircle
} from 'lucide-react'
import { StatusBadge } from '../components/common/StatusBadge'
import { RiskGauge } from '../components/common/RiskGauge'

const fetchIncident = async (id: string) => {
  const { data } = await api.get(`/incidents/${id}`)
  return data
}

const fetchActions = async (incidentId: string) => {
  const { data } = await api.get(`/actions/incident/${incidentId}`)
  return data
}

const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'alerts' | 'automation'>('overview')

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncident(id!),
    enabled: !!id,
    refetchInterval: 10000
  })

  const { data: actions } = useQuery({
    queryKey: ['actions', id],
    queryFn: () => fetchActions(id!),
    enabled: !!id && activeTab === 'automation',
    refetchInterval: activeTab === 'automation' ? 2000 : false
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/incidents/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident', id] })
  })

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading incident...</div>
  if (!incident) return <div className="p-8 text-center text-critical">Incident not found</div>

  const { data } = incident

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link to="/incidents" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Incidents
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{data.title}</h1>
            <span className="text-xs font-mono px-2 py-1 bg-surfaceHover rounded text-gray-300">{data.incidentNumber}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <StatusBadge type="severity" value={data.severity} />
            <StatusBadge type="status" value={data.status} />
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">First seen: {new Date(data.firstSeen).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={data.status}
            onChange={(e) => updateStatus.mutate(e.target.value)}
            className="bg-surface border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
            disabled={updateStatus.isPending}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', icon: Activity, label: 'Overview' },
          { id: 'ai', icon: BrainCircuit, label: 'AI Analysis' },
          { id: 'alerts', icon: AlertTriangle, label: `Alerts (${data.alertCount})` },
          { id: 'automation', icon: Terminal, label: 'Playbook Execution' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-surfaceHover/50'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">{data.description}</p>
              </div>

              {/* Threat Intel */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Threat Intelligence</h3>
                {data.threatIntel?.indicators.length > 0 ? (
                  <div className="space-y-4">
                    {data.threatIntel.indicators.map((ind: any, i: number) => (
                      <div key={i} className="bg-surface/50 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Server className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-mono text-gray-200">{ind.indicator}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{ind.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Reputation</p>
                            <p className={`text-sm font-semibold capitalize ${
                              ind.reputation === 'malicious' ? 'text-critical' : 
                              ind.reputation === 'suspicious' ? 'text-high' : 'text-low'
                            }`}>{ind.reputation}</p>
                          </div>
                          {ind.country && (
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-gray-500">Country</p>
                              <p className="text-sm text-gray-300">{ind.country}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No specific IOCs mapped for this incident.</p>
                )}
              </div>

              {/* MITRE ATT&CK */}
              {data.mitreMapping?.length > 0 && (
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">MITRE ATT&CK Mapping</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.mitreMapping.map((t: any, i: number) => (
                      <a key={i} href={t.url} target="_blank" rel="noreferrer" className="bg-surfaceHover/50 border border-gray-700 hover:border-primary/50 rounded-lg p-4 transition-colors block">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{t.techniqueId}</span>
                          <span className="text-xs text-gray-400">{t.tactic}</span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-200">{t.techniqueName}</h4>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Risk Score */}
              <div className="glass-panel p-6 flex flex-col items-center">
                <h3 className="text-lg font-semibold text-white mb-6 w-full text-left">Risk Score</h3>
                <RiskGauge score={data.riskScore || 0} size={160} />
                <div className="w-full mt-8 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Severity</span>
                    <span className="text-gray-200">+{data.riskFactors?.severityScore || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Threat Intel</span>
                    <span className="text-gray-200">+{data.riskFactors?.threatIntelScore || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">AI Confidence</span>
                    <span className="text-gray-200">+{data.riskFactors?.aiScore || 0}</span>
                  </div>
                </div>
              </div>

              {/* Entities */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Entities</h3>
                <div className="space-y-4">
                  {data.sourceIPs?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Source IPs</p>
                      <div className="flex flex-wrap gap-2">
                        {data.sourceIPs.map((ip: string) => (
                          <span key={ip} className="text-sm font-mono bg-surfaceHover px-2 py-1 rounded text-gray-300 border border-gray-700">{ip}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.usernames?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Usernames</p>
                      <div className="flex flex-wrap gap-2">
                        {data.usernames.map((u: string) => (
                          <span key={u} className="text-sm font-mono bg-surfaceHover px-2 py-1 rounded text-gray-300 border border-gray-700">{u}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="glass-panel p-6 max-w-4xl">
            {data.aiAnalysis ? (
              <div className="space-y-8">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                  <BrainCircuit className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Gemini Security Analysis</h3>
                    <p className="text-sm text-gray-400">Generated automatically via LLM pipeline.</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-semibold">Executive Summary</h4>
                  <p className="text-gray-200 text-lg leading-relaxed bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                    {data.aiAnalysis.executiveSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-semibold">Technical Summary</h4>
                    <p className="text-gray-300 leading-relaxed">{data.aiAnalysis.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-semibold">Recommended Mitigations</h4>
                    <ul className="space-y-3">
                      {data.aiAnalysis.mitigation.map((m: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-low mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {data.aiAnalysis.rawResponse && (
                  <details className="group border border-gray-700 rounded-lg bg-surface/50">
                    <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 group-open:border-b group-open:border-gray-700 transition-colors hover:bg-surfaceHover">
                      View Raw LLM Reasoning Trail
                    </summary>
                    <div className="p-4">
                      <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap overflow-x-auto">
                        {data.aiAnalysis.rawResponse}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                AI Analysis has not been completed for this incident.
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Timestamp</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Source</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Event Type</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {data.alertIds?.map((alert: any) => (
                  <tr key={alert._id} className="hover:bg-surfaceHover/30">
                    <td className="py-3 px-4 text-sm text-gray-400 font-mono">
                      {new Date(alert.normalizedData?.timestamp || alert.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 uppercase tracking-wider">{alert.source}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{alert.normalizedData?.eventType || 'unknown'}</td>
                    <td className="py-3 px-4 text-sm text-gray-400 truncate max-w-md" title={alert.normalizedData?.message}>
                      {alert.normalizedData?.message || JSON.stringify(alert.normalizedData)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="max-w-5xl space-y-6">
            <div className="glass-panel p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Playbook Execution</h3>
                <p className="text-sm text-gray-400">
                  {data.playbookName ? `Playbook: ${data.playbookName}` : 'No playbook selected.'}
                </p>
              </div>
              <div>
                <StatusBadge 
                  type="status" 
                  value={data.automationStatus === 'completed' ? 'resolved' : data.automationStatus === 'failed' ? 'open' : 'in_progress'} 
                />
              </div>
            </div>

            {actions?.data?.length > 0 ? (
              <div className="space-y-4">
                {actions.data.map((action: any) => (
                  <div key={action._id} className="glass-panel overflow-hidden border border-gray-700">
                    <div className="px-4 py-3 bg-surface flex justify-between items-center border-b border-gray-700">
                      <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-gray-200">{action.label}</span>
                        <span className="text-xs text-gray-500 font-mono bg-surfaceHover px-2 py-0.5 rounded">{action.type}</span>
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                        action.status === 'simulated' ? 'bg-low/20 text-low border border-low/30' :
                        action.status === 'failed' ? 'bg-critical/20 text-critical border border-critical/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {action.status}
                      </span>
                    </div>
                    <div className="p-4 bg-[#0d1117] font-mono text-sm text-gray-300">
                      {action.simulationOutput?.map((line: string, i: number) => (
                        <div key={i} className="mb-1 leading-relaxed">
                          <span className="text-gray-500 mr-2">{'>'}</span>
                          <span dangerouslySetInnerHTML={{ __html: line.replace(/\[SIMULATED\]/g, '<span class="text-low font-bold">[SIMULATED]</span>').replace(/failed|error/gi, '<span class="text-critical font-bold">$&</span>') }} />
                        </div>
                      ))}
                      {action.status === 'running' && (
                        <div className="animate-pulse flex items-center mt-2">
                          <span className="text-primary mr-2">{'>'}</span>
                          <div className="w-2 h-4 bg-primary"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-gray-500">
                No automation actions have been executed for this incident.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default IncidentDetail
