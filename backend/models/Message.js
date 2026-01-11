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
    }]
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
