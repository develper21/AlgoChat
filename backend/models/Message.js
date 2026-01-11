import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true },
    fileUrl: { type: String },
    fileType: { type: String },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    readBy: [{ 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }],
    deliveredTo: [{ 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      deliveredAt: { type: Date, default: Date.now }
    }],
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    forwardedFrom: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      senderName: { type: String },
      originalRoom: { type: String },
      originalText: { type: String }
    },
    // Message Threading
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    threadReplies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    isThreaded: { type: Boolean, default: false },
    threadReplyCount: { type: Number, default: 0 },
    // Scheduled Messages
    scheduledFor: { type: Date },
    isScheduled: { type: Boolean, default: false },
    scheduleStatus: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' },
    // AI Analysis
    aiAnalysis: {
      spamScore: { type: Number, min: 0, max: 1 },
      isSpam: { type: Boolean, default: false },
      moderation: {
        isAppropriate: { type: Boolean, default: true },
        categories: { type: mongoose.Schema.Types.Mixed },
        confidence: { type: Number, min: 0, max: 1 },
        filteredText: { type: String }
      },
      shouldBlock: { type: Boolean, default: false },
      language: { type: String },
      sentiment: { type: Number }
    }
  },
  { timestamps: true }
);

// Performance indexes
messageSchema.index({ room: 1, createdAt: -1 }); // For room message queries with pagination
messageSchema.index({ sender: 1, createdAt: -1 }); // For user message history
messageSchema.index({ room: 1, deleted: 1, createdAt: -1 }); // For active room messages
messageSchema.index({ threadId: 1, createdAt: 1 }); // For thread messages
messageSchema.index({ scheduledFor: 1, scheduleStatus: 1 }); // For scheduled messages
messageSchema.index({ 'aiAnalysis.isSpam': 1 }); // For spam filtering
messageSchema.index({ createdAt: -1 }); // For time-based queries

// Compound indexes for common queries
messageSchema.index({ room: 1, deleted: 1, 'aiAnalysis.isSpam': 1, createdAt: -1 });
messageSchema.index({ sender: 1, room: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
