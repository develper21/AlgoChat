import { useRef, useState } from 'react';
import VoiceRecorder from './VoiceRecorder.jsx';
import FileUploadButton from './FileUploadButton.jsx';
import ScheduledMessage from './ScheduledMessage.jsx';

const MessageInput = ({ onSend, onTyping, onFileUpload, uploadPreview, clearUploadPreview, currentUser, rooms }) => {
  const [text, setText] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleTyping = (value) => {
    setText(value);
    onTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => onTyping(false), 1200);
    setTypingTimeout(timeout);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed || uploadPreview) {
      onSend({ text: trimmed, fileUrl: uploadPreview?.url, fileType: uploadPreview?.type });
      setText('');
      clearUploadPreview();
    }
    onTyping(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleVoiceRecordingComplete = (audioFile) => {
    onSend({ fileUrl: URL.createObjectURL(audioFile), fileType: 'audio/webm', fileName: audioFile.name });
    setShowVoiceRecorder(false);
  };

  const handleVoiceRecordingStart = () => {
    onTyping(false);
  };

  const handleVoiceRecordingStop = () => {
    // Optional: Handle recording stop
  };

  const handleScheduleSuccess = () => {
    setText('');
    clearUploadPreview();
    // Optional: Show success notification
  };

  return (
    <div className="message-input-container">
      {showVoiceRecorder ? (
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecordingComplete}
          onRecordingStart={handleVoiceRecordingStart}
          onRecordingStop={handleVoiceRecordingStop}
        />
      ) : (
        <form className="message-input" onSubmit={handleSend}>
          <FileUploadButton onSelect={(file) => file && onFileUpload(file)} />
          {uploadPreview && (
            <div className="upload-preview">
              {uploadPreview.type?.startsWith('image') ? (
                <img src={uploadPreview.url} alt="preview" />
              ) : (
                <div>
                  <p>File selected</p>
                  <small>{uploadPreview.type}</small>
                </div>
              )}
              <button type="button" onClick={clearUploadPreview}>
                <span />
                <span />
                <span />
              </button>
            </div>
          )}
          <input
            type="text"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            disabled={!!uploadPreview}
          />
          <button type="submit" disabled={!text.trim() && !uploadPreview}>
            <span />
            <span />
            <span />
          </button>
          {/* Voice Recording Toggle */}
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            className="voice-record-toggle"
            title="Record voice message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 0114 0m-7 7v4m0 0v4" />
            </svg>
          </button>

          {/* Schedule Message Toggle */}
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="schedule-toggle"
            title="Schedule message"
            disabled={!text.trim() && !uploadPreview}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </form>
      )}
      
      {showScheduleModal && (
        <ScheduledMessage
          currentUser={currentUser}
          rooms={rooms}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  );
};

export default MessageInput;
