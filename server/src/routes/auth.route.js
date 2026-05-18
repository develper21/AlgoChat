import express from "express";
import {
  syncUser,
  updateFullName,
  updateProfile,
  checkAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/sync", protectRoute, syncUser);
router.get("/check", protectRoute, checkAuth);
router.put("/fullname", protectRoute, updateFullName);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
