import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layouts
import AppLayout from './components/layout/AppLayout'

// Pages
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import Alerts from './pages/Alerts'
import Playbooks from './pages/Playbooks'
import Reports from './pages/Reports'
import Audit from './pages/Audit'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'glass-panel text-white' }} />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes (No Auth Guard Yet) */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="incidents/:id" element={<IncidentDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="playbooks" element={<Playbooks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit" element={<Audit />} />
          
          {/* Fallback for unbuilt pages */}
          <Route path="*" element={
            <div className="flex h-full items-center justify-center">
              <div className="glass-panel p-8 text-center max-w-md">
                <h1 className="text-xl font-bold text-gray-200 mb-2">Page Under Construction</h1>
                <p className="text-gray-400 text-sm">This module is scheduled for Phase 3/4 implementation.</p>
              </div>
            </div>
          } />
        </Route>
      </Routes>
    </>
  )
}

export default App

