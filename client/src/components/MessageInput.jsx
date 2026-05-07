import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile, Mic, Square, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Picker from "emoji-picker-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState(null);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const { sendMessage } = useChatStore();

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioPreview(audioUrl);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setAudioBlob(null);
    setAudioPreview(null);
    setRecordingDuration(0);
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        await sendMessage({
          audio: base64Audio,
          audioDuration: recordingDuration,
        });

        // Clear recording
        setAudioBlob(null);
        setAudioPreview(null);
        setRecordingDuration(0);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Failed to send audio message:", error);
      toast.error("Failed to send voice message");
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      if (audioBlob) {
        await sendAudioMessage();
      } else {
        await sendMessage({
          text: text.trim(),
          image: imagePreview,
        });

        // Clear form
        setText("");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full relative">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioPreview && (
        <div className="mb-3 flex items-center gap-2 bg-base-200 p-3 rounded-lg">
          <audio src={audioPreview} controls className="flex-1 h-8" />
          <span className="text-sm text-base-content/60">{formatDuration(recordingDuration)}</span>
          <button
            onClick={cancelRecording}
            className="p-2 rounded-full hover:bg-base-300 transition-colors"
            type="button"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Recording UI */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-4 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-500">Recording...</span>
          </div>
          <span className="text-lg font-mono">{formatDuration(recordingDuration)}</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={cancelRecording}
              className="p-2 rounded-full hover:bg-red-500/20 transition-colors"
              type="button"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
            <button
              onClick={stopRecording}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              type="button"
            >
              <Square className="w-5 h-5 text-white fill-white" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder={isRecording ? "Recording audio..." : "Type a message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecording || audioBlob}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || audioBlob}
          >
            <Image size={20} />
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${showEmojiPicker ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isRecording || audioBlob}
          >
            <Smile size={20} />
          </button>

          {/* Voice Recording Button */}
          {!isRecording && !audioBlob && (
            <button
              type="button"
              className="hidden sm:flex btn btn-circle text-zinc-400 hover:text-primary"
              onClick={startRecording}
            >
              <Mic size={20} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob}
        >
          <Send size={22} />
        </button>
      </form>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 right-4 z-50"
        >
          <Picker
            onEmojiClick={onEmojiClick}
            autoFocusSearch={false}
            theme="dark"
          />
        </div>
      )}
    </div>
  );
};
export default MessageInput;
