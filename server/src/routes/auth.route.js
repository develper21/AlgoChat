import express from "express";
import {
  sendOTP,
  verifyOTP,
  updateFullName,
  updateProfile,
  checkAuth,
  logout,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public — mobile OTP login / signup
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Protected — session & profile
router.get("/check", protectRoute, checkAuth);
router.post("/logout", logout);
router.put("/fullname", protectRoute, updateFullName);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
