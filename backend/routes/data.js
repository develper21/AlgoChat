import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Meeting from '../models/Meeting.js';
import Room from '../models/Room.js';
import AuditLog from '../models/AuditLog.js';
import ModerationReport from '../models/Moderation.js';
import { checkPermission } from '../middleware/permissions.js';
import { logUserAction, logSecurityEvent } from '../middleware/audit.js';
import { Parser } from 'json2csv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and CSV files are allowed'), false);
    }
  }
});

// Validation schemas
const exportSchema = Joi.object({
  dataType: Joi.string().required().valid(
    'users',
    'messages',
    'meetings',
    'rooms',
    'audit_logs',
    'moderation_reports',
    'all_data'
  ),
  format: Joi.string().valid('json', 'csv').default('json'),
  dateRange: Joi.object({
    startDate: Joi.date(),
    endDate: Joi.date()
  }),
  filters: Joi.object(),
  fields: Joi.array().items(Joi.string()),
  includeDeleted: Joi.boolean().default(false),
  compression: Joi.boolean().default(false)
});

const importSchema = Joi.object({
  dataType: Joi.string().required().valid(
    'users',
    'messages',
    'meetings',
    'rooms'
  ),
  overwrite: Joi.boolean().default(false),
  validateData: Joi.boolean().default(true),
  skipErrors: Joi.boolean().default(false)
});

// Export data
router.post('/export', checkPermission('system', 'export'), async (req, res) => {
  try {
    const { error, value } = exportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { dataType, format, dateRange, filters, fields, includeDeleted, compression } = value;
    const user = req.user;

    // Build query based on date range and filters
    const buildQuery = (model, additionalFilters = {}) => {
      const query = { ...additionalFilters };
      
      if (dateRange?.startDate || dateRange?.endDate) {
        query.createdAt = {};
        if (dateRange.startDate) query.createdAt.$gte = new Date(dateRange.startDate);
        if (dateRange.endDate) query.createdAt.$lte = new Date(dateRange.endDate);
      }
      
      if (filters) {
        Object.assign(query, filters);
      }
      
      if (!includeDeleted) {
        query.deletedAt = { $exists: false };
      }
      
      return query;
    };

    let data = [];
    let filename = '';
    let model = null;

    switch (dataType) {
      case 'users':
        model = User;
        filename = 'users_export';
        data = await User.find(buildQuery(model))
          .select(fields?.join(' ') || '-password -twoFactorSecret -twoFactorBackupCodes')
          .populate('roles primaryRole manager', 'name displayName email');
        break;

      case 'messages':
        model = Message;
        filename = 'messages_export';
        data = await Message.find(buildQuery(model))
          .populate('sender replyTo', 'name email avatar')
          .populate('room', 'name');
        break;

      case 'meetings':
        model = Meeting;
        filename = 'meetings_export';
        data = await Meeting.find(buildQuery(model))
          .populate('host participants.user', 'name email avatar');
        break;

      case 'rooms':
        model = Room;
        filename = 'rooms_export';
        data = await Room.find(buildQuery(model))
          .populate('members lastMessage', 'name email avatar');
        break;

      case 'audit_logs':
        model = AuditLog;
        filename = 'audit_logs_export';
        data = await AuditLog.find(buildQuery(model))
          .populate('user', 'name email avatar');
        break;

      case 'moderation_reports':
        model = ModerationReport;
        filename = 'moderation_reports_export';
        data = await ModerationReport.find(buildQuery(model))
          .populate('reporter reportedUser moderator assignedTo', 'name email avatar');
        break;

      case 'all_data':
        filename = 'complete_export';
        data = {
          users: await User.find(buildQuery(User))
            .select('-password -twoFactorSecret -twoFactorBackupCodes')
            .populate('roles primaryRole manager', 'name displayName email'),
          messages: await Message.find(buildQuery(Message))
            .populate('sender replyTo', 'name email avatar'),
          meetings: await Meeting.find(buildQuery(Meeting))
            .populate('host participants.user', 'name email avatar'),
          rooms: await Room.find(buildQuery(Room))
            .populate('members', 'name email avatar'),
          auditLogs: await AuditLog.find(buildQuery(AuditLog))
            .populate('user', 'name email avatar'),
          moderationReports: await ModerationReport.find(buildQuery(ModerationReport))
            .populate('reporter reportedUser moderator', 'name email avatar')
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid data type',
          code: 'INVALID_DATA_TYPE'
        });
    }

    // Format data
    let exportData;
    let contentType = 'application/json';

    if (format === 'csv') {
      if (dataType === 'all_data') {
        return res.status(400).json({
          success: false,
          message: 'CSV format not supported for all_data export',
          code: 'CSV_NOT_SUPPORTED'
        });
      }

      const parser = new Parser();
      exportData = parser.parse(data);
      contentType = 'text/csv';
      filename += '.csv';
    } else {
      exportData = JSON.stringify(data, null, 2);
      filename += '.json';
    }

    // Add timestamp to filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = `${filename}_${timestamp}`;

    // Log export action
    await logUserAction(user, 'export', dataType, {
      metadata: {
        format,
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        dateRange,
        filters,
        filename: fullFilename
      }
    });

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);
    
    if (compression) {
      // Implement compression if needed
      res.send(exportData);
    } else {
      res.send(exportData);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      code: 'EXPORT_ERROR'
    });
  }
});

// Import data
router.post('/import', checkPermission('system', 'import'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        code: 'NO_FILE_UPLOADED'
      });
    }

    const { error, value } = importSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { dataType, overwrite, validateData, skipErrors } = value;
    const user = req.user;
    const filePath = req.file.path;

    // Read file content
    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to read file',
        code: 'FILE_READ_ERROR'
      });
    }

    // Parse file content
    let importData;
    try {
      if (req.file.mimetype === 'application/json') {
        importData = JSON.parse(fileContent);
      } else if (req.file.mimetype === 'text/csv') {
        // Parse CSV (would need a CSV parser library)
        return res.status(400).json({
          success: false,
          message: 'CSV import not yet implemented',
          code: 'CSV_NOT_SUPPORTED'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse file content',
        code: 'FILE_PARSE_ERROR'
      });
    }

    // Validate and import data
    const results = await importDataByType(dataType, importData, {
      overwrite,
      validateData,
      skipErrors,
      user
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Log import action
    await logUserAction(user, 'import', dataType, {
      metadata: {
        filename: req.file.originalname,
        recordCount: results.total,
        successCount: results.success,
        errorCount: results.errors.length,
        overwrite
      }
    });

    res.json({
      success: true,
      message: 'Data import completed',
      data: results
    });

  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to import data',
      code: 'IMPORT_ERROR'
    });
  }
});

// Get import/export history
router.get('/history', checkPermission('system', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, dataType, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = { action: { $in: ['export', 'import'] } };
    
    if (action) query.action = action;
    if (dataType) query['metadata.dataType'] = dataType;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email avatar');

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: logs.length,
          overall: total
        }
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      code: 'HISTORY_ERROR'
    });
  }
});

// Get data statistics
router.get('/statistics', checkPermission('system', 'read'), async (req, res) => {
  try {
    const statistics = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        suspended: await User.countDocuments({ isSuspended: true }),
        withRoles: await User.countDocuments({ roles: { $exists: true, $ne: [] } })
      },
      messages: {
        total: await Message.countDocuments(),
        last30Days: await Message.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        deleted: await Message.countDocuments({ deleted: true })
      },
      meetings: {
        total: await Meeting.countDocuments(),
        active: await Meeting.countDocuments({ isActive: true }),
        completed: await Meeting.countDocuments({ status: 'ended' }),
        scheduled: await Meeting.countDocuments({ status: 'scheduled' })
      },
      rooms: {
        total: await Room.countDocuments(),
        active: await Room.countDocuments({ 
          lastMessageAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      },
      auditLogs: {
        total: await AuditLog.countDocuments(),
        last30Days: await AuditLog.countDocuments({
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      },
      moderationReports: {
        total: await ModerationReport.countDocuments(),
        pending: await ModerationReport.countDocuments({ status: 'pending' }),
        resolved: await ModerationReport.countDocuments({ status: 'resolved' })
      }
    };

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      code: 'STATISTICS_ERROR'
    });
  }
});

// Helper function to import data by type
async function importDataByType(dataType, data, options) {
  const { overwrite, validateData, skipErrors, user } = options;
  const results = {
    total: 0,
    success: 0,
    errors: [],
    warnings: []
  };

  try {
    if (!Array.isArray(data)) {
      data = [data];
    }

    results.total = data.length;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      try {
        switch (dataType) {
          case 'users':
            await importUser(item, options);
            break;
          case 'messages':
            await importMessage(item, options);
            break;
          case 'meetings':
            await importMeeting(item, options);
            break;
          case 'rooms':
            await importRoom(item, options);
            break;
          default:
            throw new Error('Unsupported data type');
        }
        
        results.success++;
      } catch (error) {
        const errorInfo = {
          index: i,
          message: error.message,
          data: item._id || item.id || 'unknown'
        };
        
        if (skipErrors) {
          results.errors.push(errorInfo);
        } else {
          throw error;
        }
      }
    }

    return results;

  } catch (error) {
    console.error('Import data error:', error);
    throw error;
  }
}

// Helper functions for importing specific data types
async function importUser(userData, options) {
  const { overwrite, validateData } = options;
  
  // Validate required fields
  if (!userData.email) {
    throw new Error('User email is required');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: userData.email });
  
  if (existingUser) {
    if (!overwrite) {
      throw new Error(`User with email ${userData.email} already exists`);
    }
    
    // Update existing user
    Object.assign(existingUser, userData);
    await existingUser.save();
  } else {
    // Create new user
    const user = new User(userData);
    await user.save();
  }
}

async function importMessage(messageData, options) {
  const { overwrite } = options;
  
  if (!messageData.text && !messageData.fileUrl) {
    throw new Error('Message must have text or file');
  }

  let message;
  if (messageData._id && overwrite) {
    message = await Message.findById(messageData._id);
    if (message) {
      Object.assign(message, messageData);
      await message.save();
    }
  } else {
    message = new Message(messageData);
    await message.save();
  }
}

async function importMeeting(meetingData, options) {
  const { overwrite } = options;
  
  if (!meetingData.title) {
    throw new Error('Meeting title is required');
  }

  let meeting;
  if (meetingData._id && overwrite) {
    meeting = await Meeting.findById(meetingData._id);
    if (meeting) {
      Object.assign(meeting, meetingData);
      await meeting.save();
    }
  } else {
    meeting = new Meeting(meetingData);
    await meeting.save();
  }
}

async function importRoom(roomData, options) {
  const { overwrite } = options;
  
  if (!roomData.name) {
    throw new Error('Room name is required');
  }

  let room;
  if (roomData._id && overwrite) {
    room = await Room.findById(roomData._id);
    if (room) {
      Object.assign(room, roomData);
      await room.save();
    }
  } else {
    room = new Room(roomData);
    await room.save();
  }
}

export default router;
