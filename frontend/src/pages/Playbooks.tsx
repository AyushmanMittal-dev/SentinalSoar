import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/axios'
import { BookOpen, Plus, Search, Terminal, Filter, Power, PowerOff } from 'lucide-react'
import { StatusBadge } from '../components/common/StatusBadge'

const fetchPlaybooks = async () => {
  const { data } = await api.get('/playbooks')
  return data
}

const Playbooks: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['playbooks'],
    queryFn: fetchPlaybooks
  })

  const [searchTerm, setSearchTerm] = useState('')

  const playbooks = data?.data || []
  const filtered = playbooks.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Playbook Library</h1>
          <p className="text-gray-400 mt-1">Manage automated response procedures.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Playbook
        </button>
      </div>

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search playbooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary">
            <option value="all">All Types</option>
            <option value="brute_force">Brute Force</option>
            <option value="malware">Malware</option>
            <option value="phishing">Phishing</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pb: any) => (
            <div key={pb._id} className="glass-panel p-6 flex flex-col hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${pb.color ? `bg-${pb.color}-500/20` : 'bg-primary/20'}`}>
                  <BookOpen className={`w-6 h-6 ${pb.color ? `text-${pb.color}-500` : 'text-primary'}`} />
                </div>
                <button className={`p-2 rounded-full ${pb.isActive ? 'text-low hover:bg-low/20' : 'text-gray-500 hover:bg-gray-700'}`}>
                  {pb.isActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{pb.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{pb.description}</p>
              
              <div className="mt-auto space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Triggers On</p>
                  <div className="flex flex-wrap gap-2">
                    {pb.attackTypes?.map((t: string) => (
                      <span key={t} className="text-xs bg-surfaceHover px-2 py-1 rounded text-gray-300">{t}</span>
                    ))}
                    {pb.severityLevels?.map((s: string) => (
                      <StatusBadge key={s} type="severity" value={s as any} />
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-400">
                    <Terminal className="w-4 h-4 mr-1.5" />
                    {pb.actions?.length || 0} Actions
                  </div>
                  <div className="text-gray-400">
                    Uses: <span className="text-white font-medium">{pb.executionCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No playbooks found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Playbooks
