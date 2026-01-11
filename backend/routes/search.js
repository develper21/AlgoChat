import { Router } from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Search messages in a room
router.get('/messages/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Verify user is member of the room
    const room = await Room.findById(roomId);
    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (page - 1) * limit;
    
    const messages = await Message.find({
      room: roomId,
      text: { $regex: q, $options: 'i' },
      deleted: false
    })
    .populate('sender', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      room: roomId,
      text: { $regex: q, $options: 'i' },
      deleted: false
    });

    res.json({
      messages,
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

// Search users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email avatar isOnline lastSeen')
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    });

    res.json({
      users,
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

// Search all messages across all user's rooms
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Get all rooms user is member of
    const userRooms = await Room.find({ members: req.user._id });
    const roomIds = userRooms.map(room => room._id);

    const skip = (page - 1) * limit;
    
    const messages = await Message.find({
      room: { $in: roomIds },
      text: { $regex: q, $options: 'i' },
      deleted: false
    })
    .populate('sender', 'name email avatar')
    .populate('room', 'name isGroup members')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      room: { $in: roomIds },
      text: { $regex: q, $options: 'i' },
      deleted: false
    });

    res.json({
      messages,
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

export default router;
