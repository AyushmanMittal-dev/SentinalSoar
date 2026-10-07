import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/axios'
import { StatusBadge } from '../components/common/StatusBadge'
import { Search, Filter, LayoutList, Trello, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const fetchIncidents = async (page: number, status?: string) => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', '10')
  if (status && status !== 'all') params.append('status', status)
  
  const { data } = await api.get(`/incidents?${params.toString()}`)
  return data
}

const Incidents: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', page, statusFilter],
    queryFn: () => fetchIncidents(page, statusFilter),
    refetchInterval: 10000
  })

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Incident Management</h1>
          <p className="text-gray-400 mt-1">Investigate and respond to correlated threats.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-surface rounded-lg p-1 border border-gray-700/50">
            <button 
              onClick={() => setViewMode('table')}
              className={clsx('p-2 rounded-md transition-colors', viewMode === 'table' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white')}
              title="List View"
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={clsx('p-2 rounded-md transition-colors', viewMode === 'kanban' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white')}
              title="Kanban View"
            >
              <Trello className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, IP, or Title..."
            className="input-field pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            className="bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="glass-panel flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface border-b border-gray-700 z-10">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alerts</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {data?.data.map((inc: any) => (
                    <tr key={inc._id} className="hover:bg-surfaceHover/50 transition-colors cursor-pointer group">
                      <td className="py-4 px-6 text-sm text-primary font-mono group-hover:underline">{inc.incidentNumber}</td>
                      <td className="py-4 px-6 text-sm text-gray-200 font-medium">{inc.title}</td>
                      <td className="py-4 px-6"><StatusBadge type="severity" value={inc.severity} /></td>
                      <td className="py-4 px-6"><StatusBadge type="status" value={inc.status} /></td>
                      <td className="py-4 px-6 text-sm text-gray-400">{inc.alertCount}</td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {new Date(inc.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                  {data?.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">No incidents found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {data?.meta && (
              <div className="p-4 border-t border-gray-700 flex items-center justify-between bg-surface/50 mt-auto">
                <span className="text-sm text-gray-400">
                  Showing <span className="text-white font-medium">{(data.meta.page - 1) * data.meta.limit + 1}</span> to <span className="text-white font-medium">{Math.min(data.meta.page * data.meta.limit, data.meta.total)}</span> of <span className="text-white font-medium">{data.meta.total}</span>
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={data.meta.page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 bg-surface border border-gray-700 rounded hover:bg-surfaceHover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={data.meta.page === data.meta.totalPages || data.meta.totalPages === 0}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 bg-surface border border-gray-700 rounded hover:bg-surfaceHover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {/* Kanban Columns */}
            {['open', 'in_progress', 'resolved'].map(status => {
              const columnIncidents = data?.data.filter((i: any) => i.status === status) || []
              return (
                <div key={status} className="bg-surface/50 border border-gray-700/50 rounded-xl flex flex-col min-w-[320px] max-w-[350px] flex-1">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-surface rounded-t-xl">
                    <h3 className="font-semibold text-gray-200 capitalize">{status.replace('_', ' ')}</h3>
                    <span className="bg-surfaceHover text-xs text-gray-300 px-2 py-1 rounded-full">{columnIncidents.length}</span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {columnIncidents.map((inc: any) => (
                      <div key={inc._id} className="bg-background border border-gray-700 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{inc.incidentNumber}</span>
                          <StatusBadge type="severity" value={inc.severity} />
                        </div>
                        <h4 className="text-sm font-medium text-gray-200 mb-3 line-clamp-2">{inc.title}</h4>
                        <div className="flex justify-between items-end">
                          <div className="text-xs text-gray-500">
                            {inc.alertCount} alert{inc.alertCount > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500/50 mr-1.5"></span>
                            {inc.attackType}
                          </div>
                        </div>
                      </div>
                    ))}
                    {columnIncidents.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Incidents
