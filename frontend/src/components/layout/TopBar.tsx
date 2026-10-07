import React from 'react'
import { Bell, Search, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LiveTicker from './LiveTicker'

const TopBar: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-surface border-b border-gray-700/50 flex items-center justify-between px-6 z-10 shadow-sm relative">
      <div className="flex-1 flex items-center">
        <div className="relative w-96 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search incidents, IP addresses, hashes..."
            className="w-full bg-background border border-gray-700 rounded-full pl-10 pr-4 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Live Ticker taking up middle space on large screens */}
      <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[500px]">
        <LiveTicker />
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-surfaceHover rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full border border-surface"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-700 mx-2"></div>
        
        <div className="flex items-center group cursor-pointer" onClick={() => logout()}>
          <div className="text-right mr-3 hidden sm:block">
            <p className="text-sm font-medium text-gray-200 leading-tight">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'SOC Analyst'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
            {user?.name?.charAt(0) || <User className="w-5 h-5" />}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
