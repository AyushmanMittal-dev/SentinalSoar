import axios from 'axios'
import toast from 'react-hot-toast'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Send cookies (refresh token)
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data, // Strip axios wrapper
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth routes or if we're already refreshing
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt refresh
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        
        const { accessToken } = data.data
        localStorage.setItem('accessToken', accessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        
        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/login' // Force re-login
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Handle other global errors
    if (error.response) {
      const { code, message, details } = error.response.data?.error || {}
      
      // Don't toast on 401s, we handle redirects above
      if (error.response.status !== 401) {
        if (code === 'VALIDATION_ERROR') {
          const detailStr = Array.isArray(details) ? details.map(d => d.message).join(', ') : message
          toast.error(`Validation Error: ${detailStr}`)
        } else {
          toast.error(message || 'An error occurred')
        }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)
