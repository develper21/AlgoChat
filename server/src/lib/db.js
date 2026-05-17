import mongoose from "mongoose";
import User from "../models/user.model.js";

const LEGACY_INDEX_NAMES = ["email_1", "username_1"];

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

    // Drop old auth indexes before cleaning data or syncing new schema
    for (const indexName of LEGACY_INDEX_NAMES) {
      await dropIndexIfExists(collection, indexName);
    }
    await dropIndexIfExists(collection, "mobileNumber_1");

    // Remove users from the old email/password schema (no valid mobile number)
    const { deletedCount } = await User.deleteMany({
      $or: [
        { mobileNumber: null },
        { mobileNumber: { $exists: false } },
        { mobileNumber: "" },
      ],
    });
    if (deletedCount > 0) {
      console.log(`Removed ${deletedCount} legacy user(s) without a mobile number`);
    }

    await User.updateMany({ email: { $exists: true } }, { $unset: { email: 1 } });

    await User.syncIndexes();
    console.log("User indexes synced");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};
