import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { sendPushNotifications } from '../utils/push.js';
import { formatMessage } from '../utils/messageFormatter.js';

export const sendMessage = async (req, res) => {
  try {
    const { roomId, text, fileUrl, fileType } = req.body;
    const cleanText = text?.trim();
    if (!cleanText && !fileUrl) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    const room = await Room.findById(roomId).populate('members', 'pushSubscriptions');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isMember = room.members.some((member) => member._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      text: cleanText,
      fileUrl,
      fileType
    });

    room.lastMessageAt = new Date();
    await room.save();

    const populatedMessage = await message.populate('sender', 'name email avatar');

    const recipients = room.members.filter((member) => member._id.toString() !== req.user._id.toString());
    if (recipients.length) {
      await sendPushNotifications(recipients, {
        title: 'New message',
        body: text || 'Sent a file',
        data: { roomId }
      });
    }

    res.status(201).json(formatMessage(populatedMessage));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const cleanText = text?.trim();
    if (!cleanText) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot edit this message' });
    }

    message.text = cleanText;
    message.edited = true;
    await message.save();
    await message.populate('sender', 'name email avatar');

    res.json(formatMessage(message));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete this message' });
    }

    message.deleted = true;
    message.text = '';
    message.fileUrl = undefined;
    message.fileType = undefined;
    await message.save();
    await message.populate('sender', 'name email avatar');

    res.json(formatMessage(message));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
