import express from 'express';
import Joi from 'joi';
import Meeting from '../models/Meeting.js';
import MeetingChat from '../models/MeetingChat.js';
import User from '../models/User.js';
import { sendPushNotifications } from '../utils/push.js';

const router = express.Router();

// Validation schemas
const createMeetingSchema = Joi.object({
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().optional().max(1000),
  scheduledFor: Joi.date().optional(),
  duration: Joi.number().optional().min(15).max(480),
  maxParticipants: Joi.number().optional().min(2).max(1000),
  meetingType: Joi.string().valid('instant', 'scheduled', 'recurring').default('instant'),
  accessType: Joi.string().valid('public', 'private', 'restricted').default('private'),
  password: Joi.string().optional().min(4).max(20),
  waitingRoom: Joi.boolean().default(false),
  allowScreenShare: Joi.boolean().default(true),
  allowRecording: Joi.boolean().default(false),
  allowChat: Joi.boolean().default(true),
  muteParticipantsOnEntry: Joi.boolean().default(false),
  videoOffOnEntry: Joi.boolean().default(false),
  category: Joi.string().valid('general', 'education', 'business', 'personal', 'health').default('general'),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  settings: Joi.object({
    enableBreakoutRooms: Joi.boolean().default(false),
    enablePolls: Joi.boolean().default(false),
    enableWhiteboard: Joi.boolean().default(false),
    enableVirtualBackground: Joi.boolean().default(false),
    enableNoiseCancellation: Joi.boolean().default(false),
    enableLiveCaptions: Joi.boolean().default(false)
  }).optional(),
  isRecurring: Joi.boolean().default(false),
  recurringPattern: Joi.object({
    type: Joi.string().valid('daily', 'weekly', 'monthly').required(),
    interval: Joi.number().min(1).max(52).default(1),
    endDate: Joi.date().required()
  }).when('isRecurring', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const updateMeetingSchema = Joi.object({
  title: Joi.string().optional().min(1).max(200),
  description: Joi.string().optional().max(1000),
  scheduledFor: Joi.date().optional(),
  duration: Joi.number().optional().min(15).max(480),
  maxParticipants: Joi.number().optional().min(2).max(1000),
  accessType: Joi.string().optional().valid('public', 'private', 'restricted'),
  password: Joi.string().optional().min(4).max(20),
  waitingRoom: Joi.boolean().optional(),
  allowScreenShare: Joi.boolean().optional(),
  allowRecording: Joi.boolean().optional(),
  allowChat: Joi.boolean().optional(),
  muteParticipantsOnEntry: Joi.boolean().optional(),
  videoOffOnEntry: Joi.boolean().optional(),
  category: Joi.string().optional().valid('general', 'education', 'business', 'personal', 'health'),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  settings: Joi.object({
    enableBreakoutRooms: Joi.boolean(),
    enablePolls: Joi.boolean(),
    enableWhiteboard: Joi.boolean(),
    enableVirtualBackground: Joi.boolean(),
    enableNoiseCancellation: Joi.boolean(),
    enableLiveCaptions: Joi.boolean()
  }).optional()
});

const joinMeetingSchema = Joi.object({
  meetingId: Joi.string().required(),
  password: Joi.string().optional()
});

// Create a new meeting
router.post('/', async (req, res) => {
  try {
    const { error, value } = createMeetingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const meeting = new Meeting({
      ...value,
      host: req.user._id
    });

    // Add host as participant
    meeting.addParticipant(req.user._id, true);

    await meeting.save();
    await meeting.populate('host', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      code: 'SERVER_ERROR'
    });
  }
});

// Get user's meetings
router.get('/my-meetings', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.meetingType = type;
    }

    const meetings = await Meeting.find(query)
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Meeting.countDocuments(query);

    res.json({
      success: true,
      data: {
        meetings,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: meetings.length,
          overall: total
        }
      }
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meetings',
      code: 'SERVER_ERROR'
    });
  }
});

// Get meeting by ID
router.get('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId)
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        code: 'MEETING_NOT_FOUND'
      });
    }

    // Check access permissions
    const isHost = meeting.host._id.toString() === req.user._id.toString();
    const isParticipant = meeting.isParticipant(req.user._id);
    const isPublic = meeting.accessType === 'public';

    if (!isHost && !isParticipant && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meeting',
      code: 'SERVER_ERROR'
    });
  }
});

// Update meeting
router.put('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { error, value } = updateMeetingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        code: 'MEETING_NOT_FOUND'
      });
    }

    // Only host can update meeting
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only host can update meeting',
        code: 'ACCESS_DENIED'
      });
    }

    // Don't allow updates if meeting has already started
    if (meeting.status === 'started') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update meeting that has already started',
        code: 'MEETING_STARTED'
      });
    }

    Object.assign(meeting, value);
    await meeting.save();
    await meeting.populate('host', 'name email avatar');

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      code: 'SERVER_ERROR'
    });
  }
});

// Delete meeting
router.delete('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        code: 'MEETING_NOT_FOUND'
      });
    }

    // Only host can delete meeting
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only host can delete meeting',
        code: 'ACCESS_DENIED'
      });
    }

    // Don't allow deletion if meeting is active
    if (meeting.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active meeting',
        code: 'MEETING_ACTIVE'
      });
    }

    await Meeting.findByIdAndDelete(meetingId);
    await MeetingChat.deleteMany({ meeting: meetingId });

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting',
      code: 'SERVER_ERROR'
    });
  }
});

// Join meeting
router.post('/join', async (req, res) => {
  try {
    const { error, value } = joinMeetingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { meetingId, password } = value;

    const meeting = await Meeting.findOne({ meetingId })
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        code: 'MEETING_NOT_FOUND'
      });
    }

    // Check if meeting has ended
    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Meeting has ended',
        code: 'MEETING_ENDED'
      });
    }

    // Check password if required
    if (meeting.password && meeting.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid meeting password',
        code: 'INVALID_PASSWORD'
      });
    }

    // Check access permissions
    const isHost = meeting.host._id.toString() === req.user._id.toString();
    const isParticipant = meeting.isParticipant(req.user._id);
    const isPublic = meeting.accessType === 'public';

    if (!isHost && !isParticipant && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Add participant if not already added
    if (!isParticipant) {
      meeting.addParticipant(req.user._id);
      await meeting.save();
    }

    res.json({
      success: true,
      message: 'Joined meeting successfully',
      data: {
        meeting,
        isHost
      }
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join meeting',
      code: 'SERVER_ERROR'
    });
  }
});

// Start meeting
router.post('/:meetingId/start', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        code: 'MEETING_NOT_FOUND'
      });
    }

    // Only host can start meeting
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only host can start meeting',
        code: 'ACCESS_DENIED'
      });
    }

    if (meeting.status === 'started') {
      return res.status(400).json({
        success: false,
        message: 'Meeting already started',
        code: 'MEETING_STARTED'
      });
    }

    meeting.startMeeting();
    await meeting.save();

    // Send push notifications to participants
    const participants = meeting.participants
      .filter(p => p.user.toString() !== req.user._id.toString())
      .map(p => p.user);

    if (participants.length > 0) {
      const users = await User.find({ _id: { $in: participants } });
      await sendPushNotifications(users, {
        title: 'Meeting Started',
        body: `${req.user.name} has started the meeting: ${meeting.title}`,
        data: { 
          meetingId: meeting._id,
          meetingCode: meeting.meetingId,
          type: 'meeting_started'
        }
      });
    }

    res.json({
      success: true,
      message: 'Meeting started successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Start meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start meeting',
      code: 'SERVER_ERROR'
    });
  }
});

// End meeting
router.post('/:meetingId/end', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        code: 'MEETING_NOT_FOUND'
      });
    }

    // Only host can end meeting
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only host can end meeting',
        code: 'ACCESS_DENIED'
      });
    }

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Meeting already ended',
        code: 'MEETING_ENDED'
      });
    }

    meeting.endMeeting();
    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting ended successfully',
      data: meeting
    });
  } catch (error) {
    console.error('End meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end meeting',
      code: 'SERVER_ERROR'
    });
  }
});

// Get meeting chat messages
router.get('/:meetingId/chat', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        code: 'MEETING_NOT_FOUND'
      });
    }

    // Check access permissions
    const isHost = meeting.host.toString() === req.user._id.toString();
    const isParticipant = meeting.isParticipant(req.user._id);

    if (!isHost && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const messages = await MeetingChat.find({ 
      meeting: meetingId,
      isDeleted: false 
    })
      .populate('sender', 'name email avatar')
      .populate('replyTo', 'message sender')
      .populate('privateTo', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MeetingChat.countDocuments({ 
      meeting: meetingId,
      isDeleted: false 
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: messages.length,
          overall: total
        }
      }
    });
  } catch (error) {
    console.error('Get meeting chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meeting chat',
      code: 'SERVER_ERROR'
    });
  }
});

// Get public meetings
router.get('/public/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { 
      accessType: 'public',
      status: { $in: ['scheduled', 'started'] }
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const meetings = await Meeting.find(query)
      .populate('host', 'name email avatar')
      .sort({ scheduledFor: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Meeting.countDocuments(query);

    res.json({
      success: true,
      data: {
        meetings,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: meetings.length,
          overall: total
        }
      }
    });
  } catch (error) {
    console.error('Get public meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public meetings',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
