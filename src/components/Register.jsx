import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MessageCircle, Phone, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const validateForm = () => {
    const errors = {}

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập họ tên'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Họ tên phải có ít nhất 2 ký tự'
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      errors.phone = 'Số điện thoại phải có 10-11 chữ số'
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu'
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'phone') {
      // Only allow numbers
      const numericValue = value.replace(/\D/g, '')
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submit started')
    setLoading(true)
    setError('')

    if (!validateForm()) {
      console.log('Form validation failed')
      setLoading(false)
      return
    }

    try {
      console.log('Calling register with:', {
        phone: formData.phone,
        name: formData.name,
        passwordLength: formData.password.length
      })

      const result = await register(formData.phone, formData.password, formData.name)
      console.log('Register result:', result)
      
      // Navigate to login with success message
      navigate('/login', { 
        state: { 
          message: 'Đăng ký thành công! Vui lòng đăng nhập để sử dụng.' 
        }
      })
    } catch (err) {
      console.error('Registration error in component:', err)
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.phone.trim().length >= 10 && 
           formData.password.length >= 6 && 
           formData.confirmPassword === formData.password
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-secondary to-primary">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white shadow-lg">
            <MessageCircle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Tạo tài khoản mới
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Tham gia cộng đồng Messenger ngay hôm nay
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Lỗi đăng ký</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  disabled={loading}
                />
              </div>
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

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
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength="11"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ví dụ: 0987654321"
                  disabled={loading}
                />
              </div>
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
              {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && !validationErrors.phone && (
                <p className="mt-1 text-xs text-gray-500">
                  Còn thiếu {10 - formData.phone.length} chữ số nữa
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Tối thiểu 6 ký tự"
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
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
              {formData.password && formData.password.length > 0 && formData.password.length < 6 && !validationErrors.password && (
                <p className="mt-1 text-xs text-gray-500">
                  Còn thiếu {6 - formData.password.length} ký tự nữa
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password && formData.confirmPassword !== formData.password && !validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Mật khẩu không khớp</p>
              )}
              {formData.confirmPassword && formData.password && formData.confirmPassword === formData.password && (
                <p className="mt-1 text-xs text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mật khẩu khớp
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-secondary hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang tạo tài khoản...
                </div>
              ) : (
                'Tạo tài khoản'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-blue-700 transition-colors"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Test accounts for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center">
            <p className="text-xs text-white/60 mb-2">
              Development Mode - Server: http://localhost:3001
            </p>
            <details className="text-xs text-white/80">
              <summary className="cursor-pointer hover:text-white">Debug Info</summary>
              <div className="mt-2 p-2 bg-black/20 rounded text-left">
                <div>Form Valid: {isFormValid() ? 'Yes' : 'No'}</div>
                <div>Name: {formData.name.trim().length >= 2 ? 'Valid' : 'Invalid'}</div>
                <div>Phone: {/^[0-9]{10,11}$/.test(formData.phone) ? 'Valid' : 'Invalid'}</div>
                <div>Password: {formData.password.length >= 6 ? 'Valid' : 'Invalid'}</div>
                <div>Confirm: {formData.confirmPassword === formData.password ? 'Match' : 'No Match'}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register