import React, { useState, useEffect } from 'react';
import { LazyImage, LazyMessages, useIntersectionObserver } from './LazyLoad';
import { usePerformance } from './PerformanceMonitor';

// Optimized Message Component with lazy loading
const Message = ({ message, isOwn = false }) => {
  const { addMetric } = usePerformance();
  const [ref, inView] = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      addMetric('message_viewed', Date.now());
    }
  }, [inView, addMetric]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      ref={ref}
      className={`message ${isOwn ? 'own' : 'other'}`}
      data-message-id={message._id}
    >
      <div className="message-header">
        <span className="sender-name">{message.sender.name}</span>
        <span className="message-time">{formatTime(message.createdAt)}</span>
      </div>
      
      {message.text && (
        <div className="message-content">
          {message.text}
        </div>
      )}
      
      {message.fileUrl && (
        <div className="message-attachment">
          {message.fileType === 'image' ? (
            <LazyImage
              src={message.fileUrl}
              alt="Image attachment"
              className="message-image"
              placeholder="/image-placeholder.jpg"
            />
          ) : (
            <div className="file-attachment">
              <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                📎 View File
              </a>
            </div>
          )}
        </div>
      )}
      
      {message.reactions && message.reactions.length > 0 && (
        <div className="message-reactions">
          {message.reactions.map((reaction, index) => (
            <span key={index} className="reaction">
              {reaction.emoji} {reaction.user.name}
            </span>
          ))}
        </div>
      )}
      
      {message.edited && (
        <span className="edited-indicator">(edited)</span>
      )}
    </div>
  );
};

// Optimized Chat Room Component
const ChatRoom = ({ roomId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { apiCall } = usePerformance();

  const loadMessages = async () => {
    if (loading || !hasMore) return false;

    setLoading(true);
    
    try {
      const response = await apiCall('load_messages', async () => {
        const res = await fetch(`/api/rooms/${roomId}/messages?page=${page}&limit=50`);
        if (!res.ok) throw new Error('Failed to load messages');
        return res.json();
      });

      if (response.messages.length === 0) {
        setHasMore(false);
        return false;
      }

      setMessages(prev => [...prev, ...response.messages]);
      setPage(prev => prev + 1);
      return response.pagination.hasMore;
    } catch (error) {
      console.error('Error loading messages:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (newMessage) => {
    setMessages(prev => [newMessage, ...prev]);
  };

  return (
    <div className="chat-room">
      <div className="messages-container">
        <LazyMessages
          messages={messages}
          onLoadMore={loadMessages}
          hasMore={hasMore}
          isLoading={loading}
          messageComponent={(props) => (
            <Message 
              {...props} 
              isOwn={props.message.sender._id === currentUser._id}
            />
          )}
          className="messages-list"
        />
      </div>
      
      <MessageInput roomId={roomId} onNewMessage={handleNewMessage} />
    </div>
  );
};

// Optimized Message Input Component
const MessageInput = ({ roomId, onNewMessage }) => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { measureFunction } = usePerformance();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    await measureFunction('send_message', async () => {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            roomId,
            text: text.trim()
          })
        });

        if (!response.ok) throw new Error('Failed to send message');
        
        const newMessage = await response.json();
        onNewMessage(newMessage);
        setText('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      // Emit typing event to socket
    }
    
    // Debounce typing stop
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <div className="input-container">
        <input
          type="text"
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="message-input"
          maxLength={2000}
        />
        <button 
          type="submit" 
          disabled={!text.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
      {isTyping && (
        <div className="typing-indicator">
          {currentUser.name} is typing...
        </div>
      )}
    </form>
  );
};

// Optimized Room List Component
const RoomList = ({ rooms, currentRoom, onRoomSelect }) => {
  const [ref, inView] = useIntersectionObserver({ threshold: 0.1 });

  const formatLastMessage = (room) => {
    if (!room.lastMessage) return 'No messages yet';
    return room.lastMessage.text?.substring(0, 50) + '...' || 'Shared a file';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div ref={ref} className="room-list">
      {rooms.map((room) => (
        <div
          key={room._id}
          className={`room-item ${currentRoom === room._id ? 'active' : ''}`}
          onClick={() => onRoomSelect(room._id)}
        >
          <div className="room-avatar">
            {room.isGroup ? (
              <LazyImage
                src={room.avatar || '/group-avatar.png'}
                alt={room.name}
                className="avatar-image"
                placeholder="/avatar-placeholder.png"
              />
            ) : (
              <div className="direct-avatar">
                {room.members?.find(m => m._id !== currentUser._id)?.name?.[0] || '?'}
              </div>
            )}
          </div>
          
          <div className="room-info">
            <div className="room-header">
              <h3 className="room-name">
                {room.isGroup ? room.name : room.members?.find(m => m._id !== currentUser._id)?.name}
              </h3>
              <span className="last-message-time">
                {formatTime(room.lastMessageAt)}
              </span>
            </div>
            
            <div className="room-preview">
              <p className="last-message">{formatLastMessage(room)}</p>
              {room.unreadCount > 0 && (
                <span className="unread-badge">{room.unreadCount}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Optimized User Avatar Component
const UserAvatar = ({ user, size = 'medium', showStatus = true }) => {
  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large'
  };

  return (
    <div className={`user-avatar ${sizeClasses[size]}`}>
      {user.avatar ? (
        <LazyImage
          src={user.avatar}
          alt={user.name}
          className="avatar-image"
          placeholder="/avatar-placeholder.png"
        />
      ) : (
        <div className="avatar-fallback">
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      
      {showStatus && (
        <div className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`} />
      )}
    </div>
  );
};

// Usage example in main Chat component
const Chat = ({ currentUser }) => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const { apiCall } = usePerformance();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await apiCall('load_rooms', async () => {
        const res = await fetch('/api/rooms', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        return res.json();
      });
      
      setRooms(response);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="chat-loading">Loading chat...</div>;
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <RoomList
          rooms={rooms}
          currentRoom={currentRoom}
          onRoomSelect={setCurrentRoom}
        />
      </div>
      
      <div className="main-chat">
        {currentRoom ? (
          <ChatRoom roomId={currentRoom} currentUser={currentUser} />
        ) : (
          <div className="welcome-screen">
            <h2>Welcome to AlgoChat!</h2>
            <p>Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
export { Message, ChatRoom, RoomList, UserAvatar };
