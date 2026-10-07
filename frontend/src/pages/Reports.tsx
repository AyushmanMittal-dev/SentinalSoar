import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/axios'
import { FileText, Download, Plus, Search, Filter, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

const fetchReports = async () => {
  const { data } = await api.get('/reports')
  return data
}

const Reports: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports
  })

  const [searchTerm, setSearchTerm] = useState('')

  const generateReport = useMutation({
    mutationFn: (type: string) => api.post('/reports', { 
      // For demo, we just pick the latest incident or a mock one if none exists
      incidentId: '65f1a2b3c4d5e6f708901234', 
      type 
    }),
    onSuccess: () => {
      toast.success('Report generated successfully')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: () => toast.error('Failed to generate report')
  })

  const reports = data?.data || []
  const filtered = reports.filter((r: any) => r.fileName.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Compliance & Reports</h1>
          <p className="text-gray-400 mt-1">Generate and export automated security reports.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => generateReport.mutate('executive')}
            className="btn-secondary flex items-center gap-2"
            disabled={generateReport.isPending}
          >
            <Plus className="w-4 h-4" /> Exec Summary
          </button>
          <button 
            onClick={() => generateReport.mutate('technical')}
            className="btn-primary flex items-center gap-2"
            disabled={generateReport.isPending}
          >
            <Plus className="w-4 h-4" /> Tech Report
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary">
            <option value="all">All Types</option>
            <option value="executive">Executive</option>
            <option value="technical">Technical</option>
            <option value="timeline">Timeline</option>
          </select>
        </div>
      </div>

      <div className="glass-panel flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface border-b border-gray-700 z-10">
                <tr>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Report Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Incident Ref</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Generated</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.map((r: any) => (
                  <tr key={r._id} className="hover:bg-surfaceHover/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-500 rounded">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{r.fileName}</p>
                          <p className="text-xs text-gray-500">{(r.fileSize / 1024).toFixed(1)} KB • PDF</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-300 capitalize">{r.type}</td>
                    <td className="py-4 px-6 text-sm text-gray-400 font-mono">
                      {r.metadata?.incidentNumber || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {new Date(r.generatedAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-surfaceHover rounded transition-colors" title="Download PDF">
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <ShieldAlert className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p>No reports generated yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
