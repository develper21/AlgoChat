import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquare, Settings, FolderOpen } from "lucide-react";

const LeftNavPanel = () => {
  const { authUser } = useAuthStore();

  return (
    <div className="w-16 h-full bg-base-200 border-r border-base-300 flex flex-col items-center py-4 flex-shrink-0">
      {/* Top Section - Chat Icon */}
      <Link
        to="/"
        className="p-3 rounded-xl hover:bg-base-300 transition-colors mb-4"
        title="Chats"
      >
        <MessageSquare className="w-6 h-6 text-base-content" />
      </Link>

      {/* Middle Section - Settings */}
      <Link
        to="/settings"
        className="p-3 rounded-xl hover:bg-base-300 transition-colors mb-auto"
        title="Settings"
      >
        <Settings className="w-6 h-6 text-base-content" />
      </Link>

      {/* Bottom Section - Profile & Media */}
      <div className="flex flex-col items-center gap-3 mt-auto">
        <Link
          to="/media"
          className="p-3 rounded-xl hover:bg-base-300 transition-colors"
          title="Media Gallery"
        >
          <FolderOpen className="w-6 h-6 text-base-content" />
        </Link>

        <Link
          to="/profile"
          className="p-1 rounded-xl hover:bg-base-300 transition-colors"
          title="Profile"
        >
          <img
            src={authUser?.profilePic || "/avatar.png"}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        </Link>
      </div>
    </div>
  );
};

export default LeftNavPanel;
