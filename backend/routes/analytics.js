import express from 'express';
import Joi from 'joi';
import analyticsService from '../services/analyticsService.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import UsageStats from '../models/UsageStats.js';
import UserActivity from '../models/UserActivity.js';
import PerformanceMetrics from '../models/PerformanceMetrics.js';
import User from '../models/User.js';
import { hasPermission } from '../middleware/permissions.js';

const router = express.Router();

// Validation schemas
const eventSchema = Joi.object({
  eventType: Joi.string().required(),
  userId: Joi.string().required(),
  sessionId: Joi.string().required(),
  roomId: Joi.string().optional(),
  messageId: Joi.string().optional(),
  metadata: Joi.object().default({}),
  responseTime: Joi.number().optional(),
  userAgent: Joi.string().optional(),
  ipAddress: Joi.string().optional(),
  device: Joi.object({
    type: Joi.string().valid('desktop', 'mobile', 'tablet'),
    os: Joi.string(),
    browser: Joi.string()
  }).optional()
});

const analyticsQuerySchema = Joi.object({
  period: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').default('daily'),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

// Track analytics event
router.post('/events', async (req, res) => {
  try {
    const { error, value } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const event = await analyticsService.trackEvent(value);
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Analytics event tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      code: 'EVENT_TRACKING_ERROR'
    });
  }
});

// Get usage analytics
router.get('/usage', async (req, res) => {
  try {
    const { error, value } = analyticsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { period, startDate, endDate, limit, offset } = value;
    
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const analytics = await analyticsService.getUsageAnalytics(period, startDate, endDate);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Usage analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage analytics',
      code: 'USAGE_ANALYTICS_ERROR'
    });
  }
});

// Get engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const { error, value } = analyticsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { period, startDate, endDate } = value;
    
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const engagement = await analyticsService.getEngagementMetrics(period, startDate, endDate);
    
    res.json({
      success: true,
      data: engagement
    });
  } catch (error) {
    console.error('Engagement metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get engagement metrics',
      code: 'ENGAGEMENT_METRICS_ERROR'
    });
  }
});

// Get storage usage
router.get('/storage', async (req, res) => {
  try {
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const storage = await analyticsService.getStorageUsage();
    
    res.json({
      success: true,
      data: storage
    });
  } catch (error) {
    console.error('Storage usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get storage usage',
      code: 'STORAGE_USAGE_ERROR'
    });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { period = 'hour', limit = 100 } = req.query;
    
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const performance = await analyticsService.getPerformanceMetrics(period, parseInt(limit));
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      code: 'PERFORMANCE_METRICS_ERROR'
    });
  }
});

// Get user activity reports
router.get('/users/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = analyticsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { period, startDate, endDate } = value;
    
    // Check permissions (users can see their own activity, admins can see all)
    if (userId !== req.user._id.toString() && !hasPermission(req.user, 'analytics:read_all')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const activity = await analyticsService.getUserActivityReports(userId, period, startDate, endDate);
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity',
      code: 'USER_ACTIVITY_ERROR'
    });
  }
});

// Get comprehensive analytics report
router.get('/report', async (req, res) => {
  try {
    const { error, value } = analyticsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { period, startDate, endDate } = value;
    
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const report = await analyticsService.generateAnalyticsReport(period, startDate, endDate);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Analytics report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      code: 'REPORT_GENERATION_ERROR'
    });
  }
});

// Get real-time statistics
router.get('/realtime', async (req, res) => {
  try {
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const realTimeStats = analyticsService.getRealTimeStats();
    
    res.json({
      success: true,
      data: realTimeStats
    });
  } catch (error) {
    console.error('Real-time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time stats',
      code: 'REALTIME_STATS_ERROR'
    });
  }
});

// Get top users by activity
router.get('/users/top', async (req, res) => {
  try {
    const { period = 'daily', limit = 10 } = req.query;
    
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const startDate = analyticsService.getStartDate(period);
    
    const topUsers = await UserActivity.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalMessages: { $sum: '$messagesSent' },
          totalFiles: { $sum: '$filesUploaded' },
          totalSessions: { $sum: { $size: '$sessions' } },
          totalTimeActive: { $sum: '$totalTimeActive' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar',
          totalMessages: 1,
          totalFiles: 1,
          totalSessions: 1,
          totalTimeActive: 1,
          engagementScore: {
            $add: [
              { $multiply: ['$totalMessages', 1] },
              { $multiply: ['$totalFiles', 5] },
              { $multiply: ['$totalSessions', 2] },
              { $divide: ['$totalTimeActive', 60] }
            ]
          }
        }
      },
      {
        $sort: { engagementScore: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    console.error('Top users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top users',
      code: 'TOP_USERS_ERROR'
    });
  }
});

// Get room analytics
router.get('/rooms/:roomId/analytics', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { error, value } = analyticsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { period, startDate, endDate } = value;
    
    // Check permissions
    if (!hasPermission(req.user, 'analytics:read')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const roomAnalytics = await AnalyticsEvent.aggregate([
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          timestamp: {
            $gte: startDate || analyticsService.getStartDate(period),
            $lte: endDate || new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          events: {
            $push: {
              type: '$_id.eventType',
              count: '$count'
            }
          },
          totalEvents: { $sum: '$count' }
        }
      },
      {
        $sort: { '_id': -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: roomAnalytics
    });
  } catch (error) {
    console.error('Room analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room analytics',
      code: 'ROOM_ANALYTICS_ERROR'
    });
  }
});

// Export analytics data
router.get('/export', async (req, res) => {
  try {
    const { period = 'daily', format = 'json' } = req.query;
    
    // Check permissions
    if (!hasPermission(req.user, 'analytics:export')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const report = await analyticsService.generateAnalyticsReport(period);
    
    if (format === 'csv') {
      // Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${Date.now()}.csv`);
      // CSV conversion logic here
      res.send('CSV data');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${Date.now()}.json`);
      res.json(report);
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      code: 'EXPORT_ANALYTICS_ERROR'
    });
  }
});

export default router;
