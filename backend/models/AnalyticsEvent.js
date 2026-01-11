import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout',
      'message_sent',
      'message_read',
      'message_edited',
      'message_deleted',
      'file_uploaded',
      'file_downloaded',
      'room_created',
      'room_joined',
      'room_left',
      'meeting_started',
      'meeting_ended',
      'reaction_added',
      'search_query',
      'page_view',
      'feature_used'
    ]
  },
  
  // User information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  
  // Context information
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Timestamp and performance
  timestamp: { type: Date, default: Date.now },
  responseTime: { type: Number }, // in milliseconds
  userAgent: { type: String },
  ipAddress: { type: String },
  
  // Geographic data
  country: { type: String },
  city: { type: String },
  
  // Device information
  device: {
    type: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    os: { type: String },
    browser: { type: String }
  }
}, { 
  timestamps: true,
  // Indexing for performance
  index: [
    { eventType: 1, timestamp: -1 },
    { userId: 1, timestamp: -1 },
    { roomId: 1, timestamp: -1 },
    { timestamp: -1 }
  ]
});

// Compound indexes for common queries
analyticsEventSchema.index({ eventType: 1, userId: 1, timestamp: -1 });
analyticsEventSchema.index({ roomId: 1, eventType: 1, timestamp: -1 });

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
