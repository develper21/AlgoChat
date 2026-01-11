import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Daily activity summary
  date: { type: Date, required: true },
  
  // Session information
  sessions: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // in minutes
    device: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String }
  }],
  
  // Activity counts
  messagesSent: { type: Number, default: 0 },
  messagesRead: { type: Number, default: 0 },
  filesUploaded: { type: Number, default: 0 },
  filesDownloaded: { type: Number, default: 0 },
  meetingsAttended: { type: Number, default: 0 },
  meetingsHosted: { type: Number, default: 0 },
  reactionsAdded: { type: Number, default: 0 },
  searchesPerformed: { type: Number, default: 0 },
  
  // Room activity
  roomsVisited: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  roomsCreated: { type: Number, default: 0 },
  roomsJoined: { type: Number, default: 0 },
  roomsLeft: { type: Number, default: 0 },
  
  // Time spent
  totalTimeActive: { type: Number, default: 0 }, // in minutes
  averageSessionDuration: { type: Number, default: 0 }, // in minutes
  
  // Engagement metrics
  engagementScore: { type: Number, default: 0 }, // 0-100
  activityLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  
  // Geographic and device info
  locations: [{
    country: { type: String },
    city: { type: String },
    visits: { type: Number, default: 1 }
  }],
  devices: [{
    type: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    os: { type: String },
    browser: { type: String },
    usageTime: { type: Number, default: 0 } // in minutes
  }]
}, {
  timestamps: true,
  // Indexes for performance
  index: [
    { userId: 1, date: -1 },
    { date: -1 },
    { userId: 1, engagementScore: -1 }
  ]
});

// Compound index for unique user-date combinations
userActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('UserActivity', userActivitySchema);
