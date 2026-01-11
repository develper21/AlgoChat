import React, { useState, useEffect } from 'react';
import { getScheduledMessages, cancelScheduledMessage } from '../api/messages.js';

const ScheduledMessagesList = ({ currentUser, onClose }) => {
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadScheduledMessages();
  }, []);

  const loadScheduledMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getScheduledMessages();
      setScheduledMessages(data.messages || []);
    } catch (error) {
      setError(error.message || 'Failed to load scheduled messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (messageId) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) {
      return;
    }

    setCancelling(messageId);
    try {
      await cancelScheduledMessage(messageId);
      setScheduledMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      setError(error.message || 'Failed to cancel message');
    } finally {
      setCancelling(null);
    }
  };

  const formatScheduledTime = (scheduledFor) => {
    const date = new Date(scheduledFor);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `In ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else {
      return 'Overdue';
    }
  };

  const getRoomName = (room) => {
    if (room.isGroup) return room.name;
    const otherMember = room.members.find(m => m._id !== currentUser._id);
    return otherMember?.name || 'Direct Chat';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading scheduled messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Scheduled Messages</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg mb-4">
              {error}
            </div>
          )}

          {scheduledMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled messages</h3>
              <p className="text-gray-500">You don't have any messages scheduled to be sent.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledMessages.map((message) => (
                <div key={message._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{getRoomName(message.room)}</span>
                        <span className="text-xs text-gray-500">
                          {formatScheduledTime(message.scheduledFor)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {message.text || 'File message'}
                      </p>
                      <div className="text-xs text-gray-500">
                        Scheduled for: {new Date(message.scheduledFor).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancel(message._id)}
                      disabled={cancelling === message._id}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {cancelling === message._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                  
                  {message.fileUrl && (
                    <div className="text-xs text-blue-600 mt-2">
                      📎 {message.fileType || 'File'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduledMessagesList;
