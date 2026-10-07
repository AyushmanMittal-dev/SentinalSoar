import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false })

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      reconnectionAttempts: Number(import.meta.env.VITE_SOCKET_RECONNECT_ATTEMPTS || 5),
      reconnectionDelay: Number(import.meta.env.VITE_SOCKET_RECONNECT_DELAY_MS || 2000),
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Socket.IO connected')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket.IO disconnected')
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message)
    })

    // Global notifications handler
    newSocket.on('notification', (data: { message: string, type: 'info'|'warning'|'error'|'success' }) => {
      if (data.type === 'error') toast.error(data.message)
      else if (data.type === 'success') toast.success(data.message)
      else if (data.type === 'warning') toast(data.message, { icon: '⚠️' })
      else toast(data.message, { icon: 'ℹ️' })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [isAuthenticated])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
