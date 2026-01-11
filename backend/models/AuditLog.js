import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // User information
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  
  // Action details
  action: { 
    type: String, 
    required: true 
  }, // 'create', 'read', 'update', 'delete', 'login', 'logout', etc.
  resource: { 
    type: String, 
    required: true 
  }, // 'user', 'meeting', 'message', 'role', etc.
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId 
  }, // ID of the resource if applicable
  resourceName: { 
    type: String 
  }, // Name/identifier of the resource
  
  // Request details
  method: { 
    type: String 
  }, // HTTP method (GET, POST, PUT, DELETE)
  endpoint: { 
    type: String 
  }, // API endpoint
  userAgent: { 
    type: String 
  },
  ip: { 
    type: String, 
    required: true 
  },
  
  // Change details
  changes: { 
    type: mongoose.Schema.Types.Mixed 
  }, // Before/after values for updates
  oldValue: { 
    type: mongoose.Schema.Types.Mixed 
  },
  newValue: { 
    type: mongoose.Schema.Types.Mixed 
  },
  
  // Metadata
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  }, // Additional context
  tags: [{ 
    type: String 
  }], // For categorization
  
  // Status and results
  status: { 
    type: String, 
    enum: ['success', 'failure', 'warning'], 
    default: 'success' 
  },
  errorMessage: { 
    type: String 
  },
  errorCode: { 
    type: String 
  },
  
  // Session information
  sessionId: { 
    type: String 
  },
  
  // Timestamps
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  duration: { 
    type: Number 
  } // Request duration in milliseconds
}, { 
  timestamps: true 
});

// Indexes for performance
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ tags: 1, timestamp: -1 });

// Compound indexes
auditLogSchema.index({ user: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, action: 1, timestamp: -1 });

// Static method to create audit log
auditLogSchema.statics.log = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking main functionality
  }
};

// Static method to log user action
auditLogSchema.statics.logUserAction = async function(user, action, resource, details = {}) {
  return this.log({
    user: user._id,
    userEmail: user.email,
    userName: user.name,
    action,
    resource,
    resourceId: details.resourceId,
    resourceName: details.resourceName,
    method: details.method,
    endpoint: details.endpoint,
    userAgent: details.userAgent,
    ip: details.ip,
    changes: details.changes,
    oldValue: details.oldValue,
    newValue: details.newValue,
    metadata: details.metadata,
    tags: details.tags,
    status: details.status || 'success',
    errorMessage: details.errorMessage,
    errorCode: details.errorCode,
    sessionId: details.sessionId,
    duration: details.duration
  });
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const {
    limit = 50,
    page = 1,
    action,
    resource,
    status,
    startDate,
    endDate
  } = options;
  
  const query = { user: userId };
  
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email avatar');
};

// Static method to get resource activity
auditLogSchema.statics.getResourceActivity = function(resource, resourceId, options = {}) {
  const {
    limit = 50,
    page = 1,
    action,
    status,
    startDate,
    endDate
  } = options;
  
  const query = { resource };
  if (resourceId) query.resourceId = resourceId;
  
  if (action) query.action = action;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email avatar');
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = function(options = {}) {
  const {
    limit = 100,
    page = 1,
    action,
    status,
    startDate,
    endDate
  } = options;
  
  const securityActions = [
    'login',
    'logout', 
    'login_failed',
    'password_change',
    'password_reset',
    '2fa_enabled',
    '2fa_disabled',
    'account_locked',
    'account_unlocked',
    'suspension',
    'role_change',
    'permission_change'
  ];
  
  const query = {
    action: { $in: securityActions }
  };
  
  if (action) query.action = action;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email avatar');
};

// Static method to get analytics
auditLogSchema.statics.getAnalytics = function(options = {}) {
  const {
    startDate,
    endDate,
    groupBy = 'day'
  } = options;
  
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  const groupFormat = groupBy === 'hour' ? '%Y-%m-%d-%H' : 
                    groupBy === 'day' ? '%Y-%m-%d' : 
                    groupBy === 'week' ? '%Y-%U' : 
                    groupBy === 'month' ? '%Y-%m' : '%Y';
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupFormat,
            date: '$timestamp'
          }
        },
        totalActions: { $sum: 1 },
        successActions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failureActions: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
        },
        uniqueUsers: { $addToSet: '$user' },
        actions: { $addToSet: '$action' },
        resources: { $addToSet: '$resource' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
        actionCount: { $size: '$actions' },
        resourceCount: { $size: '$resources' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to cleanup old logs
auditLogSchema.statics.cleanup = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result;
};

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for duration in seconds
auditLogSchema.virtual('durationSeconds').get(function() {
  return this.duration ? (this.duration / 1000).toFixed(2) : null;
});

export default mongoose.model('AuditLog', auditLogSchema);
