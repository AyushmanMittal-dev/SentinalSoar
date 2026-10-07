import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/axios'
import { History, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const fetchAuditLogs = async (page: number) => {
  const { data } = await api.get(`/audit?page=${page}&limit=50`)
  return data
}

const Audit: React.FC = () => {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => fetchAuditLogs(page)
  })

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Audit Trail</h1>
          <p className="text-gray-400 mt-1">Immutable log of all user and system actions.</p>
        </div>
      </div>

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by user or action..." className="input-field pl-10" />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary">
            <option value="all">All Categories</option>
            <option value="auth">Authentication</option>
            <option value="incident">Incidents</option>
            <option value="playbook">Playbooks</option>
          </select>
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface border-b border-gray-700 z-10">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {data?.data?.map((log: any) => (
                    <tr key={log._id} className="hover:bg-surfaceHover/50 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-300">{log.userEmail}</td>
                      <td className="py-3 px-6 text-sm text-gray-200">{log.action}</td>
                      <td className="py-3 px-6 text-sm text-gray-400 uppercase tracking-wider">{log.category}</td>
                      <td className="py-3 px-6 text-sm text-gray-500 font-mono">{log.ipAddress}</td>
                    </tr>
                  ))}
                  {data?.data?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p>No audit logs found.</p>
                      </td>
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
          </>
        )}
      </div>
    </div>
  )
}

export default Audit
