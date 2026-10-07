import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Join SentinelSOAR</h2>
          <p className="text-gray-400 mt-2">Request analyst access to the platform</p>
        </div>
        
        <div className="glass-panel p-8">
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input type="text" required className="input-field" placeholder="John Doe" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input type="email" required className="input-field" placeholder="john@soc.local" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input type="password" required className="input-field" placeholder="••••••••" />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with a number and uppercase letter.</p>
            </div>

            <button type="submit" className="w-full btn-primary py-3 mt-4">Create Account</button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-primary hover:text-primaryHover">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
