import React from 'react';

const MessageStatusIndicator = ({ message, isOwn, currentUser }) => {
  if (!isOwn) return null;

  const getStatusInfo = () => {
    // Check if message has read receipts
    if (message.readBy && message.readBy.length > 0) {
      return {
        status: 'read',
        icon: '✓✓',
        color: 'text-blue-500',
        title: `Read by ${message.readBy.length} people`
      };
    }
    
    // Check if message has delivery receipts
    if (message.deliveredTo && message.deliveredTo.length > 0) {
      return {
        status: 'delivered',
        icon: '✓✓',
        color: 'text-gray-400',
        title: `Delivered to ${message.deliveredTo.length} people`
      };
    }
    
    // Message sent but not yet delivered
    return {
      status: 'sent',
      icon: '✓',
      color: 'text-gray-400',
      title: 'Sent'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`message-status ${statusInfo.color} text-xs flex items-center gap-1`} title={statusInfo.title}>
      <span>{statusInfo.icon}</span>
      {statusInfo.status === 'read' && (
        <span className="text-xs">Read</span>
      )}
    </div>
  );
};

export default MessageStatusIndicator;
