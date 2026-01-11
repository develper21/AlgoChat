import { useEffect, useRef, useState } from 'react';
import MessageStatusIndicator from './MessageStatusIndicator.jsx';
import FilePreview from './FilePreview.jsx';
import MessageReactions from './MessageReactions.jsx';
import MessageForward from './MessageForward.jsx';
import MessageThread from './MessageThread.jsx';
import { addReaction, removeReaction, forwardMessage } from '../api/messages.js';

const MessageBubble = ({ message, isOwn, currentUser, onEdit, onDelete, rooms }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(message.text || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleEsc = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleEditStart = () => {
    setMenuOpen(false);
    setIsEditing(true);
  };

  const handleDelete = async () => {
    try {
      await onDelete(message._id);
      setMenuOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Add reaction failed:', error);
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      await removeReaction(messageId, emoji);
    } catch (error) {
      console.error('Remove reaction failed:', error);
    }
  };

  const handleForward = async (messageId, roomId, text) => {
    try {
      await forwardMessage(messageId, roomId, text);
    } catch (error) {
      console.error('Forward failed:', error);
    }
  };

  const handleSave = () => {
    onEdit(message._id, text.trim());
    setIsEditing(false);
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : ''}`}>
      <div className="bubble-header">
        <div className="bubble-meta">
          <span>{message.sender?.name || 'Unknown'}</span>
          <small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
        {isOwn && !message.deleted && !isEditing && (
          <div className="bubble-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              className="bubble-menu-trigger"
              onClick={toggleMenu}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
            {menuOpen && (
              <div className={`message-menu ${isOwn ? 'align-right' : ''}`}>
                {isOwn && !message.deleted && (
                  <>
                    <button type="button" onClick={handleEditStart}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={handleDelete}>
                      Delete for me
                    </button>
                  </>
                )}
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForwardModal(true);
                    setMenuOpen(false);
                  }}
                >
                  Forward
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowThreadModal(true);
                    setMenuOpen(false);
                  }}
                >
                  Thread
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {!message.deleted ? (
        <div className="bubble-content">
          {message.fileUrl && (
            <div className="bubble-media">
              {message.fileType?.startsWith('image') ? (
                <div className="relative group cursor-pointer" onClick={() => setShowFilePreview(true)}>
                  <img 
                    src={message.fileUrl} 
                    alt="uploaded" 
                    className="max-w-xs rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div 
                  className="file-attachment p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => setShowFilePreview(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {message.fileType?.includes('pdf') ? '📄' :
                       message.fileType?.includes('word') ? '📝' :
                       message.fileType?.includes('excel') ? '📊' :
                       message.fileType?.startsWith('video') ? '🎥' :
                       message.fileType?.startsWith('audio') ? '🎵' : '📄'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Click to preview</p>
                      <p className="text-xs text-gray-500">
                        {message.fileType || 'Unknown file type'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}
          {isEditing ? (
            <div className="edit-area">
              <textarea value={text} onChange={(e) => setText(e.target.value)} />
              <div className="edit-actions">
                <button type="button" onClick={handleSave}>
                  Save
                </button>
                <button type="button" className="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p>
              {message.text}
              {message.edited && <span className="edited-tag">(edited)</span>}
            </p>
          )}
        </div>
      ) : (
        <p className="deleted">This message was deleted.</p>
      )}
      
      {isOwn && !message.deleted && (
        <MessageStatusIndicator message={message} isOwn={isOwn} />
      )}
      
      {/* Thread Reply Indicator */}
      {message.isThreaded && message.threadReplyCount > 0 && (
        <button
          onClick={() => setShowThreadModal(true)}
          className="thread-indicator flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{message.threadReplyCount} {message.threadReplyCount === 1 ? 'reply' : 'replies'}</span>
        </button>
      )}
      
      {/* Message Reactions */}
      {!message.deleted && message.reactions && message.reactions.length > 0 && (
        <MessageReactions
          message={message}
          currentUser={currentUser}
          onAddReaction={handleAddReaction}
          onRemoveReaction={handleRemoveReaction}
        />
      )}
      
      {showFilePreview && (
        <FilePreview
          fileUrl={message.fileUrl}
          fileType={message.fileType}
          fileName={`message-${message._id}`}
          onClose={() => setShowFilePreview(false)}
        />
      )}
      
      {showForwardModal && (
        <MessageForward
          message={message}
          currentUser={currentUser}
          rooms={rooms}
          onForward={handleForward}
          onClose={() => setShowForwardModal(false)}
        />
      )}
      
      {showThreadModal && (
        <MessageThread
          parentMessage={message}
          currentUser={currentUser}
          onClose={() => setShowThreadModal(false)}
          onSendMessage={() => {}} // Thread handles its own sending
          rooms={rooms}
        />
      )}
    </div>
  );
};

export default MessageBubble;
