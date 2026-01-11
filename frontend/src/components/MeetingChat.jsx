import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiPaperclip, FiSmile, FiReply, FiMoreVertical, FiTrash2, FiEdit2 } from 'react-icons/fi';
import './MeetingChat.css';

const MeetingChat = ({ 
  messages, 
  onSendMessage, 
  currentUser, 
  participants,
  isOpen,
  onClose 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ['😀', '😂', '😍', '🤔', '😎', '👍', '👎', '❤️', '🎉', '🔥', '💯', '👏'];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      const messageData = {
        message: messageInput.trim(),
        replyTo: replyTo?._id
      };

      if (editingMessage) {
        messageData.messageId = editingMessage._id;
        messageData.message = messageInput.trim();
        onSendMessage(messageData);
        setEditingMessage(null);
      } else {
        onSendMessage(messageData);
      }

      setMessageInput('');
      setReplyTo(null);
      setShowEmojiPicker(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('File uploaded:', file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReply = (message) => {
    setReplyTo(message);
    document.getElementById('message-input')?.focus();
  };

  const handleEdit = (message) => {
    if (message.sender._id === currentUser._id) {
      setEditingMessage(message);
      setMessageInput(message.message);
      setReplyTo(null);
      document.getElementById('message-input')?.focus();
    }
  };

  const handleDelete = (message) => {
    if (message.sender._id === currentUser._id) {
      // Handle delete message logic
      console.log('Delete message:', message);
    }
  };

  const addReaction = (messageId, emoji) => {
    // Handle add reaction logic
    console.log('Add reaction:', messageId, emoji);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getParticipantName = (userId) => {
    const participant = participants.find(p => p.user._id === userId);
    return participant?.user.name || 'Unknown';
  };

  const isHost = participants.some(p => p.user._id === currentUser._id && p.isHost);

  if (!isOpen) return null;

  return (
    <div className="meeting-chat">
      <div className="chat-header">
        <h3>Meeting Chat</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message._id || index} className="chat-message">
              {message.replyTo && (
                <div className="reply-preview">
                  <span>Replying to {message.replyTo.sender.name}</span>
                  <p>{message.replyTo.message}</p>
                </div>
              )}
              
              <div className="message-content">
                <div className="message-header">
                  <div className="sender-info">
                    <span className="sender-name">{message.sender.name}</span>
                    {message.sender._id === currentUser._id && (
                      <span className="you-badge">You</span>
                    )}
                    {participants.find(p => p.user._id === message.sender._id)?.isHost && (
                      <span className="host-badge">Host</span>
                    )}
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                    {message.edited && <span className="edited-badge">(edited)</span>}
                  </div>
                  
                  <div className="message-actions">
                    <button 
                      onClick={() => handleReply(message)}
                      className="action-btn"
                      title="Reply"
                    >
                      <FiReply />
                    </button>
                    
                    {message.sender._id === currentUser._id && (
                      <>
                        <button 
                          onClick={() => handleEdit(message)}
                          className="action-btn"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(message)}
                          className="action-btn"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="message-text">
                  {message.messageType === 'file' ? (
                    <div className="file-message">
                      <FiPaperclip />
                      <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                        {message.fileName || 'File'}
                      </a>
                    </div>
                  ) : (
                    <p>{message.message}</p>
                  )}
                </div>

                {message.reactions && message.reactions.length > 0 && (
                  <div className="message-reactions">
                    {message.reactions.map((reaction, idx) => (
                      <span key={idx} className="reaction">
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                    <button 
                      className="add-reaction-btn"
                      onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                    >
                      +
                    </button>
                  </div>
                )}

                {showReactions === message._id && (
                  <div className="emoji-picker">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(message._id, emoji)}
                        className="emoji-btn"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="reply-bar">
          <div className="reply-info">
            <span>Replying to {replyTo.sender.name}</span>
            <p>{replyTo.message}</p>
          </div>
          <button 
            onClick={() => setReplyTo(null)}
            className="cancel-reply-btn"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          id="message-input"
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
          className="message-input-field"
        />
        
        <div className="input-actions">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="input-btn"
            title="Attach file"
          >
            <FiPaperclip />
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="input-btn"
            title="Add emoji"
          >
            <FiSmile />
          </button>
          
          <button type="submit" className="send-btn" disabled={!messageInput.trim()}>
            <FiSend />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </form>

      {showEmojiPicker && (
        <div className="emoji-picker">
          {emojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleEmojiSelect(emoji)}
              className="emoji-btn"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="chat-participants">
        <h4>Participants ({participants.length})</h4>
        <div className="participants-list">
          {participants.map(participant => (
            <div key={participant.user._id} className="participant-item">
              <div className="participant-avatar">
                {participant.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="participant-info">
                <span className="participant-name">
                  {participant.user.name}
                  {participant.user._id === currentUser._id && ' (You)'}
                </span>
                {participant.isHost && <span className="host-badge">Host</span>}
              </div>
              <div className="participant-status">
                {participant.isMuted && <span className="status-muted">🔇</span>}
                {participant.isVideoOff && <span className="status-video-off">📹</span>}
                {participant.handRaised && <span className="status-hand-raised">✋</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingChat;
