import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    isGroup: { type: Boolean, default: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Performance indexes
roomSchema.index({ members: 1 }); // For finding user rooms
roomSchema.index({ lastMessageAt: -1 }); // For sorting by recent activity
roomSchema.index({ members: 1, lastMessageAt: -1 }); // For user's recent rooms
roomSchema.index({ isGroup: 1 }); // For filtering by room type

export default mongoose.model('Room', roomSchema);
