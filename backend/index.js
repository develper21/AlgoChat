import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { Server } from 'socket.io';
import './config/env.js';

import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/uploads.js';
import pushRoutes from './routes/push.js';
import authMiddleware from './middleware/auth.js';
import Message from './models/Message.js';
import Room from './models/Room.js';
import { sendPushNotifications } from './utils/push.js';
import { formatMessage } from './utils/messageFormatter.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/', (_req, res) => res.send('Algonive Real-Time Chat API'));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', authMiddleware, roomRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);
app.use('/api/push', authMiddleware, pushRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

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

  socket.on('joinRoom', async (roomId) => {
    const room = await Room.findById(roomId);
    if (!room) return;
    const isMember = room.members.some((member) => member.toString() === userId);
    if (!isMember) return;
    socket.join(roomId);
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('userTyping', { roomId, userId, isTyping });
  });

  socket.on('sendMessage', async ({ roomId, text, fileUrl, fileType }) => {
    try {
      if (!text?.trim() && !fileUrl) return;
      const room = await Room.findById(roomId).populate('members', 'pushSubscriptions');
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

      room.lastMessageAt = new Date();
      await room.save();

      const populatedMessage = await message.populate('sender', 'name email avatar');
      const formatted = formatMessage(populatedMessage);
      emitRoomUpdate(roomId, 'newMessage', formatted);

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
});

startServer();
