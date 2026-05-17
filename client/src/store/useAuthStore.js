import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // Mobile OTP states
  isSendingOTP: false,
  isVerifyingOTP: false,
  isUpdatingFullName: false,
  tempMobileNumber: null,
  otpSent: false,
  requiresFullName: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      // 401 is expected when not logged in - don't log as error
      if (error.response?.status !== 401) {
        console.log("Error in checkAuth:", error.message);
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // If socket exists and is connected, don't create a new one
    if (get().socket?.connected) return;

    // If socket exists but disconnected, clean it up first
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
      transports: ['websocket', 'polling'],
    });

    set({ socket: socket });

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

  // Mobile OTP methods
  sendOTP: async (mobileNumber) => {
    set({ isSendingOTP: true });
    try {
      const res = await axiosInstance.post("/auth/send-otp", { mobileNumber });
      set({ 
        isSendingOTP: false, 
        otpSent: true, 
        tempMobileNumber: res.data.mobileNumber 
      });
      toast.success(res.data.message || "OTP sent successfully");

      if (import.meta.env.MODE === "development" && res.data.otp) {
        toast(`Dev OTP: ${res.data.otp}`, { duration: 10000, icon: "🔐" });
      }
      
      return { success: true, mobileNumber: res.data.mobileNumber };
    } catch (error) {
      set({ isSendingOTP: false });
      toast.error(error.response?.data?.message || "Failed to send OTP");
      return { success: false, error: error.response?.data?.message };
    }
  },

  verifyOTP: async (otp, fullName = null) => {
    set({ isVerifyingOTP: true });
    try {
      const { tempMobileNumber } = get();
      const payload = { mobileNumber: tempMobileNumber, otp };
      
      if (fullName) {
        payload.fullName = fullName;
      }

      const res = await axiosInstance.post("/auth/verify-otp", payload);
      
      if (res.data.requiresFullName) {
        set({
          authUser: res.data,
          isVerifyingOTP: false,
          requiresFullName: true,
          tempMobileNumber: res.data.mobileNumber,
        });
        get().connectSocket();
        return { success: true, requiresFullName: true };
      }

      set({ 
        authUser: res.data,
        isVerifyingOTP: false, 
        otpSent: false,
        requiresFullName: false,
        tempMobileNumber: null 
      });
      
      toast.success(res.data.message || "Login successful");
      get().connectSocket();
      
      return { success: true, user: res.data };
    } catch (error) {
      set({ isVerifyingOTP: false });
      toast.error(error.response?.data?.message || "OTP verification failed");
      return { success: false, error: error.response?.data?.message };
    }
  },

  updateFullName: async (fullName) => {
    set({ isUpdatingFullName: true });
    try {
      const res = await axiosInstance.put("/auth/fullname", { fullName });
      set({ 
        authUser: res.data,
        isUpdatingFullName: false,
        requiresFullName: false 
      });
      toast.success("Profile updated successfully");
      return { success: true, user: res.data };
    } catch (error) {
      set({ isUpdatingFullName: false });
      toast.error(error.response?.data?.message || "Failed to update profile");
      return { success: false, error: error.response?.data?.message };
    }
  },

  resetMobileAuth: () => {
    set({
      isSendingOTP: false,
      isVerifyingOTP: false,
      isUpdatingFullName: false,
      otpSent: false,
      requiresFullName: false,
      tempMobileNumber: null,
    });
  },
}));
