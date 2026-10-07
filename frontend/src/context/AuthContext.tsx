import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/axios'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'analyst' | 'viewer'
  avatar: string
  preferences: {
    theme: string
    emailNotifications: boolean
    slackNotifications: boolean
  }
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we have an access token and user info stored
    const token = localStorage.getItem('accessToken')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('user')
      }
    }
    
    // In a real app we might fetch /api/v1/auth/me here to validate the token
    // For now we assume if token exists, we are logged in. Axios interceptors handle expiry.
    setIsLoading(false)
  }, [])

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error', err)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      setUser(null)
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
