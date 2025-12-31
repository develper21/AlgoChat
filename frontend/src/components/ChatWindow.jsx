import { useEffect, useMemo, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';

const TypingIndicator = ({ room, typingUsers }) => {
  if (!room) return null;
  const names = Object.keys(typingUsers || {})
    .map((userId) => room.members.find((member) => member._id === userId)?.name)
    .filter(Boolean);
  if (!names.length) return null;
  return <p className="typing-indicator">{names.join(', ')} is typing…</p>;
};

const ChatWindow = ({
  room,
  messages,
  currentUser,
  onSendMessage,
  onTyping,
  typingUsers,
  onEditMessage,
  onDeleteMessage,
  onFileUpload,
  uploadPreview,
  clearUploadPreview
}) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const roomTitle = useMemo(() => {
    if (!room) return 'Select a room';
    if (room.isGroup) return room.name;
    const other = room.members.find((member) => member._id !== currentUser?._id);
    return other?.name || 'Direct Chat';
  }, [room, currentUser?._id]);

  const roomSubtitle = useMemo(() => {
    if (!room) return '';
    if (room.isGroup) {
      const memberNames = room.members.map(m => m.name).join(', ');
      return `${room.members.length} members: ${memberNames}`;
    }
    const other = room.members.find((member) => member._id !== currentUser?._id);
    return other?.email || '';
  }, [room, currentUser?._id]);

  if (!room) {
    return (
      <section className="chat-window empty">
        <h2>Algonive Chat</h2>
        <p>Select a chat or start a new conversation from the sidebar.</p>
      </section>
    );
  }

  return (
    <section className="chat-window">
      <header className="chat-header">
        <div>
          <h2>{roomTitle}</h2>
          <p>{roomSubtitle}</p>
        </div>
      </header>
      <div className="chat-body">
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender?._id === currentUser?._id}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
        ))}
        <TypingIndicator room={room} typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>
      <MessageInput
        onSend={onSendMessage}
        onTyping={onTyping}
        onFileUpload={onFileUpload}
        uploadPreview={uploadPreview}
        clearUploadPreview={clearUploadPreview}
      />
    </section>
  );
};

export default ChatWindow;
