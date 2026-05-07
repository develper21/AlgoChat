import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, MessageCircle, MoreVertical, Users, Star, CheckSquare, CheckCheck, Lock, LogOut } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  // Filter users - online only + search filter
  const filteredUsers = users.filter((user) => {
    const isOnline = onlineUsers.includes(user._id);
    const matchesSearch = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return isOnline && matchesSearch;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full lg:w-80 flex flex-col bg-base-100">
      {/* Header - Chats Title with Menu */}
      <div className="bg-base-100 px-4 py-4 border-b border-base-300 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-base-content">Chats</h2>
          <p className="text-xs text-base-content/60 mt-1">{onlineUsers.length - 1} contacts online</p>
        </div>

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-base-200 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-base-content" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-base-100 rounded-lg shadow-xl border border-base-300 z-50 py-1">
              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Users className="w-4 h-4 text-base-content/70" />
                <span className="text-sm text-base-content">New group</span>
              </button>

              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Star className="w-4 h-4 text-base-content/70" />
                <span className="text-sm text-base-content">Starred messages</span>
              </button>

              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <CheckSquare className="w-4 h-4 text-base-content/70" />
                <span className="text-sm text-base-content">Select chats</span>
              </button>

              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <CheckCheck className="w-4 h-4 text-base-content/70" />
                <span className="text-sm text-base-content">Mark all as read</span>
              </button>

              <div className="my-1 border-t border-base-300"></div>

              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left">
                <Lock className="w-4 h-4 text-base-content/70" />
                <span className="text-sm text-base-content">App lock</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left group"
              >
                <LogOut className="w-4 h-4 text-base-content/70 group-hover:text-red-500" />
                <span className="text-sm text-base-content group-hover:text-red-500">Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-base-100 border-b border-base-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full px-4 py-3 flex items-center gap-3
              hover:bg-base-300 transition-colors border-b border-base-200
              ${selectedUser?._id === user._id ? "bg-base-300" : ""}
            `}
          >
            <div className="relative">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="w-12 h-12 object-cover rounded-full"
              />
              <span
                className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 
                rounded-full ring-2 ring-base-100"
              />
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Online
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-base-content/50 py-8 px-4">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No online users found</p>
            <p className="text-sm mt-1">Search or wait for contacts to come online</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
