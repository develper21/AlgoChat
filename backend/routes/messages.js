import { Router } from 'express';
import { sendMessage, editMessage, deleteMessage } from '../controllers/messageController.js';
import authMiddleware from '../middleware/auth.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { emitRoomUpdate, formatMessage } from '../utils/socket.js';

const router = Router();

router.post('/', sendMessage);
router.put('/:messageId/edit', editMessage);
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id) return res.status(403).json({ message: 'Cannot delete others messages' });
    message.deleted = true;
    message.text = '';
    message.fileUrl = undefined;
    message.fileType = undefined;
    await message.save();
    emitRoomUpdate(message.room, 'messageDeleted', formatMessage(message));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is member of the room
    const room = await Room.findById(message.room);
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      reaction => reaction.user.toString() === req.user._id.toString() && reaction.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({ message: 'You already reacted with this emoji' });
    }

    // Remove any existing reaction from this user (different emoji)
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      user: req.user._id,
      emoji,
      createdAt: new Date()
    });

    await message.save();

    const populatedMessage = await message.populate('reactions.user', 'name email avatar');
    emitRoomUpdate(message.room, 'messageReaction', {
      messageId: message._id,
      reactions: populatedMessage.reactions
    });

    res.json({ success: true, reactions: populatedMessage.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove reaction from message
router.delete('/:messageId/reactions/:emoji', authMiddleware, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is member of the room
    const room = await Room.findById(message.room);
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove the reaction
    message.reactions = message.reactions.filter(
      reaction => !(reaction.user.toString() === req.user._id.toString() && reaction.emoji === emoji)
    );

    await message.save();

    const populatedMessage = await message.populate('reactions.user', 'name email avatar');
    emitRoomUpdate(message.room, 'messageReaction', {
      messageId: message._id,
      reactions: populatedMessage.reactions
    });

    res.json({ success: true, reactions: populatedMessage.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forward message to another room
router.post('/:messageId/forward', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { roomId, text } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ message: 'Target room is required' });
    }

    // Get original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Original message not found' });
    }

    // Check if user is member of room containing original message
    const originalRoom = await Room.findById(originalMessage.room);
    if (!originalRoom.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to original message' });
    }

    // Check if user is member of target room
    const targetRoom = await Room.findById(roomId);
    if (!targetRoom.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to target room' });
    }

    // Create forwarded message
    const forwardedMessage = await Message.create({
      room: roomId,
      sender: req.user._id,
      text: text || originalMessage.text,
      fileUrl: originalMessage.fileUrl,
      fileType: originalMessage.fileType,
      forwardedFrom: {
        messageId: originalMessage._id,
        senderName: originalMessage.sender.name,
        originalRoom: originalRoom.name,
        originalText: originalMessage.text
      }
    });

    // Update room timestamp
    targetRoom.lastMessageAt = new Date();
    await targetRoom.save();

    const populatedMessage = await forwardedMessage.populate('sender', 'name email avatar');
    const formatted = formatMessage(populatedMessage);
    
    emitRoomUpdate(roomId, 'newMessage', formatted);

    res.json({ success: true, message: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start a thread on a message
router.post('/:messageId/thread', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, fileUrl, fileType } = req.body;
    
    if (!text && !fileUrl) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
      return res.status(404).json({ message: 'Parent message not found' });
    }

    // Check if user is member of the room
    const room = await Room.findById(parentMessage.room);
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create thread message
    const threadMessage = await Message.create({
      room: parentMessage.room,
      sender: req.user._id,
      text,
      fileUrl,
      fileType,
      threadId: parentMessage._id,
      isThreaded: true
    });

    // Update parent message
    parentMessage.threadReplies.push(threadMessage._id);
    parentMessage.threadReplyCount = parentMessage.threadReplies.length;
    parentMessage.isThreaded = true;
    await parentMessage.save();

    const populatedMessage = await threadMessage.populate('sender', 'name email avatar');
    const formatted = formatMessage(populatedMessage);
    
    emitRoomUpdate(parentMessage.room, 'newThreadMessage', {
      message: formatted,
      parentMessageId: parentMessage._id,
      threadReplyCount: parentMessage.threadReplyCount
    });

    res.json({ success: true, message: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get thread messages
router.get('/:messageId/thread', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
      return res.status(404).json({ message: 'Parent message not found' });
    }

    // Check if user is member of the room
    const room = await Room.findById(parentMessage.room);
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (page - 1) * limit;

    // Get thread messages
    const threadMessages = await Message.find({
      threadId: messageId,
      deleted: false
    })
    .populate('sender', 'name email avatar')
    .populate('reactions.user', 'name email avatar')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      threadId: messageId,
      deleted: false
    });

    res.json({
      messages: threadMessages.map(formatMessage),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Schedule a message
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const { roomId, text, fileUrl, fileType, scheduledFor } = req.body;
    
    if (!scheduledFor) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }

    const scheduledDate = new Date(scheduledFor);
    const now = new Date();

    if (scheduledDate <= now) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create scheduled message
    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      text,
      fileUrl,
      fileType,
      scheduledFor: scheduledDate,
      isScheduled: true,
      scheduleStatus: 'pending'
    });

    // Schedule the message
    const messageScheduler = (await import('../utils/scheduler.js')).default;
    messageScheduler.scheduleMessage(message);

    const populatedMessage = await message.populate('sender', 'name email avatar');
    
    res.json({ 
      success: true, 
      message: populatedMessage 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's scheduled messages
router.get('/scheduled', authMiddleware, async (req, res) => {
  try {
    const messageScheduler = (await import('../utils/scheduler.js')).default;
    const scheduledMessages = await messageScheduler.getUserScheduledMessages(req.user._id);
    
    res.json({
      messages: scheduledMessages.map(msg => ({
        ...msg.toJSON(),
        room: msg.room
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel scheduled message
router.delete('/schedule/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Can only cancel your own scheduled messages' });
    }

    if (!message.isScheduled || message.scheduleStatus !== 'pending') {
      return res.status(400).json({ message: 'Message is not scheduled or already sent' });
    }

    // Cancel the schedule
    const messageScheduler = (await import('../utils/scheduler.js')).default;
    const cancelled = messageScheduler.cancelSchedule(messageId);

    if (cancelled) {
      res.json({ success: true, message: 'Scheduled message cancelled' });
    } else {
      res.status(400).json({ message: 'Failed to cancel scheduled message' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
