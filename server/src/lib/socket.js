import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("User mapped:", userId, "->", socket.id);
  } else {
    console.log("No userId provided in socket connection");
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle message delivered confirmation
  socket.on("messageDelivered", async ({ messageId, senderId }) => {
    console.log("Message delivered event received:", messageId, "from sender:", senderId);
    try {
      // Update message status to delivered
      await Message.findByIdAndUpdate(messageId, { status: "delivered" });

      // Notify sender that message was delivered
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", { messageId, status: "delivered" });
      }
    } catch (error) {
      console.log("Error in messageDelivered:", error.message);
    }
  });

  // Handle message read confirmation
  socket.on("messageRead", async ({ messageId, senderId }) => {
    console.log("Message read event received:", messageId, "from sender:", senderId);
    try {
      // Update message status to read
      await Message.findByIdAndUpdate(messageId, { status: "read" });

      // Notify sender that message was read
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", { messageId, status: "read" });
      }
    } catch (error) {
      console.log("Error in messageRead:", error.message);
    }
  });

  // Handle marking all messages from a user as read
  socket.on("markAllMessagesAsRead", async ({ senderId, receiverId }) => {
    console.log("Mark all messages as read - sender:", senderId, "receiver:", receiverId);
    try {
      // Update all unread messages from sender to read
      await Message.updateMany(
        { senderId, receiverId, status: { $ne: "read" } },
        { status: "read" }
      );

      // Notify sender that all messages were read
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("allMessagesRead", { receiverId });
      }
    } catch (error) {
      console.log("Error in markAllMessagesAsRead:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id, "userId:", userId);
    if (userId) delete userSocketMap[userId];
    console.log("Current online users:", Object.keys(userSocketMap));
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
