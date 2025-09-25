import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

const Chat = () => {
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [friends, setFriends] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const { user } = useAuth()
  const { socket, connected, error: socketError } = useSocket()

  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('new_message', (message) => {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => msg.id === message.id)
          if (exists) return prev
          return [...prev, message]
        })
      })

      // Listen for message history
      socket.on('message_history', (history) => {
        setMessages(history || [])
      })

      // Listen for errors
      socket.on('error', (error) => {
        console.error('Socket error in Chat:', error)
        setError(error.message || 'Lỗi kết nối')
      })

      return () => {
        socket.off('new_message')
        socket.off('message_history')
        socket.off('error')
      }
    }
  }, [socket])

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend)
    setMessages([]) // Clear previous messages
    setError('')
    
    if (socket && connected) {
      socket.emit('join_conversation', {
        userId: user.id,
        friendId: friend.id
      })
    }
  }

  const connectionStatus = () => {
    if (!connected && socketError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
          <div className="flex items-center">
            <WifiOff className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <p className="text-sm text-red-700 font-medium">Mất kết nối</p>
              <p className="text-xs text-red-600">{socketError}</p>
            </div>
          </div>
        </div>
      )
    } else if (!connected) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
            <p className="text-sm text-yellow-700">Đang kết nối...</p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-light">
      <Sidebar 
        friends={friends}
        setFriends={setFriends}
        selectedFriend={selectedFriend}
        onFriendSelect={handleFriendSelect}
      />
      <div className="flex-1 flex flex-col">
        {connectionStatus()}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {selectedFriend ? (
          <ChatWindow 
            friend={selectedFriend}
            messages={messages}
            setMessages={setMessages}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center max-w-md px-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl font-bold">M</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                Chào mừng đến với Messenger
              </h3>
              <p className="text-gray-500 mb-4">
                Chọn một người bạn từ danh sách bên trái để bắt đầu cuộc trò chuyện
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Đã kết nối</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Chưa kết nối</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat