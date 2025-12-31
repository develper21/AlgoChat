import { useEffect, useRef, useState } from 'react';

const MessageBubble = ({ message, isOwn, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(message.text || '');
  const [menuOpen, setMenuOpen] = useState(false);
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
                <img src={message.fileUrl} alt="uploaded" />
              ) : (
                <a href={message.fileUrl} target="_blank" rel="noreferrer">
                  View file
                </a>
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
    </div>
  );
};

export default MessageBubble;
