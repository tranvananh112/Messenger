import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

// Get socket URL based on environment
const getSocketURL = () => {
  if (import.meta.env.PROD) { // Check if in production build
    return import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001'
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const socketURL = getSocketURL()

  const connectSocket = useCallback(() => {
    if (!user || socket) return

    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('Socket: No token found, cannot connect.')
      return
    }

    console.log('Connecting to socket at:', socketURL)

    const newSocket = io(socketURL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      forceNew: true // Ensures a new connection is established
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setConnected(true)
      setError('')
      
      // Authenticate immediately after connection
      newSocket.emit('authenticate', { token })
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        console.log('Server disconnected, attempting to reconnect...')
        setTimeout(() => {
          newSocket.connect()
        }, 1000)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setError('Không thể kết nối đến server')
      setConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setConnected(true)
      setError('')
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnect error:', error)
      setError('Lỗi khi kết nối lại')
    })

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed')
      setError('Không thể kết nối lại. Vui lòng tải lại trang.')
    })

    // Authentication events
    newSocket.on('auth_success', (data) => {
      console.log('Socket authenticated successfully:', data.user.name)
      setError('')
    })

    newSocket.on('auth_error', (data) => {
      console.error('Socket auth error:', data.error)
      setError(data.error)
      setConnected(false)
      // Optionally, force logout if auth fails
      // logout(); 
    })

    // Online users
    newSocket.on('users_online', (users) => {
      setOnlineUsers(users || [])
    })

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      setError(error.message || 'Socket error')
    })

    setSocket(newSocket)

    return newSocket
  }, [user, socket, socketURL])

  const disconnectSocket = useCallback(() => {
    if (socket) {
      console.log('Disconnecting socket...')
      socket.disconnect()
      setSocket(null)
      setConnected(false)
      setOnlineUsers([])
      setError('')
    }
  }, [socket])

  useEffect(() => {
    if (user) {
      connectSocket()
    } else {
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [user, connectSocket, disconnectSocket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [disconnectSocket])

  const value = {
    socket,
    onlineUsers,
    connected,
    error,
    connectSocket,
    disconnectSocket,
    socketURL
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}