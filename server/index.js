import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db, initializeDatabase } from './database.js'

const app = express()
const server = createServer(app)

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-2024-messenger'
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000' // Default for dev

// Log environment variables at startup
console.log('\n--- Server Environment Variables ---')
console.log(`NODE_ENV: ${NODE_ENV}`)
console.log(`PORT: ${PORT}`)
console.log(`FRONTEND_URL: ${FRONTEND_URL}`)
console.log(`JWT_SECRET length: ${JWT_SECRET.length > 0 ? JWT_SECRET.length : 'NOT SET'}`)
console.log('------------------------------------\n')

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://localhost:3000',
      FRONTEND_URL // Dynamically add frontend URL
    ]
    
    // In production, add your actual domain(s) here
    if (NODE_ENV === 'production') {
      // Example: allowedOrigins.push('https://your-production-app.com');
      // Example: allowedOrigins.push('https://api.your-production-app.com');
      // You should replace these with your actual deployed frontend URL
      // For WebContainer, the origin might be dynamic, so we allow it if it's not explicitly blocked.
      // For Vercel/Netlify, FRONTEND_URL should be set to your deployed frontend URL.
    }
    
    if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
      callback(null, true)
    } else {
      console.warn(`CORS blocked origin: ${origin}. Not in allowed list.`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

// Socket.IO CORS configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true // For compatibility with older Socket.IO clients if needed
})

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Trust proxy for production deployment (e.g., behind Nginx, Vercel, Heroku)
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'N/A'}`)
  
  if (req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body }
    if (logBody.password) logBody.password = '[HIDDEN]'
    console.log('Request body:', logBody)
  }
  next()
})

// Root endpoint for basic health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Messenger API Server is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    frontend_url_configured: FRONTEND_URL
  })
})

// API Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Server is healthy',
    timestamp: new Date().toISOString(),
    database: 'Connected', // Assuming DB is connected if server starts
    environment: NODE_ENV
  })
})

// Helper functions
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 12)
  } catch (error) {
    console.error('Error hashing password:', error)
    throw error
  }
}

const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Error comparing password:', error)
    throw error
  }
}

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      phone: user.phone,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('Token verification error:', err.message)
        reject(err)
      } else {
        resolve(decoded)
      }
    })
  })
}

// Database helper functions
const findUserByPhone = (phone) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM users WHERE phone = ?'
    console.log('Finding user by phone:', phone)
    
    db.get(query, [phone], (err, row) => {
      if (err) {
        console.error('Database error in findUserByPhone:', err)
        reject(err)
      } else {
        console.log('User found:', row ? `ID: ${row.id}, Name: ${row.name}` : 'Not found')
        resolve(row)
      }
    })
  })
}

const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, name, phone, created_at FROM users WHERE id = ?'
    
    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('Database error in findUserById:', err)
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

const createUser = (name, phone, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)'
    console.log('Creating user:', { name, phone })
    
    db.run(query, [name, phone, hashedPassword], function(err) {
      if (err) {
        console.error('Database error in createUser:', err)
        reject(err)
      } else {
        console.log('User created successfully with ID:', this.lastID)
        resolve({ id: this.lastID, name, phone })
      }
    })
  })
}

// Validation functions
const validatePhoneNumber = (phone) => {
  if (!phone) return false
  const phoneRegex = /^[0-9]{10,11}$/
  return phoneRegex.test(phone.toString())
}

const validatePassword = (password) => {
  return password && typeof password === 'string' && password.length >= 6
}

const validateName = (name) => {
  return name && typeof name === 'string' && name.trim().length >= 2
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Token xác thực không được cung cấp',
        code: 'NO_TOKEN' 
      })
    }

    const decoded = await verifyToken(token)
    const user = await findUserById(decoded.id)
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND' 
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.log('Authentication error:', error.message)
    return res.status(403).json({ 
      success: false,
      error: 'Token không hợp lệ hoặc đã hết hạn',
      code: 'INVALID_TOKEN' 
    })
  }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  console.log('\n=== REGISTER REQUEST ===')
  
  try {
    const { name, phone, password } = req.body
    console.log('Register data received:', { name, phone, passwordLength: password?.length })

    // Validation
    if (!name || !phone || !password) {
      console.log('Missing fields')
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin (tên, số điện thoại, mật khẩu)',
        code: 'MISSING_FIELDS' 
      })
    }

    if (!validateName(name)) {
      console.log('Invalid name')
      return res.status(400).json({ 
        success: false,
        error: 'Tên phải có ít nhất 2 ký tự',
        code: 'INVALID_NAME' 
      })
    }

    if (!validatePhoneNumber(phone)) {
      console.log('Invalid phone:', phone)
      return res.status(400).json({ 
        success: false,
        error: 'Số điện thoại không hợp lệ (10-11 số)',
        code: 'INVALID_PHONE' 
      })
    }

    if (!validatePassword(password)) {
      console.log('Invalid password')
      return res.status(400).json({ 
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự',
        code: 'INVALID_PASSWORD' 
      })
    }

    // Check if phone already exists
    console.log('Checking if phone exists...')
    const existingUser = await findUserByPhone(phone)
    if (existingUser) {
      console.log('Phone already exists')
      return res.status(409).json({ 
        success: false,
        error: 'Số điện thoại đã được đăng ký',
        code: 'PHONE_EXISTS' 
      })
    }

    // Hash password and create user
    console.log('Hashing password...')
    const hashedPassword = await hashPassword(password)
    
    console.log('Creating user...')
    const newUser = await createUser(name.trim(), phone, hashedPassword)

    console.log('Registration successful:', { id: newUser.id, name: newUser.name, phone: newUser.phone })

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.',
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống khi đăng ký tài khoản. Vui lòng thử lại.',
      code: 'SERVER_ERROR',
      details: NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

app.post('/api/auth/login', async (req, res) => {
  console.log('\n=== LOGIN REQUEST ===')
  
  try {
    const { phone, password } = req.body
    console.log('Login data received:', { phone, passwordLength: password?.length })

    // Validation
    if (!phone || !password) {
      console.log('Missing credentials')
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập số điện thoại và mật khẩu',
        code: 'MISSING_CREDENTIALS' 
      })
    }

    // Find user
    console.log('Finding user...')
    const user = await findUserByPhone(phone)
    if (!user) {
      console.log('User not found')
      return res.status(401).json({ 
        success: false,
        error: 'Số điện thoại hoặc mật khẩu không đúng',
        code: 'INVALID_CREDENTIALS' 
      })
    }

    // Check password
    console.log('Checking password...')
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      console.log('Invalid password')
      return res.status(401).json({ 
        success: false,
        error: 'Số điện thoại hoặc mật khẩu không đúng',
        code: 'INVALID_CREDENTIALS' 
      })
    }

    // Generate token
    console.log('Generating token...')
    const token = generateToken(user)

    console.log('Login successful:', { id: user.id, name: user.name, phone: user.phone })

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống khi đăng nhập. Vui lòng thử lại.',
      code: 'SERVER_ERROR',
      details: NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
  console.log('Auth check for user:', req.user.id)
  res.json({
    success: true,
    user: req.user
  })
})

// Friends routes
app.get('/api/friends', authenticateToken, (req, res) => {
  const query = `
    SELECT DISTINCT u.id, u.name, u.phone, f.created_at as friend_since
    FROM users u
    INNER JOIN friends f ON (
      (f.user1_id = ? AND f.user2_id = u.id) OR 
      (f.user2_id = ? AND f.user1_id = u.id)
    )
    WHERE f.status = 'accepted'
    ORDER BY u.name ASC
  `

  db.all(query, [req.user.id, req.user.id], (err, friends) => {
    if (err) {
      console.error('Error fetching friends:', err)
      return res.status(500).json({ 
        success: false,
        error: 'Lỗi khi tải danh sách bạn bè',
        code: 'DB_ERROR' 
      })
    }

    res.json({
      success: true,
      friends: friends || []
    })
  })
})

app.post('/api/friends/add', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập số điện thoại',
        code: 'MISSING_PHONE' 
      })
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({ 
        success: false,
        error: 'Số điện thoại không hợp lệ',
        code: 'INVALID_PHONE' 
      })
    }

    if (phone === req.user.phone) {
      return res.status(400).json({ 
        success: false,
        error: 'Không thể kết bạn với chính mình',
        code: 'SELF_FRIEND' 
      })
    }

    // Find user by phone
    const friend = await findUserByPhone(phone)
    if (!friend) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy người dùng với số điện thoại này',
        code: 'USER_NOT_FOUND' 
      })
    }

    // Check if friendship already exists
    const checkQuery = `
      SELECT id FROM friends 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `
    
    db.get(checkQuery, [req.user.id, friend.id, friend.id, req.user.id], (err, existing) => {
      if (err) {
        console.error('Error checking friendship:', err)
        return res.status(500).json({ 
          success: false,
          error: 'Lỗi hệ thống khi kiểm tra kết bạn',
          code: 'DB_ERROR' 
        })
      }

      if (existing) {
        return res.status(409).json({ 
          success: false,
          error: 'Đã kết bạn với người này rồi',
          code: 'ALREADY_FRIENDS' 
        })
      }

      // Add friendship
      const user1Id = Math.min(req.user.id, friend.id)
      const user2Id = Math.max(req.user.id, friend.id)

      db.run('INSERT INTO friends (user1_id, user2_id, status) VALUES (?, ?, ?)', 
        [user1Id, user2Id, 'accepted'], 
        function(err) {
          if (err) {
            console.error('Error creating friendship:', err)
            return res.status(500).json({ 
              success: false,
              error: 'Lỗi hệ thống khi kết bạn',
              code: 'DB_ERROR' 
            })
          }

          console.log(`Friendship created: ${req.user.name} <-> ${friend.name}`)

          res.json({
            success: true,
            message: `Đã kết bạn với ${friend.name} thành công!`,
            friend: {
              id: friend.id,
              name: friend.name,
              phone: friend.phone
            }
          })
        })
    })

  } catch (error) {
    console.error('Add friend error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống khi thêm bạn',
      code: 'SERVER_ERROR' 
    })
  }
})

// Messages routes
app.get('/api/messages/:friendId', authenticateToken, (req, res) => {
  const friendId = parseInt(req.params.friendId)
  
  if (!friendId) {
    return res.status(400).json({ 
      success: false,
      error: 'ID bạn bè không hợp lệ',
      code: 'INVALID_FRIEND_ID' 
    })
  }

  const query = `
    SELECT m.*, u.name as sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) 
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.timestamp ASC
    LIMIT 100
  `

  db.all(query, [req.user.id, friendId, friendId, req.user.id], (err, messages) => {
    if (err) {
      console.error('Error fetching messages:', err)
      return res.status(500).json({ 
        success: false,
        error: 'Lỗi khi tải tin nhắn',
        code: 'DB_ERROR' 
      })
    }

    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.content,
      timestamp: msg.timestamp,
      senderName: msg.sender_name
    }))

    res.json({
      success: true,
      messages: formattedMessages
    })
  })
})

// Store online users
const onlineUsers = new Map()

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id, 'from:', socket.handshake.address)

  // Handle authentication
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data
      if (!token) {
        socket.emit('auth_error', { error: 'Token không được cung cấp' })
        return
      }

      const decoded = await verifyToken(token)
      const user = await findUserById(decoded.id)
      
      if (!user) {
        socket.emit('auth_error', { error: 'Người dùng không tồn tại' })
        return
      }

      socket.userId = user.id
      socket.userName = user.name
      socket.userPhone = user.phone
      
      onlineUsers.set(socket.id, {
        userId: user.id,
        name: user.name,
        phone: user.phone,
        socketId: socket.id,
        connectedAt: new Date()
      })

      socket.emit('auth_success', { user })
      
      // Broadcast updated online users
      const onlineList = Array.from(onlineUsers.values())
      io.emit('users_online', onlineList)
      
      console.log(`User authenticated: ${user.name} (${user.id}) from ${socket.handshake.address}`)

    } catch (error) {
      console.log('Socket auth error:', error.message)
      socket.emit('auth_error', { error: 'Token không hợp lệ' })
    }
  })

  // Auto-authenticate if token provided in handshake
  if (socket.handshake.auth && socket.handshake.auth.token) {
    socket.emit('authenticate', { token: socket.handshake.auth.token })
  }

  // Handle joining conversation
  socket.on('join_conversation', async ({ userId, friendId }) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Chưa xác thực' })
        return
      }

      const roomId = [userId, friendId].sort((a, b) => a - b).join('-')
      socket.join(roomId)

      console.log(`User ${socket.userId} joined conversation room: ${roomId}`)

      // Load and send message history
      const query = `
        SELECT m.*, u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) 
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.timestamp ASC
        LIMIT 50
      `

      db.all(query, [userId, friendId, friendId, userId], (err, messages) => {
        if (!err && messages) {
          const formattedMessages = messages.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            timestamp: msg.timestamp,
            senderName: msg.sender_name
          }))

          socket.emit('message_history', formattedMessages)
        }
      })

    } catch (error) {
      console.error('Join conversation error:', error)
      socket.emit('error', { message: 'Lỗi khi tham gia cuộc trò chuyện' })
    }
  })

  // Handle sending messages
  socket.on('send_message', (messageData) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Chưa xác thực' })
        return
      }

      const { senderId, receiverId, content } = messageData

      if (!content || !content.trim()) {
        socket.emit('error', { message: 'Tin nhắn không được để trống' })
        return
      }

      if (senderId !== socket.userId) {
        socket.emit('error', { message: 'Không có quyền gửi tin nhắn' })
        return
      }

      // Save message to database
      db.run('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [senderId, receiverId, content.trim()],
        function(err) {
          if (err) {
            console.error('Error saving message:', err)
            socket.emit('error', { message: 'Lỗi khi lưu tin nhắn' })
            return
          }

          const message = {
            id: this.lastID,
            senderId,
            receiverId,
            content: content.trim(),
            timestamp: new Date().toISOString(),
            senderName: socket.userName
          }

          // Send to both users in the conversation
          const roomId = [senderId, receiverId].sort((a, b) => a - b).join('-')
          io.to(roomId).emit('new_message', message)

          console.log(`Message sent from ${senderId} to ${receiverId}: ${content.substring(0, 50)}...`)
        })

    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' })
    }
  })

  // Handle typing indicator
  socket.on('typing', ({ receiverId, isTyping }) => {
    try {
      if (!socket.userId) return

      const roomId = [socket.userId, receiverId].sort((a, b) => a - b).join('-')
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      })

    } catch (error) {
      console.error('Typing indicator error:', error)
    }
  })

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`)
    
    if (socket.userId) {
      console.log(`User ${socket.userName} (${socket.userId}) disconnected`)
    }
    
    onlineUsers.delete(socket.id)
    
    // Broadcast updated online users
    const onlineList = Array.from(onlineUsers.values())
    io.emit('users_online', onlineList)
  })

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ 
    success: false,
    error: 'Lỗi hệ thống không mong muốn',
    code: 'INTERNAL_ERROR',
    details: NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'API endpoint không tồn tại',
    code: 'NOT_FOUND',
    requestedPath: req.originalUrl
  })
})

// Initialize database and start server
const startServer = async () => {
  try {
    console.log(`Starting server in ${NODE_ENV} mode...`)
    console.log('Initializing database...')
    await initializeDatabase()
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Server running on:')
      console.log(`   - Local:   http://localhost:${PORT}`)
      console.log(`   - Network: http://0.0.0.0:${PORT}`)
      console.log(`📱 Frontend URL: ${FRONTEND_URL}`)
      console.log(`💾 Database initialized successfully`)
      console.log(`🔧 Environment: ${NODE_ENV}`)
      console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`)
      
      // Log environment variables for debugging
      if (NODE_ENV === 'development') {
        console.log('\n=== Environment Variables ===')
        console.log('NODE_ENV:', NODE_ENV)
        console.log('PORT:', PORT)
        console.log('FRONTEND_URL:', FRONTEND_URL)
        console.log('JWT_SECRET length:', JWT_SECRET.length)
      }
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down server...')
  server.close(() => {
    console.log('HTTP server closed.')
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err)
      } else {
        console.log('Database closed successfully')
      }
      process.exit(0)
    })
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  shutdown()
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  shutdown()
})

startServer()