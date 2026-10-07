import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background relative">
          {/* Subtle grid background for the whole app */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>
          <div className="relative z-10 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
