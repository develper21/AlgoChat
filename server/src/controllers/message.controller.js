import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMediaMessages = async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all messages that have either image or audio, where the user is sender or receiver
    const mediaMessages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: myId },
            { receiverId: myId },
          ],
        },
        {
          $or: [
            { image: { $exists: true, $ne: null } },
            { audio: { $exists: true, $ne: null } },
          ],
        },
      ],
    }).sort({ createdAt: -1 }); // Newest first

    res.status(200).json(mediaMessages);
  } catch (error) {
    console.log("Error in getMediaMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, audioDuration } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let audioUrl;
    if (audio) {
      // Upload base64 audio to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "video", // Cloudinary stores audio as video
        folder: "voice_messages",
      });
      audioUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
      audioDuration,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log("Sending message to:", receiverId, "Socket ID:", receiverSocketId);

    if (receiverSocketId) {
      // If receiver is online, mark as delivered and emit
      newMessage.status = "delivered";
      await newMessage.save();
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log("Message emitted successfully to receiver");
    } else {
      console.log("Receiver not online, message saved but not emitted");
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
