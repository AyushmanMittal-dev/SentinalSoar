import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Sign in to SentinelSOAR</h2>
        </div>
        
        <div className="glass-panel p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input type="email" required className="input-field" placeholder="analyst@soc.local" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input type="password" required className="input-field" placeholder="••••••••" />
            </div>

            <button type="submit" className="w-full btn-primary py-3">Sign In</button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account? <Link to="/register" className="text-primary hover:text-primaryHover">Request access</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
