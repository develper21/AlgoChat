import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function(v) {
          return /^\+?[1-9]\d{1,14}$/.test(v); // E.164 format
        },
        message: "Invalid mobile number format"
      }
    },
    fullName: {
      type: String,
      required: false, // Will be set after OTP verification
    },
    profilePic: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastOTP: {
      code: String,
      expiresAt: Date,
      sentAt: Date,
      attempts: {
        type: Number,
        default: 0,
      },
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
