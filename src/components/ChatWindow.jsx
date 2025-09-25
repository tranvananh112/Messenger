import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Send, Phone, Video, MoreVertical } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'

const ChatWindow = ({ friend, messages, setMessages }) => {
  const [newMessage, setNewMessage] = useState('')
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()
  const { socket, onlineUsers } = useSocket()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (socket) {
      socket.on('user_typing', ({ userId, isTyping }) => {
        if (userId === friend.id) {
          setTyping(isTyping)
        }
      })

      return () => {
        socket.off('user_typing')
      }
    }
  }, [socket, friend.id])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    const messageData = {
      senderId: user.id,
      receiverId: friend.id,
      content: newMessage.trim(),
      timestamp: new Date()
    }

    socket.emit('send_message', messageData)
    setNewMessage('')
  }

  const handleTyping = (value) => {
    setNewMessage(value)
    if (socket) {
      socket.emit('typing', {
        receiverId: friend.id,
        isTyping: value.length > 0
      })
    }
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Hôm qua ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
    }
  }

  const isOnline = onlineUsers.some(onlineUser => onlineUser.userId === friend.id)

  const conversationMessages = messages.filter(
    msg => 
      (msg.senderId === user.id && msg.receiverId === friend.id) ||
      (msg.senderId === friend.id && msg.receiverId === user.id)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {friend.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{friend.name}</h3>
            <p className="text-sm text-gray-500">
              {isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin">
        {conversationMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          conversationMessages.map((message, index) => {
            const isOwn = message.senderId === user.id
            const showAvatar = index === 0 || 
              conversationMessages[index - 1].senderId !== message.senderId

            return (
              <div
                key={index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                  showAvatar ? 'mt-4' : 'mt-1'
                }`}
              >
                {!isOwn && showAvatar && (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {friend.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {!isOwn && !showAvatar && <div className="w-10"></div>}
                
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwn 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-900 shadow-sm'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        
        {typing && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-semibold">
                {friend.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary text-white p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow