import { getAuth } from "@clerk/express";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { clerkClient, getClerkProfile } from "../lib/clerk.js";

export const formatUserResponse = (user, extra = {}) => ({
  _id: user._id,
  clerkId: user.clerkId,
  email: user.email,
  fullName: user.fullName,
  profilePic: user.profilePic,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  ...extra,
});

export const syncUser = async (req, res) => {
  try {
    const { userId: clerkId } = getAuth(req);
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const { email, fullName, profilePic } = getClerkProfile(clerkUser);

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = await User.create({ clerkId, email, fullName, profilePic });
    } else {
      user.email = email;
      if (!user.fullName?.trim() && fullName) user.fullName = fullName;
      if (!user.profilePic && profilePic) user.profilePic = profilePic;
      await user.save();
    }

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.log("Error in syncUser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateFullName = async (req, res) => {
  try {
    if (!req.body.fullName?.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { fullName: req.body.fullName.trim() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(
      formatUserResponse(updatedUser, { message: "Profile updated successfully" })
    );
  } catch (error) {
    console.log("Error in updateFullName:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(formatUserResponse(updatedUser));
  } catch (error) {
    console.log("Error in updateProfile:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(formatUserResponse(req.user));
  } catch (error) {
    console.log("Error in checkAuth:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
