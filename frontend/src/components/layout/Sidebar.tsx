import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, ShieldAlert, Activity, BookOpen, Settings, FileText, History } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
  { name: 'Threat Intel', path: '/threat-intel', icon: Activity },
  { name: 'Playbooks', path: '/playbooks', icon: BookOpen },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Audit', path: '/audit', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
]

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-surface border-r border-gray-700/50 flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-gray-700/50">
        <ShieldAlert className="w-8 h-8 text-primary mr-3" />
        <span className="text-xl font-bold tracking-wider text-white">SentinelSOAR</span>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'text-white bg-primary/10 shadow-[inset_4px_0_0_0_#0ea5e9]'
                  : 'text-gray-400 hover:text-white hover:bg-surfaceHover'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                )}
                <item.icon
                  className={clsx(
                    'w-5 h-5 mr-3 flex-shrink-0 relative z-10 transition-colors',
                    isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'
                  )}
                />
                <span className="relative z-10">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700/50">
        <div className="bg-surfaceHover/50 rounded-lg p-3 border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">System Status</p>
          <div className="flex items-center text-sm">
            <span className="w-2 h-2 rounded-full bg-low mr-2 animate-pulse"></span>
            <span className="text-gray-200">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
