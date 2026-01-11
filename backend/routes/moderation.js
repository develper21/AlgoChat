import express from 'express';
import Joi from 'joi';
import ModerationReport from '../models/Moderation.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Meeting from '../models/Meeting.js';
import Room from '../models/Room.js';
import { checkPermission } from '../middleware/permissions.js';
import { logUserAction, logSecurityEvent } from '../middleware/audit.js';

const router = express.Router();

// Validation schemas
const createReportSchema = Joi.object({
  contentType: Joi.string().required().valid('message', 'meeting', 'user', 'room'),
  contentId: Joi.string().required(),
  reason: Joi.string().required().valid(
    'spam',
    'harassment',
    'inappropriate_content',
    'violence',
    'hate_speech',
    'copyright_violation',
    'privacy_violation',
    'misinformation',
    'other'
  ),
  description: Joi.string().required().max(1000),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
});

const updateReportSchema = Joi.object({
  action: Joi.string().valid(
    'none',
    'warning',
    'content_removed',
    'user_suspended',
    'user_banned',
    'content_flagged',
    'content_edited',
    'escalated'
  ).required(),
  actionReason: Joi.string().max(500),
  actionDuration: Joi.number().min(1).max(365),
  reviewNotes: Joi.string().max(1000)
});

const appealSchema = Joi.object({
  reason: Joi.string().required().max(1000)
});

// Create content report
router.post('/report', async (req, res) => {
  try {
    const { error, value } = createReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { contentType, contentId, reason, description, severity } = value;
    const user = req.user;

    // Get content details for snapshot
    let content = null;
    let reportedUser = null;

    switch (contentType) {
      case 'message':
        content = await Message.findById(contentId).populate('sender', 'name email');
        reportedUser = content?.sender;
        break;
      case 'meeting':
        content = await Meeting.findById(contentId).populate('host', 'name email');
        reportedUser = content?.host;
        break;
      case 'user':
        content = await User.findById(contentId);
        reportedUser = content;
        break;
      case 'room':
        content = await Room.findById(contentId);
        break;
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      });
    }

    // Check if user is reporting their own content (except for user reports)
    if (contentType !== 'user' && reportedUser && reportedUser._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report your own content',
        code: 'CANNOT_REPORT_OWN_CONTENT'
      });
    }

    // Check if already reported
    const existingReport = await ModerationReport.findOne({
      contentType,
      contentId,
      reporter: user._id,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Content already reported',
        code: 'ALREADY_REPORTED'
      });
    }

    // Create report
    const report = new ModerationReport({
      contentType,
      contentId,
      reporter: user._id,
      reporterName: user.name,
      reporterEmail: user.email,
      reportedUser: reportedUser?._id,
      reportedUserName: reportedUser?.name,
      reportedUserEmail: reportedUser?.email,
      reason,
      description,
      severity,
      contentSnapshot: content.toJSON()
    });

    await report.save();
    await report.populate('reporter reportedUser', 'name email avatar');

    // Log security event
    await logSecurityEvent('content_reported', user, {
      resourceId: report._id,
      resourceName: `${contentType}:${contentId}`,
      metadata: {
        reason,
        severity,
        contentType,
        contentId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      code: 'REPORT_CREATE_ERROR'
    });
  }
});

// Get moderation reports (moderator+)
router.get('/reports', checkPermission('messages', 'moderate'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      severity,
      contentType,
      assignedTo,
      autoFlagged,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    if (contentType) {
      query.contentType = contentType;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (autoFlagged !== undefined) {
      query.autoFlagged = autoFlagged === 'true';
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { reporterName: { $regex: search, $options: 'i' } },
        { reportedUserName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const reports = await ModerationReport.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reporter reportedUser moderator assignedTo appealReviewedBy', 'name email avatar');

    const total = await ModerationReport.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: reports.length,
          overall: total
        }
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      code: 'REPORTS_FETCH_ERROR'
    });
  }
});

// Get pending reports
router.get('/reports/pending', checkPermission('messages', 'moderate'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const reports = await ModerationReport.getPending({ limit: parseInt(limit) });

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reports',
      code: 'PENDING_REPORTS_ERROR'
    });
  }
});

// Get overdue reports
router.get('/reports/overdue', checkPermission('messages', 'moderate'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const reports = await ModerationReport.getOverdue({ limit: parseInt(limit) });

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Get overdue reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue reports',
      code: 'OVERDUE_REPORTS_ERROR'
    });
  }
});

// Get moderation statistics
router.get('/statistics', checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [generalStats, severityStats, moderatorWorkload] = await Promise.all([
      ModerationReport.getStatistics({ startDate, endDate }),
      ModerationReport.getBySeverity(),
      ModerationReport.getModeratorWorkload({ startDate, endDate })
    ]);

    res.json({
      success: true,
      data: {
        general: generalStats[0] || {},
        bySeverity: severityStats,
        moderatorWorkload
      }
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

// Assign report to moderator
router.post('/reports/:reportId/assign', checkPermission('messages', 'moderate'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { moderatorId } = req.body;

    const report = await ModerationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Report cannot be assigned',
        code: 'REPORT_NOT_ASSIGNABLE'
      });
    }

    // Verify moderator exists and has permission
    const moderator = await User.findById(moderatorId);
    if (!moderator || !moderator.isModerator) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderator',
        code: 'INVALID_MODERATOR'
      });
    }

    await report.assignTo(moderatorId);
    await report.populate('assignedTo', 'name email');

    await logUserAction(req.user, 'assign', 'moderation_report', {
      resourceId: report._id,
      resourceName: `Report #${report._id}`,
      metadata: { assignedTo: moderatorId }
    });

    res.json({
      success: true,
      message: 'Report assigned successfully',
      data: report
    });

  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign report',
      code: 'REPORT_ASSIGN_ERROR'
    });
  }
});

// Update report (moderate)
router.put('/reports/:reportId', checkPermission('messages', 'moderate'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { error, value } = updateReportSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const report = await ModerationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    const { action, actionReason, actionDuration, reviewNotes } = value;

    // Execute moderation action
    await executeModerationAction(report, action, actionReason, actionDuration);

    // Update report
    report.moderator = req.user._id;
    report.moderatorName = req.user.name;
    report.moderatorEmail = req.user.email;
    report.action = action;
    report.actionReason = actionReason;
    report.actionDuration = actionDuration;
    report.reviewNotes = reviewNotes;
    report.reviewedAt = new Date();

    if (action === 'escalated') {
      await report.escalate(reviewNotes);
    } else {
      report.status = 'resolved';
      report.resolvedAt = new Date();
    }

    await report.save();
    await report.populate('reporter reportedUser moderator', 'name email avatar');

    await logUserAction(req.user, 'moderate', report.contentType, {
      resourceId: report.contentId,
      resourceName: `${report.contentType}:${report.contentId}`,
      metadata: {
        action,
        reason: actionReason,
        reportId: report._id
      }
    });

    res.json({
      success: true,
      message: 'Report moderated successfully',
      data: report
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate report',
      code: 'REPORT_MODERATE_ERROR'
    });
  }
});

// Dismiss report
router.post('/reports/:reportId/dismiss', checkPermission('messages', 'moderate'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reviewNotes } = req.body;

    const report = await ModerationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    await report.dismiss(req.user._id, reviewNotes);
    await report.populate('reporter reportedUser moderator', 'name email avatar');

    await logUserAction(req.user, 'dismiss', 'moderation_report', {
      resourceId: report._id,
      resourceName: `Report #${report._id}`,
      metadata: { reviewNotes }
    });

    res.json({
      success: true,
      message: 'Report dismissed successfully',
      data: report
    });

  } catch (error) {
    console.error('Dismiss report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss report',
      code: 'REPORT_DISMISS_ERROR'
    });
  }
});

// Submit appeal
router.post('/reports/:reportId/appeal', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { error, value } = appealSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const report = await ModerationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    if (report.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot appeal unresolved report',
        code: 'CANNOT_APPEAL_UNRESOLVED'
      });
    }

    if (report.reportedUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only reported user can appeal',
        code: 'APPEAL_NOT_ALLOWED'
      });
    }

    if (report.appealed) {
      return res.status(400).json({
        success: false,
        message: 'Appeal already submitted',
        code: 'APPEAL_ALREADY_SUBMITTED'
      });
    }

    await report.submitAppeal(value.reason);
    await report.populate('reporter reportedUser', 'name email avatar');

    await logUserAction(req.user, 'appeal', 'moderation_report', {
      resourceId: report._id,
      resourceName: `Report #${report._id}`,
      metadata: { appealReason: value.reason }
    });

    res.json({
      success: true,
      message: 'Appeal submitted successfully',
      data: report
    });

  } catch (error) {
    console.error('Submit appeal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit appeal',
      code: 'APPEAL_SUBMIT_ERROR'
    });
  }
});

// Review appeal (admin+)
router.post('/reports/:reportId/appeal/review', checkPermission('users', 'manage'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { approved, notes } = req.body;

    const report = await ModerationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    if (!report.appealed) {
      return res.status(400).json({
        success: false,
        message: 'No appeal to review',
        code: 'NO_APPEAL_TO_REVIEW'
      });
    }

    await report.reviewAppeal(req.user._id, approved, notes);
    await report.populate('reporter reportedUser moderator appealReviewedBy', 'name email avatar');

    await logUserAction(req.user, approved ? 'approve_appeal' : 'deny_appeal', 'moderation_report', {
      resourceId: report._id,
      resourceName: `Report #${report._id}`,
      metadata: { approved, notes }
    });

    res.json({
      success: true,
      message: `Appeal ${approved ? 'approved' : 'denied'} successfully`,
      data: report
    });

  } catch (error) {
    console.error('Review appeal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review appeal',
      code: 'APPEAL_REVIEW_ERROR'
    });
  }
});

// Auto-flag content (system endpoint)
router.post('/auto-flag', async (req, res) => {
  try {
    const { contentType, contentId, analysis } = req.body;

    // Verify this is a system request (would use API key in production)
    const systemKey = req.headers['x-system-key'];
    if (systemKey !== process.env.SYSTEM_API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const report = await ModerationReport.autoFlag(contentType, contentId, analysis);

    if (!report) {
      return res.json({
        success: true,
        message: 'Content analyzed - no action needed'
      });
    }

    res.json({
      success: true,
      message: 'Content auto-flagged successfully',
      data: report
    });

  } catch (error) {
    console.error('Auto-flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-flag content',
      code: 'AUTO_FLAG_ERROR'
    });
  }
});

// Helper function to execute moderation actions
async function executeModerationAction(report, action, reason, duration) {
  const { contentType, contentId, reportedUser } = report;

  switch (action) {
    case 'content_removed':
      await removeContent(contentType, contentId);
      break;
    
    case 'user_suspended':
      await suspendUser(reportedUser, duration, reason);
      break;
    
    case 'user_banned':
      await banUser(reportedUser, reason);
      break;
    
    case 'content_flagged':
      await flagContent(contentType, contentId);
      break;
    
    case 'content_edited':
      await editContent(contentType, contentId);
      break;
    
    case 'warning':
      await sendWarning(reportedUser, reason);
      break;
  }
}

// Helper functions for content actions
async function removeContent(contentType, contentId) {
  switch (contentType) {
    case 'message':
      await Message.findByIdAndUpdate(contentId, { deleted: true, text: '[Content removed by moderator]' });
      break;
    case 'meeting':
      await Meeting.findByIdAndUpdate(contentId, { isActive: false });
      break;
    case 'room':
      await Room.findByIdAndUpdate(contentId, { isActive: false });
      break;
  }
}

async function suspendUser(userId, duration, reason) {
  const suspensionDate = new Date();
  suspensionDate.setDate(suspensionDate.getDate() + (duration || 7));
  
  await User.findByIdAndUpdate(userId, {
    isSuspended: true,
    suspendedAt: new Date(),
    suspensionReason: reason,
    lockUntil: suspensionDate
  });
}

async function banUser(userId, reason) {
  await User.findByIdAndUpdate(userId, {
    isActive: false,
    isSuspended: true,
    suspendedAt: new Date(),
    suspensionReason: reason
  });
}

async function flagContent(contentType, contentId) {
  // Add flag to content
  switch (contentType) {
    case 'message':
      await Message.findByIdAndUpdate(contentId, { flagged: true });
      break;
    case 'meeting':
      await Meeting.findByIdAndUpdate(contentId, { flagged: true });
      break;
  }
}

async function editContent(contentType, contentId) {
  // Mark content as edited by moderator
  switch (contentType) {
    case 'message':
      await Message.findByIdAndUpdate(contentId, { moderated: true });
      break;
  }
}

async function sendWarning(userId, reason) {
  // Send warning notification to user
  const user = await User.findById(userId);
  if (user && user.pushSubscriptions?.length > 0) {
    // Send push notification
    console.log(`Warning sent to user ${userId}: ${reason}`);
  }
}

export default router;
