import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, ChevronDown, Reply, Forward, Star, Trash2, Copy, Info } from "lucide-react";

// Message Status Component
const MessageStatus = ({ status }) => {
  if (status === "read") {
    // Blue double tick for read
    return (
      <span className="flex items-center">
        <CheckCheck className="w-3 h-3 text-blue-500" />
      </span>
    );
  } else if (status === "delivered") {
    // Grey double tick for delivered
    return (
      <span className="flex items-center">
        <CheckCheck className="w-3 h-3 text-base-content/50" />
      </span>
    );
  } else {
    // Single tick for sent
    return (
      <span className="flex items-center">
        <Check className="w-3 h-3 text-base-content/50" />
      </span>
    );
  }
};

const ChatContainer = () => {
  const { messages, selectedUser, getMessages, isMessagesLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto relative">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-base-100/80">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"} group relative`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble flex flex-col relative">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.audio && (
                <div className="flex items-center gap-2 mb-2">
                  <audio
                    src={message.audio}
                    controls
                    className="h-8 w-48 sm:w-64"
                  />
                  {message.audioDuration && (
                    <span className="text-xs text-base-content/60">
                      {Math.floor(message.audioDuration / 60)}:{(message.audioDuration % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              )}
              {message.text && <p>{message.text}</p>}
              <div className="flex items-center justify-between mt-1">
                <time className="text-xs opacity-50">
                  {formatMessageTime(message.createdAt)}
                </time>
                {/* Message Status - only for sent messages */}
                {message.senderId === authUser._id && (
                  <MessageStatus status={message.status || "sent"} />
                )}
              </div>
              
              {/* Message menu arrow - shows on hover */}
              <button 
                className={`absolute ${message.senderId === authUser._id ? '-left-8' : '-right-8'} top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-base-200 rounded`}
                onClick={() => setActiveMessageMenu(activeMessageMenu === message._id ? null : message._id)}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Message dropdown menu */}
              {activeMessageMenu === message._id && (
                <div className={`absolute ${message.senderId === authUser._id ? 'right-full mr-2' : 'left-full ml-2'} top-0 w-48 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50`}>
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-base-200 text-left text-sm">
                    <Reply className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-base-200 text-left text-sm">
                    <Forward className="w-4 h-4" />
                    <span>Forward</span>
                  </button>
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-base-200 text-left text-sm">
                    <Star className="w-4 h-4" />
                    <span>Star</span>
                  </button>
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-base-200 text-left text-sm">
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-base-200 text-left text-sm">
                    <Info className="w-4 h-4" />
                    <span>Info</span>
                  </button>
                  <hr className="border-base-300 my-1" />
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-base-200 text-left text-sm text-red-500">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Close menu when clicking outside */}
      {activeMessageMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActiveMessageMenu(null)}
        />
      )}

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
