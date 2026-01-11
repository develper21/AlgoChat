import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Login from './components/Login.jsx';
import TwoFactorSetup from './components/TwoFactorSetup.jsx';
import ScheduledMessagesList from './components/ScheduledMessagesList.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import VerifyEmail from './components/VerifyEmail.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import UserProfile from './components/UserProfile.jsx';
import { setAuthToken } from './api/client.js';
import { fetchRooms, createRoom, fetchRoomMessages } from './api/rooms.js';
import { uploadFile } from './api/uploads.js';
import { initSocket, getSocket } from './socket.js';
import { initPushNotifications } from './utils/notifications.js';
import apiClient from './api/client.js';

const ProtectedRoute = ({ isAuthed, children }) => {
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
};

const ChatLayout = ({ auth }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showScheduledMessages, setShowScheduledMessages] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [pendingRoomId, setPendingRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  });

  useEffect(() => {
    if (!auth.token) return;

    const loadRooms = async () => {
      try {
        setIsLoading(true);
        const data = await fetchRooms();
        setRooms(data);
        if (!selectedRoom && data.length) {
          setSelectedRoom(data[0]);
        }
      } catch (error) {
        console.error('Rooms fetch failed', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token) return;
    const socket = initSocket(auth.token);

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('newMessage', (message) => {
      setRooms((prev) =>
        prev.map((room) =>
          room._id === message.room ? { ...room, lastMessageAt: message.createdAt } : room
        )
      );
      setMessages((prev) => (message.room === selectedRoom?._id ? [...prev, message] : prev));
    });

    socket.on('userTyping', ({ roomId, userId, isTyping }) => {
      if (userId === auth.user._id) return;
      setTypingUsers((prev) => {
        const roomTyping = { ...(prev[roomId] || {}) };
        if (isTyping) {
          roomTyping[userId] = true;
        } else {
          delete roomTyping[userId];
        }
        const updated = { ...prev, [roomId]: roomTyping };
        if (Object.keys(roomTyping).length === 0) {
          delete updated[roomId];
        }
        return updated;
      });
    });

    socket.on('messageEdited', (message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === message._id ? { ...msg, ...message } : msg))
      );
    });

    socket.on('messageDeleted', (message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === message._id ? { ...msg, ...message } : msg))
      );
    });

    socket.on('userStatusChanged', ({ userId, isOnline, lastSeen }) => {
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          members: room.members.map((member) =>
            member._id === userId ? { ...member, isOnline, lastSeen } : member
          )
        }))
      );
    });

    socket.on('roomMembersStatus', (members) => {
      if (selectedRoom) {
        setRooms((prev) =>
          prev.map((room) =>
            room._id === selectedRoom._id
              ? { ...room, members }
              : room
          )
        );
      }
    });

    socket.on('messageRead', ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { 
                ...msg, 
                readBy: [...(msg.readBy || []), readBy].filter(
                  (read, index, self) => 
                    index === self.findIndex((r) => r.user === read.user)
                )
              }
            : msg
        )
      );
    });

    socket.on('messageDelivered', ({ messageId, deliveredTo }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { 
                ...msg, 
                deliveredTo: [...(msg.deliveredTo || []), ...deliveredTo].filter(
                  (delivered, index, self) => 
                    index === self.findIndex((d) => d.user === delivered.user)
                )
              }
            : msg
        )
      );
    });

    socket.on('messageReaction', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions }
            : msg
        )
      );
    });

    socket.on('newThreadMessage', ({ message, parentMessageId, threadReplyCount }) => {
      // Update parent message thread count
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === parentMessageId
            ? { ...msg, threadReplyCount, isThreaded: true }
            : msg
        )
      );
      
      // If we're in the thread view, this would be handled by the thread component
      // For now, just update the parent message
    });

    return () => {
      socket.disconnect();
    };
  }, [auth.token, auth.user?._id, selectedRoom?._id]);

  useEffect(() => {
    const setupPush = async () => {
      if (!auth.token) return;
      try {
        const subscription = await initPushNotifications(import.meta.env.VITE_VAPID_PUBLIC_KEY);
        if (subscription) {
          await apiClient.post('/api/push/subscribe', subscription);
        }
      } catch (error) {
        console.error('Push subscription failed', error.message);
      }
    };

    setupPush();
  }, [auth.token]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return () => { };
    const handler = (event) => {
      if (event.data?.type === 'OPEN_ROOM' && event.data.roomId) {
        setPendingRoomId(event.data.roomId);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedRoom?._id) return;
      try {
        const data = await fetchRoomMessages(selectedRoom._id);
        setMessages(data);
        const socket = getSocket();
        socket?.emit('joinRoom', selectedRoom._id);
      } catch (error) {
        console.error('Messages fetch failed', error.message);
      }
    };

    loadMessages();
  }, [selectedRoom?._id]);

  useEffect(() => {
    if (!pendingRoomId || rooms.length === 0) return;
    const roomToOpen = rooms.find((room) => room._id === pendingRoomId);
    if (roomToOpen) {
      setSelectedRoom(roomToOpen);
      setPendingRoomId(null);
    }
  }, [pendingRoomId, rooms]);

  // Mark messages as read when room is selected or new messages arrive
  useEffect(() => {
    if (selectedRoom && messages.length > 0) {
      // Small delay to ensure messages are loaded
      const timer = setTimeout(markMessagesAsRead, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedRoom?._id, messages.length]);

  const handleSendMessage = ({ text, fileUrl, fileType }) => {
    const socket = getSocket();
    if (!socket || !selectedRoom) return;
    socket.emit('sendMessage', {
      roomId: selectedRoom._id,
      text,
      fileUrl,
      fileType
    });
  };

  const handleTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket || !selectedRoom) return;
    socket.emit('typing', { roomId: selectedRoom._id, isTyping });
  };

  const markMessagesAsRead = () => {
    const socket = getSocket();
    if (!socket || !selectedRoom || !auth.user) return;
    
    // Mark unread messages (not sent by current user) as read
    const unreadMessages = messages.filter(
      msg => msg.sender?._id !== auth.user._id && 
      !msg.readBy?.some(read => read.user === auth.user._id)
    );
    
    unreadMessages.forEach(msg => {
      socket.emit('markAsRead', { messageId: msg._id });
    });
  };

  const handleEditMessage = (messageId, text) => {
    // Optimistically update UI immediately
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, text, edited: true } : msg
      )
    );

    // Then emit socket event
    const socket = getSocket();
    socket?.emit('editMessage', { messageId, text });
  };

  const handleDeleteMessage = (messageId) => {
    // Optimistically update UI immediately
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, deleted: true, text: '' } : msg
      )
    );

    // Then emit socket event
    const socket = getSocket();
    socket?.emit('deleteMessage', { messageId });
  };

  const handleFileUpload = async (file) => {
    try {
      const data = await uploadFile(file);
      setUploadPreview({ url: data.url, type: data.type, file });
    } catch (error) {
      console.error('Upload failed', error.message);
    }
  };

  const clearUploadPreview = () => setUploadPreview(null);

  const handleCreateRoom = async (payload) => {
    try {
      const newRoom = await createRoom(payload);
      setRooms(prev => [newRoom, ...prev]);
      setSelectedRoom(newRoom);
    } catch (error) {
      console.error('Create room failed', error.message);
    }
  };

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt)),
    [rooms]
  );

  return (
    <div className="chat-app">
      <Sidebar
        rooms={sortedRooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        onCreateRoom={handleCreateRoom}
        user={auth.user}
        isLoading={isLoading}
      />
      <ChatWindow
        room={selectedRoom}
        messages={messages}
        currentUser={auth.user}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        typingUsers={typingUsers[selectedRoom?._id] || {}}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onFileUpload={handleFileUpload}
        uploadPreview={uploadPreview}
        clearUploadPreview={clearUploadPreview}
      />
    </div>
  );
};

const App = () => {
  const [auth, setAuth] = useState({ token: null, user: null });

  useEffect(() => {
    const savedToken = localStorage.getItem('algonive_token');
    const savedUser = localStorage.getItem('algonive_user');
    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setAuth({ token: savedToken, user: JSON.parse(savedUser) });
    }
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('algonive_token', data.token);
    localStorage.setItem('algonive_user', JSON.stringify(data.user));
    setAuthToken(data.token);
    setAuth({ token: data.token, user: data.user });
  };

  const handleLogout = () => {
    localStorage.removeItem('algonive_token');
    localStorage.removeItem('algonive_user');
    setAuth({ token: null, user: null });
    const socket = getSocket();
    socket?.disconnect();
  };

  const handleProfileUpdate = (updatedUser) => {
    setAuth(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem('algonive_user', JSON.stringify(updatedUser));
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/login"
          element={<Login onSuccess={handleAuthSuccess} isAuthed={!!auth.token} />}
        />
        <Route
          path="/register"
          element={<Register onSuccess={handleAuthSuccess} isAuthed={!!auth.token} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthed={!!auth.token}>
              <div className="app-container">
                <header className="top-nav">
                  <div className="brand-block">
                    <div className="brand-spark">
                      <span />
                    </div>
                    <div>
                      <p className="eyebrow">Algonive Collaboration Cloud</p>
                      <h1>Engagement Command Center</h1>
                    </div>
                  </div>
                  <div className="top-nav-actions">
                    <div className="presence-card">
                      <span className="status-dot online" />
                      <div>
                        <strong>{auth.user?.name}</strong>
                        <small>Connected</small>
                      </div>
                    </div>
                    <button type="button" className="secondary" onClick={() => setShowUserProfile(true)}>
                      Profile
                    </button>
                    <button type="button" className="secondary" onClick={() => setShowTwoFactor(true)}>
                      2FA
                    </button>
                    <button type="button" className="secondary" onClick={() => setShowScheduledMessages(true)}>
                      Scheduled
                    </button>
                    <button type="button" className="secondary">
                      New Initiative
                    </button>
                    <button type="button" onClick={handleLogout}>
                      Sign out
                    </button>
                  </div>
                </header>
                <div className="app-content">
                  <Sidebar
                    rooms={rooms}
                    selectedRoom={selectedRoom}
                    onSelectRoom={setSelectedRoom}
                    onCreateRoom={handleCreateRoom}
                    user={auth.user}
                    isLoading={isLoading}
                  />
                  <ChatWindow
                    room={selectedRoom}
                    messages={messages}
                    currentUser={auth.user}
                    rooms={rooms}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    typingUsers={typingUsers}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onFileUpload={handleFileUpload}
                    uploadPreview={uploadPreview}
                    clearUploadPreview={() => setUploadPreview(null)}
                  />
                </div>
                
                {showUserProfile && (
                  <UserProfile
                    currentUser={auth.user}
                    onClose={() => setShowUserProfile(false)}
                    onUpdate={handleProfileUpdate}
                  />
                )}
                
                {showScheduledMessages && (
                  <ScheduledMessagesList
                    currentUser={auth.user}
                    onClose={() => setShowScheduledMessages(false)}
                  />
                )}
                
                {showTwoFactor && (
                  <TwoFactorSetup
                    user={auth.user}
                    onClose={() => setShowTwoFactor(false)}
                    onToggle={() => {
                      // Refresh user data to update 2FA status
                      handleProfileUpdate({ ...auth.user, twoFactorEnabled: !auth.user.twoFactorEnabled });
                    }}
                  />
                )}
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={auth.token ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
