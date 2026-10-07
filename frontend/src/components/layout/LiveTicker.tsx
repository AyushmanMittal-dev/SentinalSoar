import React, { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '../../context/SocketContext'

interface TickerItem {
  id: string
  text: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  time: Date
}

const severityColors = {
  critical: 'text-critical',
  high: 'text-high',
  medium: 'text-medium',
  low: 'text-low',
  info: 'text-info',
}

const LiveTicker: React.FC = () => {
  const { socket } = useSocket()
  const [items, setItems] = useState<TickerItem[]>([
    { id: '1', text: 'System initialized. Waiting for telemetry...', severity: 'info', time: new Date() }
  ])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!socket) return

    socket.on('incident_updated', (data: any) => {
      const newItem: TickerItem = {
        id: Math.random().toString(36).substr(2, 9),
        text: `Incident ${data.attackType} updated. Total alerts: ${data.alertCount}`,
        severity: 'high',
        time: new Date()
      }
      setItems(prev => [newItem, ...prev].slice(0, 10))
      setCurrentIndex(0) // Reset to show the newest immediately
    })

    return () => {
      socket.off('incident_updated')
    }
  }, [socket])

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <div className="bg-background/50 border border-gray-700/50 rounded-full px-4 py-1.5 flex items-center shadow-inner overflow-hidden relative h-8">
      <AlertCircle className={`w-4 h-4 mr-2 flex-shrink-0 ${severityColors[currentItem.severity]}`} />
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2 flex-shrink-0">Live</span>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-300 whitespace-nowrap truncate w-full"
          >
            <span className="text-gray-500 text-xs mr-2">
              {currentItem.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {currentItem.text}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default LiveTicker
