import cron from 'node-cron';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { emitRoomUpdate, formatMessage } from './socket.js';

class MessageScheduler {
  constructor() {
    this.jobs = new Map(); // Store cron jobs
    this.initScheduler();
  }

  initScheduler() {
    // Check for scheduled messages every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledMessages();
    });

    console.log('Message scheduler initialized');
  }

  // Schedule a message
  scheduleMessage(message) {
    const { _id, scheduledFor } = message;
    const scheduledDate = new Date(scheduledFor);
    const now = new Date();

    // If scheduled time is in the past, send immediately
    if (scheduledDate <= now) {
      this.sendMessageNow(message);
      return;
    }

    // Create cron job for the scheduled time
    const cronTime = this.getCronTime(scheduledDate);
    const jobId = `message_${_id}`;

    // Cancel existing job if any
    if (this.jobs.has(jobId)) {
      this.jobs.get(jobId).stop();
    }

    const job = cron.schedule(cronTime, async () => {
      await this.sendMessageNow(message);
      this.jobs.delete(jobId);
    }, {
      scheduled: false
    });

    this.jobs.set(jobId, job);
    job.start();

    console.log(`Message ${_id} scheduled for ${scheduledFor}`);
  }

  // Cancel a scheduled message
  cancelSchedule(messageId) {
    const jobId = `message_${messageId}`;
    
    if (this.jobs.has(jobId)) {
      this.jobs.get(jobId).stop();
      this.jobs.delete(jobId);
      
      // Update message status in database
      Message.findByIdAndUpdate(messageId, { 
        scheduleStatus: 'cancelled',
        isScheduled: false,
        scheduledFor: undefined
      }).catch(console.error);
      
      console.log(`Cancelled schedule for message ${messageId}`);
      return true;
    }
    
    return false;
  }

  // Process all pending scheduled messages
  async processScheduledMessages() {
    try {
      const now = new Date();
      
      // Find messages scheduled for now or past
      const messages = await Message.find({
        isScheduled: true,
        scheduleStatus: 'pending',
        scheduledFor: { $lte: now }
      }).populate('sender', 'name email avatar');

      for (const message of messages) {
        await this.sendMessageNow(message);
      }

      if (messages.length > 0) {
        console.log(`Processed ${messages.length} scheduled messages`);
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }

  // Send message immediately
  async sendMessageNow(message) {
    try {
      // Update message status
      await Message.findByIdAndUpdate(message._id, {
        isScheduled: false,
        scheduledFor: undefined,
        scheduleStatus: 'sent'
      });

      // Update room timestamp
      await Room.findByIdAndUpdate(message.room, {
        lastMessageAt: new Date()
      });

      // Emit to room
      const formattedMessage = formatMessage(message);
      emitRoomUpdate(message.room, 'newMessage', formattedMessage);

      // Clean up job
      const jobId = `message_${message._id}`;
      if (this.jobs.has(jobId)) {
        this.jobs.get(jobId).stop();
        this.jobs.delete(jobId);
      }

      console.log(`Scheduled message ${message._id} sent successfully`);
    } catch (error) {
      console.error(`Failed to send scheduled message ${message._id}:`, error);
      
      // Mark as failed
      await Message.findByIdAndUpdate(message._id, {
        scheduleStatus: 'failed'
      });
    }
  }

  // Convert date to cron expression
  getCronTime(date) {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${minute} ${hour} ${day} ${month} *`;
  }

  // Get scheduled messages for a user
  async getUserScheduledMessages(userId) {
    try {
      return await Message.find({
        sender: userId,
        isScheduled: true,
        scheduleStatus: 'pending'
      })
      .populate('room', 'name isGroup members')
      .sort({ scheduledFor: 1 });
    } catch (error) {
      console.error('Error getting user scheduled messages:', error);
      return [];
    }
  }

  // Reschedule all pending messages (for server restart)
  async reschedulePendingMessages() {
    try {
      const messages = await Message.find({
        isScheduled: true,
        scheduleStatus: 'pending',
        scheduledFor: { $gt: new Date() }
      });

      for (const message of messages) {
        this.scheduleMessage(message);
      }

      console.log(`Rescheduled ${messages.length} pending messages`);
    } catch (error) {
      console.error('Error rescheduling pending messages:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      activeJobs: this.jobs.size,
      scheduledMessages: Array.from(this.jobs.keys())
    };
  }
}

// Create singleton instance
const messageScheduler = new MessageScheduler();

export default messageScheduler;
