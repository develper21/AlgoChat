import mongoose from 'mongoose';

const usageStatsSchema = new mongoose.Schema({
  // Time period
  period: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'weekly', 'monthly']
  },
  date: { type: Date, required: true },
  
  // User metrics
  activeUsers: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  returningUsers: { type: Number, default: 0 },
  
  // Message metrics
  totalMessages: { type: Number, default: 0 },
  textMessages: { type: Number, default: 0 },
  fileMessages: { type: Number, default: 0 },
  averageMessagesPerUser: { type: Number, default: 0 },
  
  // Room metrics
  activeRooms: { type: Number, default: 0 },
  newRooms: { type: Number, default: 0 },
  averageUsersPerRoom: { type: Number, default: 0 },
  
  // File metrics
  filesUploaded: { type: Number, default: 0 },
  totalStorageUsed: { type: Number, default: 0 }, // in bytes
  averageFileSize: { type: Number, default: 0 },
  
  // Meeting metrics
  meetingsCreated: { type: Number, default: 0 },
  totalMeetingDuration: { type: Number, default: 0 }, // in minutes
  averageMeetingDuration: { type: Number, default: 0 },
  meetingParticipants: { type: Number, default: 0 },
  
  // Performance metrics
  averageResponseTime: { type: Number, default: 0 }, // in milliseconds
  serverUptime: { type: Number, default: 0 }, // in percentage
  errorRate: { type: Number, default: 0 }, // in percentage
  
  // Engagement metrics
  averageSessionDuration: { type: Number, default: 0 }, // in minutes
  bounceRate: { type: Number, default: 0 }, // in percentage
  retentionRate: { type: Number, default: 0 }, // in percentage
  
  // Feature usage
  featuresUsed: {
    chat: { type: Number, default: 0 },
    fileSharing: { type: Number, default: 0 },
    meetings: { type: Number, default: 0 },
    search: { type: Number, default: 0 },
    reactions: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  // Compound index for unique periods
  index: [
    { period: 1, date: -1 },
    { date: -1 }
  ]
});

// Ensure unique combination of period and date
usageStatsSchema.index({ period: 1, date: 1 }, { unique: true });

export default mongoose.model('UsageStats', usageStatsSchema);
