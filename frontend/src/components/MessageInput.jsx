import { useState } from 'react';
import FileUploadButton from './FileUploadButton.jsx';

const MessageInput = ({ onSend, onTyping, onFileUpload, uploadPreview, clearUploadPreview }) => {
  const [text, setText] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleTyping = (value) => {
    setText(value);
    onTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => onTyping(false), 1200);
    setTypingTimeout(timeout);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !uploadPreview) return;

    onSend({
      text: text.trim(),
      fileUrl: uploadPreview?.url,
      fileType: uploadPreview?.type
    });

    setText('');
    onTyping(false);
    clearUploadPreview();
  };

  return (
    <form className="message-input" onSubmit={handleSend}>
      <FileUploadButton onSelect={(file) => file && onFileUpload(file)} />
      {uploadPreview && (
        <div className="upload-preview">
          {uploadPreview.type?.startsWith('image') ? (
            <img src={uploadPreview.url} alt="preview" />
          ) : (
            <span>{uploadPreview.file?.name}</span>
          )}
          <button type="button" onClick={clearUploadPreview}>
            ✕
          </button>
        </div>
      )}
      <input
        type="text"
        placeholder="Type a message"
        value={text}
        onChange={(e) => handleTyping(e.target.value)}
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default MessageInput;
