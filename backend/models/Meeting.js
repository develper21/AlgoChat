import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  isHost: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isVideoOff: { type: Boolean, default: false },
  isScreenSharing: { type: Boolean, default: false },
  handRaised: { type: Boolean, default: false },
  connectionId: { type: String },
  peerId: { type: String }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  meetingId: { type: String, unique: true, default: () => uuidv4().replace(/-/g, '').substring(0, 12) },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [participantSchema],
  scheduledFor: { type: Date },
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number }, // in minutes
  maxParticipants: { type: Number, default: 100 },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    type: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    interval: { type: Number, default: 1 },
    endDate: { type: Date }
  },
  meetingType: { 
    type: String, 
    enum: ['instant', 'scheduled', 'recurring'], 
    default: 'instant' 
  },
  accessType: { 
    type: String, 
    enum: ['public', 'private', 'restricted'], 
    default: 'private' 
  },
  password: { type: String },
  waitingRoom: { type: Boolean, default: false },
  allowScreenShare: { type: Boolean, default: true },
  allowRecording: { type: Boolean, default: false },
  allowChat: { type: Boolean, default: true },
  muteParticipantsOnEntry: { type: Boolean, default: false },
  videoOffOnEntry: { type: Boolean, default: false },
  recording: {
    isRecording: { type: Boolean, default: false },
    startedAt: { type: Date },
    recordingUrl: { type: String },
    duration: { type: Number }
  },
  settings: {
    enableBreakoutRooms: { type: Boolean, default: false },
    enablePolls: { type: Boolean, default: false },
    enableWhiteboard: { type: Boolean, default: false },
    enableVirtualBackground: { type: Boolean, default: false },
    enableNoiseCancellation: { type: Boolean, default: false },
    enableLiveCaptions: { type: Boolean, default: false }
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'started', 'ended', 'cancelled'], 
    default: 'scheduled' 
  },
  isActive: { type: Boolean, default: false },
  thumbnail: { type: String },
  category: { type: String, enum: ['general', 'education', 'business', 'personal', 'health'], default: 'general' },
  tags: [{ type: String, trim: true }],
  metadata: {
    browser: { type: String },
    device: { type: String },
    location: { type: String },
    quality: { type: String, enum: ['low', 'medium', 'high', 'auto'], default: 'auto' }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

meetingSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt);
});

meetingSchema.virtual('participantCount').get(function() {
  return this.activeParticipants.length;
});

meetingSchema.virtual('durationInMinutes').get(function() {
  if (this.startedAt && this.endedAt) {
    return Math.round((this.endedAt - this.startedAt) / (1000 * 60));
  }
  if (this.startedAt) {
    return Math.round((Date.now() - this.startedAt) / (1000 * 60));
  }
  return 0;
});

meetingSchema.methods.addParticipant = function(userId, isHost = false) {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
  
  if (existingParticipant) {
    return existingParticipant;
  }
  
  const participant = {
    user: userId,
    isHost,
    joinedAt: new Date()
  };
  
  this.participants.push(participant);
  return participant;
};

meetingSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
  
  if (participant) {
    participant.leftAt = new Date();
  }
  
  return participant;
};

meetingSchema.methods.updateParticipantStatus = function(userId, updates) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
  
  if (participant) {
    Object.assign(participant, updates);
  }
  
  return participant;
};

meetingSchema.methods.startMeeting = function() {
  this.status = 'started';
  this.startedAt = new Date();
  this.isActive = true;
};

meetingSchema.methods.endMeeting = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.isActive = false;
  
  // Mark all active participants as left
  this.participants.forEach(p => {
    if (!p.leftAt) {
      p.leftAt = this.endedAt;
    }
  });
};

meetingSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
};

meetingSchema.methods.isHost = function(userId) {
  return this.host.toString() === userId.toString();
};

meetingSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
};

meetingSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'started' && !this.startedAt) {
    this.startedAt = new Date();
    this.isActive = true;
  }
  
  if (this.isModified('status') && this.status === 'ended' && !this.endedAt) {
    this.endedAt = new Date();
    this.isActive = false;
    this.endMeeting();
  }
  
  next();
});

meetingSchema.index({ meetingId: 1 });
meetingSchema.index({ host: 1 });
meetingSchema.index({ 'participants.user': 1 });
meetingSchema.index({ scheduledFor: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ isActive: 1 });

export default mongoose.model('Meeting', meetingSchema);
