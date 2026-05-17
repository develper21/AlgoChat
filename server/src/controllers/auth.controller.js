import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import otpService from "../services/otp.service.js";
import smsService from "../services/sms.service.js";

const formatUserResponse = (user, extra = {}) => ({
  _id: user._id,
  fullName: user.fullName,
  mobileNumber: user.mobileNumber,
  profilePic: user.profilePic,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  ...extra,
});

export const sendOTP = async (req, res) => {
  const { mobileNumber } = req.body;

  try {
    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const formattedMobile = otpService.formatMobileNumber(mobileNumber);
    if (!otpService.validateMobileNumber(formattedMobile)) {
      return res.status(400).json({ message: "Invalid mobile number format" });
    }

    const existingUser = await User.findOne({ mobileNumber: formattedMobile });

    if (existingUser?.lastOTP?.sentAt && !otpService.canResend(existingUser.lastOTP.sentAt)) {
      const waitSec = otpService.resendCooldownSeconds(existingUser.lastOTP.sentAt);
      return res.status(429).json({
        message: `Please wait ${waitSec} seconds before requesting a new OTP`,
      });
    }

    const otp = otpService.generate();
    const hashedOtp = await otpService.hash(otp);
    const expiresAt = otpService.getExpiryDate();
    const sentAt = new Date();

    await User.findOneAndUpdate(
      { mobileNumber: formattedMobile },
      {
        $set: {
          lastOTP: { code: hashedOtp, expiresAt, attempts: 0, sentAt },
        },
        $setOnInsert: {
          mobileNumber: formattedMobile,
          fullName: "",
          isVerified: false,
        },
        $unset: { email: 1 },
      },
      { upsert: true, runValidators: true }
    );

    const smsResult = await smsService.sendOTP(formattedMobile, otp);

    if (!smsResult.success) {
      return res.status(502).json({ message: smsResult.message || "Failed to send OTP" });
    }

    res.status(200).json({
      message: smsResult.message || "OTP sent successfully",
      mobileNumber: formattedMobile,
      ...(process.env.NODE_ENV === "development" &&
        smsResult.devFallback && { otp }),
    });
  } catch (error) {
    console.log("Error in sendOTP:", error.message);
    if (error.code === 11000) {
      return res.status(500).json({
        message:
          "Database index conflict. Restart the server once to apply migrations, then try again.",
      });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyOTP = async (req, res) => {
  const { mobileNumber, otp, fullName } = req.body;

  try {
    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required" });
    }

    const formattedMobile = otpService.formatMobileNumber(mobileNumber);
    if (!otpService.validateMobileNumber(formattedMobile)) {
      return res.status(400).json({ message: "Invalid mobile number format" });
    }

    const user = await User.findOne({ mobileNumber: formattedMobile });
    if (!user) {
      return res.status(400).json({ message: "User not found. Please request OTP first" });
    }

    if (!user.lastOTP?.code) {
      return res.status(400).json({ message: "No OTP found. Please request a new OTP" });
    }

    if (otpService.isExpired(user.lastOTP.expiresAt)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP" });
    }

    if (user.lastOTP.attempts >= otpService.maxAttempts) {
      return res.status(400).json({ message: "Too many attempts. Please request a new OTP" });
    }

    user.lastOTP.attempts += 1;

    const isValid = await otpService.verify(otp, user.lastOTP.code);
    if (!isValid) {
      await user.save();
      const remainingAttempts = otpService.maxAttempts - user.lastOTP.attempts;
      return res.status(400).json({
        message: `Invalid OTP. ${remainingAttempts} attempts remaining`,
      });
    }

    user.lastOTP = null;
    user.isVerified = true;

    if (fullName?.trim()) {
      user.fullName = fullName.trim();
    }

    await user.save();
    generateToken(user._id, res);

    if (!user.fullName?.trim()) {
      return res.status(200).json(
        formatUserResponse(user, {
          message: "OTP verified successfully. Please provide your full name",
          requiresFullName: true,
          mobileNumber: formattedMobile,
        })
      );
    }

    res.status(200).json(
      formatUserResponse(user, { message: "Login successful" })
    );
  } catch (error) {
    console.log("Error in verifyOTP:", error.message);
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
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
