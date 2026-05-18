import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { clerkSignOut } from "../lib/token.js";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isSyncing: false,
  onlineUsers: [],
  socket: null,

  syncUser: async () => {
    set({ isSyncing: true });
    try {
      const res = await axiosInstance.post("/auth/sync");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      if (error.response?.status !== 401) {
        console.log("Error in syncUser:", error.message);
        toast.error(error.response?.data?.message || "Failed to sync account");
      }
      set({ authUser: null });
    } finally {
      set({ isSyncing: false });
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      if (error.response?.status !== 401) {
        console.log("Error in checkAuth:", error.message);
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  clearAuth: () => {
    get().disconnectSocket();
    set({ authUser: null, isCheckingAuth: false, isSyncing: false });
  },

  logout: async () => {
    try {
      get().disconnectSocket();
      set({ authUser: null });
      await clerkSignOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updateFullName: async (fullName) => {
    try {
      const res = await axiosInstance.put("/auth/fullname", { fullName });
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
      return { success: true, user: res.data };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
      return { success: false, error: error.response?.data?.message };
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    if (get().socket?.connected) return;

    if (get().socket) {
      get().socket.removeAllListeners();
      get().socket.close();
    }

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
