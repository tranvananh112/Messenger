import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MessageCircle, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'

const Login = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('checking')
  
  const { login, testConnection, baseURL } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Check for success message from registration
    if (location.state?.message) {
      setSuccess(location.state.message)
      // Clear the message after showing it
      window.history.replaceState({}, document.title)
    }

    // Test connection on component mount
    checkConnection()
  }, [location.state])

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking')
      await testConnection()
      setConnectionStatus('connected')
    } catch (error) {
      console.error('Connection check failed:', error)
      setConnectionStatus('disconnected')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Basic validation
      if (!phone.trim()) {
        throw new Error('Vui lòng nhập số điện thoại')
      }
      if (!password) {
        throw new Error('Vui lòng nhập mật khẩu')
      }

      console.log('Attempting login with:', { phone, baseURL })
      await login(phone, password)
      console.log('Login successful, redirecting...')
      // Navigation will be handled by the PrivateRoute component
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
      
      // If connection error, update connection status
      if (err.message.includes('kết nối') || err.message.includes('server')) {
        setConnectionStatus('disconnected')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '')
    setPhone(value)
  }

  const ConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center text-yellow-600 text-sm mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            Đang kiểm tra kết nối...
          </div>
        )
      case 'connected':
        return (
          <div className="flex items-center text-green-600 text-sm mb-4">
            <Wifi className="w-4 h-4 mr-2" />
            Đã kết nối đến server
          </div>
        )
      case 'disconnected':
        return (
          <div className="flex items-center text-red-600 text-sm mb-4">
            <WifiOff className="w-4 h-4 mr-2" />
            Không thể kết nối đến server
            <button 
              onClick={checkConnection}
              className="ml-2 text-blue-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-secondary">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white shadow-lg">
            <MessageCircle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Đăng nhập Messenger
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Kết nối với bạn bè và gia đình
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <ConnectionIndicator />
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Lỗi đăng nhập</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength="11"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Ví dụ: 0987654321"
                  disabled={loading}
                />
              </div>
              {phone && phone.length < 10 && (
                <p className="mt-1 text-xs text-gray-500">
                  Số điện thoại phải có 10-11 chữ số
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Nhập mật khẩu"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phone.trim() || !password || phone.length < 10 || connectionStatus === 'disconnected'}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:text-blue-700 transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center">
            <details className="text-xs text-white/80">
              <summary className="cursor-pointer hover:text-white mb-2">Debug Info</summary>
              <div className="text-left p-3 bg-black/20 rounded">
                <div>Environment: {process.env.NODE_ENV}</div>
                <div>API URL: {baseURL}</div>
                <div>Connection: {connectionStatus}</div>
                <div>Phone: {phone} ({phone.length} chars)</div>
                <div>Password: {'*'.repeat(password.length)}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login