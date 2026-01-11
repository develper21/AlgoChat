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
    scheduleStatus: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' }
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
