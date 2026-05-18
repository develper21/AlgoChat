import { getAuth, requireAuth } from "@clerk/express";
import User from "../models/user.model.js";
import { clerkClient, getClerkProfile } from "../lib/clerk.js";

export const requireClerkAuth = requireAuth();

export const findOrCreateMongoUser = async (clerkId) => {
  let user = await User.findOne({ clerkId });
  if (user) return user;

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const { email, fullName, profilePic } = getClerkProfile(clerkUser);

  user = await User.create({
    clerkId,
    email,
    fullName,
    profilePic,
  });

  return user;
};

export const attachMongoUser = async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = await findOrCreateMongoUser(clerkId);
    next();
  } catch (error) {
    console.log("Error in attachMongoUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const protectRoute = [requireClerkAuth, attachMongoUser];
