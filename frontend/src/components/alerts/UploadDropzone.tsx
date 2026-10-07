import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../../api/axios'
import toast from 'react-hot-toast'

interface UploadStatus {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error' | 'pending'
  error?: string
}

export const UploadDropzone: React.FC = () => {
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }))
    
    setUploads(prev => [...prev, ...newUploads])

    for (const upload of newUploads) {
      await uploadFile(upload.file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.log', '.txt'],
      'application/xml': ['.xml']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const uploadFile = async (file: File) => {
    setUploads(prev => prev.map(u => u.file.name === file.name ? { ...u, status: 'uploading', progress: 10 } : u))
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/alerts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          // Keep it at 90 until server fully responds
          const displayProgress = percentCompleted === 100 ? 90 : percentCompleted
          setUploads(prev => prev.map(u => u.file.name === file.name ? { ...u, progress: displayProgress } : u))
        }
      })

      setUploads(prev => prev.map(u => u.file.name === file.name ? { ...u, status: 'success', progress: 100 } : u))
      toast.success(`${file.name} uploaded successfully. Pipeline started.`)
    } catch (err: any) {
      setUploads(prev => prev.map(u => u.file.name === file.name ? { 
        ...u, 
        status: 'error', 
        progress: 0, 
        error: err.response?.data?.error?.message || 'Upload failed' 
      } : u))
    }
  }

  const removeUpload = (fileName: string) => {
    setUploads(prev => prev.filter(u => u.file.name !== fileName))
  }

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[300px] ${
          isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-600 bg-surface/50 hover:bg-surface hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-16 h-16 mb-4 ${isDragActive ? 'text-primary animate-bounce' : 'text-gray-400'}`} />
        <h3 className="text-xl font-semibold text-white mb-2">
          {isDragActive ? 'Drop files now' : 'Drag & drop log files here'}
        </h3>
        <p className="text-gray-400 text-center max-w-md">
          Supports CSV, JSON, Syslog, auth.log, Apache access logs, and Windows Event XML. Max size: 50MB.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <span className="h-px bg-gray-700 flex-1 w-12"></span>
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">OR</span>
          <span className="h-px bg-gray-700 flex-1 w-12"></span>
        </div>
        <button className="mt-6 btn-secondary">Browse Files</button>
      </div>

      {uploads.length > 0 && (
        <div className="mt-8 space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Upload Queue</h4>
          {uploads.map((upload) => (
            <div key={upload.file.name} className="glass-panel p-4 flex items-center relative overflow-hidden">
              {/* Progress bar background */}
              {upload.status === 'uploading' && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              )}
              
              <div className="bg-surfaceHover p-3 rounded-lg mr-4 relative z-10">
                <File className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 relative z-10">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-200 truncate pr-4">{upload.file.name}</span>
                  <span className="text-sm text-gray-400">{(upload.file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                
                {upload.status === 'error' ? (
                  <p className="text-xs text-critical flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {upload.error}
                  </p>
                ) : (
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${upload.status === 'success' ? 'bg-low' : 'bg-primary'}`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className="ml-6 relative z-10">
                {upload.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-low" />
                ) : upload.status === 'error' ? (
                  <button onClick={() => removeUpload(upload.file.name)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <span className="text-sm font-medium text-primary">{upload.progress}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
