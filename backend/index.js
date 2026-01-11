import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { Server } from 'socket.io';
import './config/env.js';
import corsOptions from './config/cors.js';
import { generalLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/uploads.js';
import pushRoutes from './routes/push.js';
import searchRoutes from './routes/search.js';
import profileRoutes from './routes/profile.js';
import twoFactorRoutes from './routes/twoFactor.js';
import authMiddleware from './middleware/auth.js';
import Message from './models/Message.js';
import Room from './models/Room.js';
import { sendPushNotifications } from './utils/push.js';
import { formatMessage } from './utils/messageFormatter.js';
import { errorHandler } from './utils/errorHandler.js';
import messageScheduler from './utils/scheduler.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions
});

const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(generalLimiter);

app.get('/', (_req, res) => res.send('Algonive Real-Time Chat API'));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', authMiddleware, roomRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);
app.use('/api/push', authMiddleware, pushRoutes);
app.use('/api/search', authMiddleware, searchRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/2fa', twoFactorRoutes);

// 404 handler
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// Global error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Reschedule any pending scheduled messages
    await messageScheduler.reschedulePendingMessages();

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Mongo connection error', error.message);
    process.exit(1);
  }
};

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    const user = await authMiddleware.decodeSocketToken(token);
    socket.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

io.use(socketAuth);

const emitRoomUpdate = (roomId, event, payload) => {
  io.to(roomId.toString()).emit(event, payload);
};

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();

  // Update user online status
  const updateUserOnlineStatus = async (isOnline) => {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: isOnline ? new Date() : new Date()
      });
      
      // Broadcast status change to all rooms where user is a member
      const userRooms = await Room.find({ members: userId });
      userRooms.forEach(room => {
        socket.to(room._id.toString()).emit('userStatusChanged', {
          userId,
          isOnline,
          lastSeen: new Date()
        });
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Set user online when connected
  updateUserOnlineStatus(true);

  socket.on('joinRoom', async (roomId) => {
    const room = await Room.findById(roomId).populate('members', 'name email avatar isOnline lastSeen');
    if (!room) return;
    const isMember = room.members.some((member) => member._id.toString() === userId);
    if (!isMember) return;
    socket.join(roomId);
    
    // Send current room members' online status
    socket.emit('roomMembersStatus', room.members);
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('userTyping', { roomId, userId, isTyping });
  });

  socket.on('sendMessage', async ({ roomId, text, fileUrl, fileType }) => {
    try {
      if (!text?.trim() && !fileUrl) return;
      const room = await Room.findById(roomId).populate('members', 'pushSubscriptions isOnline');
      if (!room) return;
      const isMember = room.members.some((member) => member._id.toString() === userId);
      if (!isMember) return;

      const message = await Message.create({
        room: roomId,
        sender: userId,
        text,
        fileUrl,
        fileType
      });

      // Add delivery tracking for online users
      const onlineMembers = room.members.filter(
        member => member._id.toString() !== userId && member.isOnline
      );
      
      message.deliveredTo = onlineMembers.map(member => ({
        user: member._id,
        deliveredAt: new Date()
      }));
      
      await message.save();

      room.lastMessageAt = new Date();
      await room.save();

      const populatedMessage = await message.populate('sender', 'name email avatar');
      const formatted = formatMessage(populatedMessage);
      
      // Emit to room with delivery status
      emitRoomUpdate(roomId, 'newMessage', formatted);
      
      // Emit delivery status to sender
      socket.emit('messageDelivered', {
        messageId: message._id,
        deliveredTo: message.deliveredTo
      });

      const recipients = room.members.filter((member) => member._id.toString() !== userId);
      if (recipients.length) {
        await sendPushNotifications(recipients, {
          title: 'New message',
          body: text || 'Sent a file',
          data: { roomId }
        });
      }
    } catch (error) {
      console.error('sendMessage error', error.message);
    }
  });

  socket.on('editMessage', async ({ messageId, text }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId) return;
      message.text = text;
      message.edited = true;
      await message.save();
      emitRoomUpdate(message.room, 'messageEdited', formatMessage(message));
    } catch (error) {
      console.error('editMessage error', error.message);
    }
  });

  socket.on('deleteMessage', async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId) return;
      message.deleted = true;
      message.text = '';
      message.fileUrl = undefined;
      message.fileType = undefined;
      await message.save();
      emitRoomUpdate(message.room, 'messageDeleted', formatMessage(message));
    } catch (error) {
      console.error('deleteMessage error', error.message);
    }
  });

  socket.on('markAsRead', async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const room = await Room.findById(message.room);
      if (!room) return;
      
      const isMember = room.members.some((member) => member._id.toString() === userId);
      if (!isMember) return;

      // Don't mark own messages as read
      if (message.sender.toString() === userId) return;

      // Check if already read by this user
      const alreadyRead = message.readBy.some(
        read => read.user.toString() === userId
      );

      if (!alreadyRead) {
        message.readBy.push({
          user: userId,
          readAt: new Date()
        });
        await message.save();

        // Emit read status to room
        emitRoomUpdate(message.room, 'messageRead', {
          messageId: message._id,
          readBy: {
            user: userId,
            readAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('markAsRead error', error.message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    updateUserOnlineStatus(false);
  });
});

startServer();
