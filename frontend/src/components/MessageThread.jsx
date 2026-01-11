import React, { useState, useEffect, useRef } from 'react';
import { getThreadMessages, startThread } from '../api/messages.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';

const MessageThread = ({ parentMessage, currentUser, onClose, onSendMessage, rooms }) => {
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  // Load thread messages
  const loadThreadMessages = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const data = await getThreadMessages(parentMessage._id, pageNum);
      
      if (append) {
        setThreadMessages(prev => [...data.messages, ...prev]);
      } else {
        setThreadMessages(data.messages);
      }
      
      setHasMore(pageNum < data.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load thread messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load more messages (scroll to top)
  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      loadThreadMessages(page + 1, true);
    }
  };

  // Send thread reply
  const handleSendReply = async (content) => {
    setSending(true);
    try {
      const data = await startThread(parentMessage._id, content);
      setThreadMessages(prev => [...prev, data.message]);
      setReplyText('');
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  // Load initial messages
  useEffect(() => {
    loadThreadMessages();
  }, [parentMessage._id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const formatReplyCount = (count) => {
    if (count === 1) return '1 reply';
    if (count <= 10) return `${count} replies`;
    return `${count}+ replies`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Thread</h3>
            <p className="text-sm text-gray-600">
              {formatReplyCount(parentMessage.threadReplyCount || 0)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Parent Message */}
        <div className="border-b p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              {parentMessage.sender?.avatar ? (
                <img
                  src={parentMessage.sender.avatar}
                  alt={parentMessage.sender.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium">
                  {parentMessage.sender?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{parentMessage.sender?.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(parentMessage.createdAt).toLocaleString()}
                </span>
              </div>
              {parentMessage.text && (
                <p className="text-sm text-gray-700">{parentMessage.text}</p>
              )}
              {parentMessage.fileUrl && (
                <div className="text-sm text-blue-600 mt-1">
                  📎 {parentMessage.fileType || 'File'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && threadMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Loading thread messages...
            </div>
          ) : (
            <>
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mb-4">
                  <button
                    onClick={loadMoreMessages}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load earlier replies'}
                  </button>
                </div>
              )}

              {/* Thread Messages */}
              <div className="space-y-3">
                {threadMessages.map((message) => (
                  <div key={message._id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.sender?.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {message.text && (
                        <p className="text-sm text-gray-700">{message.text}</p>
                      )}
                      {message.fileUrl && (
                        <div className="text-sm text-blue-600 mt-1">
                          📎 {message.fileType || 'File'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Reply Input */}
        <div className="border-t p-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (replyText.trim()) {
              handleSendReply({ text: replyText.trim() });
            }
          }} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply in thread..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
