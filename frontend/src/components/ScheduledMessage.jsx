import React, { useState } from 'react';
import { scheduleMessage } from '../api/messages.js';

const ScheduledMessage = ({ currentUser, rooms, onClose, onSuccess }) => {
  const [text, setText] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && !selectedRoom) {
      setError('Please enter a message and select a room');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setError('Please select date and time for scheduling');
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledFor <= now) {
      setError('Scheduled time must be in the future');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await scheduleMessage({
        roomId: selectedRoom,
        text: text.trim(),
        scheduledFor: scheduledFor.toISOString()
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to schedule message');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Minimum 1 minute from now
    return now.toISOString().slice(0, 16);
  };

  const formatScheduledTime = (date, time) => {
    if (!date || !time) return '';
    const scheduledFor = new Date(`${date}T${time}`);
    return scheduledFor.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Schedule Message</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Send to:</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a room...</option>
              {rooms.map(room => (
                <option key={room._id} value={room._id}>
                  {room.isGroup ? room.name : 
                    room.members.find(m => m._id !== currentUser._id)?.name || 'Direct Chat'
                  }
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Message:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Date:</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Time:</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Scheduled Time Preview */}
          {scheduledDate && scheduledTime && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Message will be sent:</strong><br />
                {formatScheduledTime(scheduledDate, scheduledTime)}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500">
            <p>• Messages are scheduled based on server time</p>
            <p>• You can cancel scheduled messages anytime before they're sent</p>
            <p>• Scheduled messages appear in your scheduled messages list</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Message'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduledMessage;
