import mongoose from 'mongoose';

const moderationReportSchema = new mongoose.Schema({
  // Reported content
  contentType: {
    type: String,
    required: true,
    enum: ['message', 'meeting', 'user', 'room']
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  
  // Reporter information
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reporterName: {
    type: String,
    required: true
  },
  reporterEmail: {
    type: String,
    required: true
  },
  
  // Reported user (if applicable)
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedUserName: String,
  reportedUserEmail: String,
  
  // Report details
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'inappropriate_content',
      'violence',
      'hate_speech',
      'copyright_violation',
      'privacy_violation',
      'misinformation',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Content snapshot (for audit trail)
  contentSnapshot: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Moderation details
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
    default: 'pending'
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatorName: String,
  moderatorEmail: String,
  
  // Actions taken
  action: {
    type: String,
    enum: [
      'none',
      'warning',
      'content_removed',
      'user_suspended',
      'user_banned',
      'content_flagged',
      'content_edited',
      'escalated'
    ],
    default: 'none'
  },
  actionReason: String,
  actionDuration: Number, // For suspensions in days
  
  // Review details
  reviewedAt: Date,
  reviewNotes: String,
  escalationLevel: {
    type: Number,
    default: 0
  },
  
  // Appeals
  appealed: {
    type: Boolean,
    default: false
  },
  appealReason: String,
  appealStatus: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  appealReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appealReviewedAt: Date,
  appealNotes: String,
  
  // Automated moderation
  autoFlagged: {
    type: Boolean,
    default: false
  },
  confidenceScore: Number, // 0-1 for AI confidence
  flaggedKeywords: [String],
  flaggedPatterns: [String],
  
  // Metadata
  tags: [String],
  priority: {
    type: Number,
    default: 0
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time to resolution
moderationReportSchema.virtual('timeToResolution').get(function() {
  if (this.status === 'resolved' && this.resolvedAt) {
    return this.resolvedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

// Virtual for is overdue
moderationReportSchema.virtual('isOverdue').get(function() {
  if (this.status === 'resolved' || this.status === 'dismissed') {
    return false;
  }
  
  const now = new Date();
  const hoursSinceCreation = (now - this.createdAt) / (1000 * 60 * 60);
  
  // Critical: 1 hour, High: 4 hours, Medium: 24 hours, Low: 72 hours
  const overdueThresholds = {
    critical: 1,
    high: 4,
    medium: 24,
    low: 72
  };
  
  return hoursSinceCreation > overdueThresholds[this.severity];
});

// Method to assign to moderator
moderationReportSchema.methods.assignTo = function(moderatorId) {
  this.assignedTo = moderatorId;
  this.status = 'under_review';
  return this.save();
};

// Method to resolve
moderationReportSchema.methods.resolve = function(moderatorId, action, notes) {
  this.status = 'resolved';
  this.moderator = moderatorId;
  this.action = action;
  this.reviewNotes = notes;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to dismiss
moderationReportSchema.methods.dismiss = function(moderatorId, notes) {
  this.status = 'dismissed';
  this.moderator = moderatorId;
  this.action = 'none';
  this.reviewNotes = notes;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to escalate
moderationReportSchema.methods.escalate = function(reason) {
  this.status = 'escalated';
  this.escalationLevel += 1;
  this.priority += 10;
  if (reason) this.reviewNotes = reason;
  return this.save();
};

// Method to appeal
moderationReportSchema.methods.submitAppeal = function(reason) {
  this.appealed = true;
  this.appealReason = reason;
  this.appealStatus = 'pending';
  return this.save();
};

// Method to review appeal
moderationReportSchema.methods.reviewAppeal = function(reviewerId, approved, notes) {
  this.appealReviewedBy = reviewerId;
  this.appealReviewedAt = new Date();
  this.appealStatus = approved ? 'approved' : 'denied';
  this.appealNotes = notes;
  
  if (approved) {
    // Reverse the original action
    this.status = 'pending';
    this.action = 'none';
    this.moderator = null;
  }
  
  return this.save();
};

// Static method to get reports by status
moderationReportSchema.statics.getByStatus = function(status, options = {}) {
  const { limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find({ status })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('reporter reportedUser moderator assignedTo appealReviewedBy', 'name email avatar');
};

// Static method to get pending reports
moderationReportSchema.statics.getPending = function(options = {}) {
  return this.getByStatus('pending', options);
};

// Static method to get overdue reports
moderationReportSchema.statics.getOverdue = function(options = {}) {
  const { limit = 50, page = 1 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({
    status: { $in: ['pending', 'under_review'] },
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
  })
  .sort({ severity: -1, createdAt: 1 })
  .skip(skip)
  .limit(limit)
  .populate('reporter reportedUser moderator assignedTo', 'name email avatar');
};

// Static method to get statistics
moderationReportSchema.statics.getStatistics = function(options = {}) {
  const { startDate, endDate } = options;
  
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        underReview: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        dismissed: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } },
        autoFlagged: { $sum: { $cond: ['$autoFlagged', 1, 0] } },
        appealed: { $sum: { $cond: ['$appealed', 1, 0] } },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'resolved'] },
              { $subtract: ['$resolvedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
};

// Static method to get reports by severity
moderationReportSchema.statics.getBySeverity = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get moderator workload
moderationReportSchema.statics.getModeratorWorkload = function(options = {}) {
  const { startDate, endDate } = options;
  
  const matchStage = {
    status: { $in: ['pending', 'under_review'] }
  };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$assignedTo',
        count: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        },
        high: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        },
        medium: {
          $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
        },
        low: {
          $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'moderator'
      }
    },
    { $unwind: '$moderator' },
    {
      $project: {
        moderatorName: '$moderator.name',
        moderatorEmail: '$moderator.email',
        count: 1,
        critical: 1,
        high: 1,
        medium: 1,
        low: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to auto-flag content
moderationReportSchema.statics.autoFlag = async function(contentType, contentId, analysis) {
  const {
    flagged = false,
    confidence = 0,
    keywords = [],
    patterns = [],
    severity = 'medium',
    reason = 'Automated detection'
  } = analysis;
  
  if (!flagged || confidence < 0.7) {
    return null;
  }
  
  try {
    const report = new this({
      contentType,
      contentId,
      reporter: null, // System report
      reporterName: 'System',
      reporterEmail: 'system@algochat.com',
      reason: 'inappropriate_content',
      description: reason,
      severity,
      autoFlagged: true,
      confidenceScore: confidence,
      flaggedKeywords: keywords,
      flaggedPatterns: patterns,
      status: 'pending',
      priority: confidence * 10
    });
    
    await report.save();
    return report;
  } catch (error) {
    console.error('Auto-flag error:', error);
    return null;
  }
};

// Indexes
moderationReportSchema.index({ contentType: 1, contentId: 1 });
moderationReportSchema.index({ reporter: 1, createdAt: -1 });
moderationReportSchema.index({ reportedUser: 1, createdAt: -1 });
moderationReportSchema.index({ status: 1, createdAt: -1 });
moderationReportSchema.index({ severity: 1, status: 1, createdAt: -1 });
moderationReportSchema.index({ assignedTo: 1, status: 1 });
moderationReportSchema.index({ autoFlagged: 1, status: 1 });
moderationReportSchema.index({ createdAt: -1 });
moderationReportSchema.index({ priority: -1, createdAt: -1 });

export default mongoose.model('ModerationReport', moderationReportSchema);
