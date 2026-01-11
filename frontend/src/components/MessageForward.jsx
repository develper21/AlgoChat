import React, { useState } from 'react';

const MessageForward = ({ message, currentUser, rooms, onForward, onClose }) => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [forwardText, setForwardText] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  const handleForward = async () => {
    if (!selectedRoom) {
      alert('Please select a room to forward to');
      return;
    }

    setIsForwarding(true);
    try {
      await onForward(message._id, selectedRoom, forwardText);
      onClose();
    } catch (error) {
      console.error('Forward failed:', error);
      alert('Failed to forward message');
    } finally {
      setIsForwarding(false);
    }
  };

  const getOriginalMessageText = () => {
    if (message.forwardedFrom) {
      return `Forwarded from ${message.forwardedFrom.senderName} in ${message.forwardedFrom.originalRoom}:\n"${message.forwardedFrom.originalText}"`;
    }
    return message.text;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Forward Message</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Original Message Preview */}
        <div className="p-4 border-b bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">Original message:</div>
          <div className="p-3 bg-white border rounded">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                {message.sender?.avatar ? (
                  <img
                    src={message.sender.avatar}
                    alt={message.sender.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {message.sender?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium text-sm">{message.sender?.name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            
            {message.text && (
              <p className="text-sm mb-2">{message.text}</p>
            )}
            
            {message.fileUrl && (
              <div className="text-sm text-blue-600">
                📎 {message.fileType || 'File'}
              </div>
            )}
            
            {message.forwardedFrom && (
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                {getOriginalMessageText()}
              </div>
            )}
          </div>
        </div>

        {/* Forward Form */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forward to:
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a room...</option>
              {rooms
                .filter(room => room._id !== message.room._id) // Don't show current room
                .map(room => (
                  <option key={room._id} value={room._id}>
                    {room.isGroup ? room.name : 
                      room.members.find(m => m._id !== currentUser._id)?.name || 'Direct Chat'
                    }
                  </option>
                ))
              }
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a message (optional):
            </label>
            <textarea
              value={forwardText}
              onChange={(e) => setForwardText(e.target.value)}
              placeholder="Add your comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleForward}
              disabled={!selectedRoom || isForwarding}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isForwarding ? 'Forwarding...' : 'Forward Message'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageForward;
