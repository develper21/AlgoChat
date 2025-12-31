import Room from '../models/Room.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { formatMessages } from '../utils/messageFormatter.js';

export const listRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('members', 'name email avatar')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
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
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const isMember = room.members.some((member) => member.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email avatar');

    res.json(formatMessages(messages));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
