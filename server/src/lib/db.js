import mongoose from "mongoose";
import User from "../models/user.model.js";

const LEGACY_INDEX_NAMES = [
  "email_1",
  "username_1",
  "mobileNumber_1",
];

const dropIndexIfExists = async (collection, indexName) => {
  try {
    await collection.dropIndex(indexName);
    console.log(`Dropped legacy index: ${indexName}`);
  } catch (error) {
    if (error.code !== 27) {
      console.log(`Legacy index ${indexName}:`, error.message);
    }
  }
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    const collection = User.collection;

    for (const indexName of LEGACY_INDEX_NAMES) {
      await dropIndexIfExists(collection, indexName);
    }

    const { deletedCount } = await User.deleteMany({
      $or: [{ clerkId: null }, { clerkId: { $exists: false } }, { clerkId: "" }],
    });
    if (deletedCount > 0) {
      console.log(`Removed ${deletedCount} legacy user(s) without a Clerk ID`);
    }

    await User.syncIndexes();
    console.log("User indexes synced");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};
