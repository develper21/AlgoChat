import React from 'react';

const OnlineStatusIndicator = ({ user, size = 'small' }) => {
  const isOnline = user?.isOnline;
  const lastSeen = user?.lastSeen;

  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const formatLastSeen = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(date);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]} 
            rounded-full 
            ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
            ${isOnline ? 'animate-pulse' : ''}
          `}
        />
        {isOnline && (
          <div 
            className={`
              absolute inset-0 
              ${sizeClasses[size]} 
              rounded-full 
              bg-green-500 
              animate-ping
            `}
          />
        )}
      </div>
      {!isOnline && (
        <span className="text-xs text-gray-500">
          {formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusIndicator;
