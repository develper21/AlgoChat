import React, { useState } from 'react';

const COMMON_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡', '👏', '🎉', '🔥', '💯'];

const MessageReactions = ({ message, currentUser, onAddReaction, onRemoveReaction }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userReactions, setUserReactions] = useState({});

  // Group reactions by emoji and count
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    const emoji = reaction.emoji;
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        count: 0,
        users: []
      };
    }
    acc[emoji].count++;
    acc[emoji].users.push(reaction.user);
    return acc;
  }, {}) || {};

  // Check which emojis current user has reacted with
  React.useEffect(() => {
    const userReactionsMap = {};
    message.reactions?.forEach(reaction => {
      if (reaction.user._id === currentUser._id) {
        userReactionsMap[reaction.emoji] = true;
      }
    });
    setUserReactions(userReactionsMap);
  }, [message.reactions, currentUser._id]);

  const handleEmojiClick = async (emoji) => {
    if (userReactions[emoji]) {
      // Remove reaction
      await onRemoveReaction(message._id, emoji);
    } else {
      // Add reaction
      await onAddReaction(message._id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleCustomEmoji = async (event) => {
    const emoji = event.target.value;
    if (emoji && emoji.trim()) {
      await onAddReaction(message._id, emoji.trim());
      setShowEmojiPicker(false);
    }
  };

  const getReactionTooltip = (reaction) => {
    const userNames = reaction.users.map(user => user.name).join(', ');
    return `${reaction.emoji} ${userNames}`;
  };

  return (
    <div className="message-reactions flex items-center gap-1 flex-wrap mt-2">
      {/* Render existing reactions */}
      {Object.values(groupedReactions).map(reaction => (
        <button
          key={reaction.emoji}
          className={`
            reaction-button 
            px-2 py-1 rounded-full text-sm border
            ${userReactions[reaction.emoji] 
              ? 'bg-blue-100 border-blue-300 text-blue-800' 
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }
            transition-colors
          `}
          onClick={() => handleEmojiClick(reaction.emoji)}
          title={getReactionTooltip(reaction)}
        >
          <span>{reaction.emoji}</span>
          <span className="ml-1 text-xs">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          className="add-reaction-button px-2 py-1 rounded-full text-sm border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Add reaction"
        >
          <span>+</span>
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50">
            <div className="grid grid-cols-5 gap-1 mb-2">
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  className="emoji-option w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center text-lg"
                  onClick={() => handleEmojiClick(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {/* Custom emoji input */}
            <div className="border-t pt-2">
              <input
                type="text"
                placeholder="Type emoji..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomEmoji(e);
                  }
                }}
                maxLength={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default MessageReactions;
