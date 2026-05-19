import express from "express";
import {
  signup,
  login,
  logout,
  updateFullName,
  updateProfile,
  checkAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protectRoute, logout);
router.get("/check", protectRoute, checkAuth);
router.put("/fullname", protectRoute, updateFullName);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
