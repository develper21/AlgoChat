import { useEffect, useRef, useState } from 'react';
import MessageStatusIndicator from './MessageStatusIndicator.jsx';
import FilePreview from './FilePreview.jsx';

const MessageBubble = ({ message, isOwn, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(message.text || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
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

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete(message._id);
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
              <div className={`bubble-menu ${isOwn ? 'align-right' : ''}`}>
                <button type="button" onClick={handleEditStart}>
                  Edit message
                </button>
                <button type="button" className="danger" onClick={handleDelete}>
                  Delete for me
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
      
      {showFilePreview && (
        <FilePreview
          fileUrl={message.fileUrl}
          fileType={message.fileType}
          fileName={`message-${message._id}`}
          onClose={() => setShowFilePreview(false)}
        />
      )}
    </div>
  );
};

export default MessageBubble;
