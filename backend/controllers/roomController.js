import Room from '../models/Room.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { formatMessages } from '../utils/messageFormatter.js';
import cacheService from '../services/cacheService.js';
import Logger from '../services/logger.js';
import performanceMonitor from '../middleware/performanceMonitor.js';

export const listRooms = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // Try cache first
    const cacheMonitor = performanceMonitor.cacheMonitor();
    const cachedRooms = await cacheMonitor.get(`user:${userId}:rooms`, async () => 
      cacheService.getUserRooms(userId)
    );
    
    if (cachedRooms) {
      Logger.cacheOperation('hit', `user:${userId}:rooms`);
      return res.json(cachedRooms);
    }
    
    // Get from database with monitoring
    const rooms = await performanceMonitor.databaseMonitor(
      'list_user_rooms',
      async () => Room.find({ members: req.user._id })
        .populate('members', 'name email avatar')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean()
    );

    // Cache the result
    await cacheService.cacheUserRooms(userId, rooms);
    
    Logger.userAction(userId, 'listed_rooms', { count: rooms.length });
    res.json(rooms);
  } catch (error) {
    Logger.error('Failed to list rooms', error, { userId: req.user._id });
    res.status(500).json({ message: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { name, memberIds = [], memberEmails = [], isGroup = false } = req.body;

    if (isGroup && !name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const resolvedMemberIds = [...memberIds];
    if (memberEmails.length) {
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach((user) => resolvedMemberIds.push(user._id.toString()));
    }

    const uniqueMemberIds = [...new Set([...resolvedMemberIds, req.user._id.toString()])];

    if (!isGroup && uniqueMemberIds.length !== 2) {
      return res.status(400).json({ message: '1:1 room requires exactly one other member' });
    }

    if (!isGroup) {
      const existingRoom = await Room.findOne({
        isGroup: false,
        members: { $all: uniqueMemberIds, $size: 2 }
      });

      if (existingRoom) {
        return res.json(existingRoom);
      }
    }

    const room = await Room.create({
      name: isGroup ? name : 'Direct Chat',
      isGroup,
      members: uniqueMemberIds
    });

    const populated = await room.populate('members', 'name email avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user._id.toString();
    
    // Generate cache key
    const cacheKey = `room:${roomId}:messages:${page}:${limit}:${before || 'latest'}`;
    
    // Try cache first
    const cacheMonitor = performanceMonitor.cacheMonitor();
    const cachedMessages = await cacheMonitor.get(cacheKey, async () => 
      cacheService.getRoomMessages(roomId)
    );
    
    if (cachedMessages) {
      Logger.cacheOperation('hit', cacheKey);
      return res.json(cachedMessages);
    }
    
    // Verify room access
    const room = await performanceMonitor.databaseMonitor(
      'get_room_access',
      async () => Room.findById(roomId).lean()
    );
    
    if (!room) {
      Logger.warn('Room not found', { roomId, userId });
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const isMember = room.members.some((member) => member.toString() === userId);
    if (!isMember) {
      Logger.securityEvent('unauthorized_room_access', { roomId, userId });
      return res.status(403).json({ message: 'Access denied' });
    }

    const limitNum = Math.min(parseInt(limit), 100); // Max 100 messages per page
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { room: roomId, deleted: false };
    
    // If 'before' parameter is provided, get messages before that timestamp
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages with pagination and monitoring
    const messages = await performanceMonitor.databaseMonitor(
      'get_room_messages_paginated',
      async () => Message.find(query)
        .sort({ createdAt: -1 }) // Get newest first for pagination
        .skip(skip)
        .limit(limitNum)
        .populate('sender', 'name email avatar')
        .populate('reactions.user', 'name email avatar')
        .lean() // Use lean for better performance
    );

    // Get total count for pagination info
    const total = await performanceMonitor.databaseMonitor(
      'count_room_messages',
      async () => Message.countDocuments(query)
    );

    // Reverse order to show oldest first (like typical chat)
    const formattedMessages = formatMessages(messages.reverse());

    const response = {
      messages: formattedMessages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total,
        nextCursor: messages.length > 0 ? messages[messages.length - 1].createdAt : null
      }
    };

    // Cache the result for shorter time since messages change frequently
    await cacheService.cacheRoomMessages(roomId, response, 300); // 5 minutes

    Logger.userAction(userId, 'viewed_room_messages', { 
      roomId, 
      page: pageNum, 
      messageCount: messages.length 
    });

    res.json(response);
  } catch (error) {
    Logger.error('Failed to get room messages', error, { 
      roomId: req.params.roomId, 
      userId: req.user._id 
    });
    res.status(500).json({ message: error.message });
  }
};
