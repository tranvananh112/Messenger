import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Search, UserPlus, LogOut, Settings, MessageCircle, Users, RefreshCw } from 'lucide-react'
import AddFriendModal from './AddFriendModal'
import axios from 'axios'

const Sidebar = ({ friends, setFriends, selectedFriend, onFriendSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { user, logout } = useAuth()
  const { onlineUsers, connected } = useSocket()

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/api/friends')
      
      if (response.data.success) {
        setFriends(response.data.friends || [])
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
      const errorMessage = error.response?.data?.error || 'Không thể tải danh sách bạn bè'
      setError(errorMessage)
      setFriends([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchFriends()
  }

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout()
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.phone.includes(searchTerm)
  )

  const isOnline = (userId) => {
    return onlineUsers.some(onlineUser => onlineUser.userId === userId)
  }

  const getOnlineCount = () => {
    return friends.filter(friend => isOnline(friend.id)).length
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="text-white min-w-0">
              <h2 className="font-semibold truncate">{user?.name}</h2>
              <p className="text-xs opacity-90 truncate">{user?.phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddFriend(true)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Thêm bạn"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <p className="text-xs text-yellow-700 text-center">
            Đang kết nối lại...
          </p>
        </div>
      )}

      {/* Friends Count */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>Bạn bè ({friends.length})</span>
          </div>
          <span className="text-green-600">
            {getOnlineCount()} đang hoạt động
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {error && (
          <div className="p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={fetchFriends}
              className="text-sm text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải bạn bè...</p>
          </div>
        )}

        {!loading && !error && filteredFriends.length === 0 && !searchTerm && (
          <div className="p-4 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-2">Chưa có bạn bè nào</p>
            <button
              onClick={() => setShowAddFriend(true)}
              className="text-sm text-primary hover:underline"
            >
              Thêm bạn bè ngay
            </button>
          </div>
        )}

        {!loading && !error && filteredFriends.length === 0 && searchTerm && (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Không tìm thấy bạn bè nào</p>
          </div>
        )}

        {!loading && !error && filteredFriends.length > 0 && (
          <div className="space-y-1 p-2">
            {filteredFriends.map((friend) => {
              const friendIsOnline = isOnline(friend.id)
              const isSelected = selectedFriend?.id === friend.id

              return (
                <div
                  key={friend.id}
                  onClick={() => onFriendSelect(friend)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {friendIsOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {friend.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {friendIsOnline ? (
                        <span className="text-green-600">Đang hoạt động</span>
                      ) : (
                        'Không hoạt động'
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <AddFriendModal
          isOpen={showAddFriend}
          onClose={() => setShowAddFriend(false)}
          onFriendAdded={fetchFriends}
        />
      )}
    </div>
  )
}

export default Sidebar