import mongoose from 'mongoose';

const meetingChatSchema = new mongoose.Schema({
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true },
  messageType: { 
    type: String, 
    enum: ['text', 'system', 'file', 'reaction', 'poll'], 
    default: 'text' 
  },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  fileType: { type: String },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'MeetingChat' },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String },
    addedAt: { type: Date, default: Date.now }
  }],
  isPrivate: { type: Boolean, default: false },
  privateTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  metadata: {
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

meetingChatSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

meetingChatSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => 
    r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (!existingReaction) {
    this.reactions.push({
      user: userId,
      emoji,
      addedAt: new Date()
    });
  }
  
  return this;
};

meetingChatSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(r => 
    !(r.user.toString() === userId.toString() && r.emoji === emoji)
  );
  
  return this;
};

meetingChatSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(r => 
    r.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this;
};

meetingChatSchema.methods.editMessage = function(newMessage) {
  this.message = newMessage;
  this.edited = true;
  this.editedAt = new Date();
  
  return this;
};

meetingChatSchema.methods.deleteMessage = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.message = 'This message has been deleted';
  
  return this;
};

meetingChatSchema.index({ meeting: 1, createdAt: 1 });
meetingChatSchema.index({ sender: 1 });
meetingChatSchema.index({ replyTo: 1 });
meetingChatSchema.index({ isDeleted: 1 });

export default mongoose.model('MeetingChat', meetingChatSchema);
