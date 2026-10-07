import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { api } from '../api/axios'
import { StatusBadge } from '../components/common/StatusBadge'

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  info: '#3b82f6'
}

const fetchDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats')
  return data
}

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 10000 // Poll every 10s
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading Intelligence Engine...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-center text-critical">
        Failed to load dashboard data. Please check connection.
      </div>
    )
  }

  const { overview, severity, status, attackTypes, recentIncidents } = stats

  // Transform data for Recharts
  const severityData = Object.entries(severity || {}).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: value as number,
    color: COLORS[key as keyof typeof COLORS] || COLORS.info
  }))

  const attackTypeData = Object.entries(attackTypes || {}).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    count: value as number
  }))

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Security Operations</h1>
          <p className="text-gray-400 mt-1">Real-time overview of the threat landscape.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 flex items-center">
          <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Incidents</p>
            <p className="text-3xl font-bold text-white">{overview.totalIncidents}</p>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center">
          <div className="p-3 bg-red-500/20 rounded-xl mr-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Critical Priority</p>
            <p className="text-3xl font-bold text-white">{overview.criticalIncidents}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center">
          <div className="p-3 bg-orange-500/20 rounded-xl mr-4">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Open/Active</p>
            <p className="text-3xl font-bold text-white">{overview.openIncidents}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center">
          <div className="p-3 bg-green-500/20 rounded-xl mr-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Resolved Today</p>
            <p className="text-3xl font-bold text-white">{status.resolved || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Pie Chart */}
        <div className="glass-panel p-6 col-span-1">
          <h3 className="text-lg font-semibold text-white mb-6">Incidents by Severity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Type Bar Chart */}
        <div className="glass-panel p-6 col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6">Attack Vectors</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{fill: '#cbd5e1'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                  cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Recent Active Incidents</h3>
          <button className="text-sm text-primary hover:text-primaryHover transition-colors font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover/30">
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {recentIncidents.map((inc: any) => (
                <tr key={inc._id} className="hover:bg-surfaceHover/50 transition-colors cursor-pointer">
                  <td className="py-4 px-6 text-sm text-primary font-mono">{inc.incidentNumber}</td>
                  <td className="py-4 px-6 text-sm text-gray-200 font-medium">{inc.title}</td>
                  <td className="py-4 px-6"><StatusBadge type="severity" value={inc.severity} /></td>
                  <td className="py-4 px-6"><StatusBadge type="status" value={inc.status} /></td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {recentIncidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No active incidents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
