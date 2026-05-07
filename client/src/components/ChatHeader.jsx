import { MoreVertical, X, Search, Info, Volume2, Bell, Settings } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="p-2.5 border-b border-base-300 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Menu button */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-base-200 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-10 w-56 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50">
              {/* Menu items */}
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Search className="w-4 h-4" />
                <span>Search in conversation</span>
              </button>
              
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Info className="w-4 h-4" />
                <span>Contact info</span>
              </button>
              
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Volume2 className="w-4 h-4" />
                <span>Mute notifications</span>
              </button>
              
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Bell className="w-4 h-4" />
                <span>Custom notifications</span>
              </button>
              
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Settings className="w-4 h-4" />
                <span>More options</span>
              </button>
              
              <hr className="border-base-300 my-1" />
              
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 transition-colors text-left text-red-500"
              >
                <X className="w-4 h-4" />
                <span>Close chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close menu when clicking outside */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
export default ChatHeader;
