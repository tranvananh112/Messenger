import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Configure axios defaults based on environment
// Use VITE_API_URL for Vite projects
const getBaseURL = () => {
  if (import.meta.env.PROD) { // Check if in production build
    return import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001'
}

const baseURL = getBaseURL()

axios.defaults.baseURL = baseURL
axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.timeout = 15000
axios.defaults.withCredentials = true

console.log('AuthContext: API Base URL:', baseURL)
console.log('AuthContext: Environment:', import.meta.env.MODE)

// Request interceptor for logging
axios.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    console.log('Full URL:', `${config.baseURL}${config.url}`)
    
    if (config.data && typeof config.data === 'object') {
      const logData = { ...config.data }
      if (logData.password) logData.password = '[HIDDEN]'
      console.log('Request data:', logData)
    }
    
    const token = localStorage.getItem('token')
    if (token) {
      console.log('Token attached:', token.substring(0, 20) + '...')
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for logging
axios.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    console.log('Response data:', response.data)
    return response
  },
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    })
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - server might be down')
      error.message = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
    }
    
    return Promise.reject(error)
  }
)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('Initializing auth...')
      const token = localStorage.getItem('token')
      if (token) {
        console.log('Found existing token, verifying...')
        setAuthToken(token)
        await fetchUser()
      } else {
        console.log('No token found')
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      clearAuth()
    } finally {
      setLoading(false)
    }
  }

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }

  const clearAuth = () => {
    console.log('Clearing auth...')
    setAuthToken(null)
    setUser(null)
    setError('')
  }

  const fetchUser = async () => {
    try {
      console.log('Fetching user info...')
      const response = await axios.get('/api/auth/me')
      if (response.data.success) {
        console.log('User fetched successfully:', response.data.user.name)
        setUser(response.data.user)
        setError('')
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Fetch user error:', error)
      clearAuth()
      throw error
    }
  }

  const testConnection = async () => {
    try {
      console.log('Testing server connection...')
      const response = await axios.get('/api/health')
      console.log('Connection test result:', response.data)
      return response.data
    } catch (error) {
      console.error('Connection test failed:', error)
      throw error
    }
  }

  const login = async (phone, password) => {
    try {
      console.log('Login attempt for phone:', phone)
      console.log('Using API URL:', baseURL)
      setError('')
      
      // Test connection first in production
      if (import.meta.env.PROD) {
        await testConnection()
      }
      
      const response = await axios.post('/api/auth/login', { 
        phone: phone.trim(), 
        password 
      })

      console.log('Login response:', response.data)

      if (response.data.success) {
        const { token, user } = response.data
        console.log('Login successful, setting token and user')
        setAuthToken(token)
        setUser(user)
        return response.data
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Đăng nhập thất bại'
      
      if (!error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
      } else if (error.response.status >= 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.'
      } else {
        errorMessage = error.response?.data?.error || error.message || errorMessage
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const register = async (phone, password, name) => {
    try {
      console.log('Register attempt for phone:', phone, 'name:', name)
      console.log('Using API URL:', baseURL)
      setError('')
      
      // Test connection first in production
      if (import.meta.env.PROD) {
        await testConnection()
      }
      
      const response = await axios.post('/api/auth/register', { 
        phone: phone.trim(), 
        password, 
        name: name.trim() 
      })

      console.log('Register response:', response.data)

      if (response.data.success) {
        console.log('Registration successful for user:', response.data.user.name)
        return response.data
      } else {
        throw new Error(response.data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Register error:', error)
      let errorMessage = 'Đăng ký thất bại'
      
      if (!error.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
      } else if (error.response.status >= 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.'
      } else {
        errorMessage = error.response?.data?.error || error.message || errorMessage
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    console.log('Logging out user:', user?.name)
    clearAuth()
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error,
    setError,
    testConnection,
    baseURL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}