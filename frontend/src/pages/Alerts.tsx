import React from 'react'
import { UploadDropzone } from '../components/alerts/UploadDropzone'

const Alerts: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Ingest Telemetry</h1>
        <p className="text-gray-400">Upload raw logs to begin the normalization, correlation, and enrichment pipeline.</p>
      </div>
      
      <div className="glass-panel p-6 md:p-10">
        <UploadDropzone />
      </div>
    </div>
  )
}

export default Alerts

