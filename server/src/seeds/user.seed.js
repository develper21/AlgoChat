import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();

const seedUsers = [
  {
    clerkId: "seed_user_emma_thompson",
    email: "emma.thompson@example.com",
    fullName: "Emma Thompson",
    profilePic: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    clerkId: "seed_user_olivia_miller",
    email: "olivia.miller@example.com",
    fullName: "Olivia Miller",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    clerkId: "seed_user_james_anderson",
    email: "james.anderson@example.com",
    fullName: "James Anderson",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    clerkId: "seed_user_william_clark",
    email: "william.clark@example.com",
    fullName: "William Clark",
    profilePic: "https://randomuser.me/api/portraits/men/2.jpg",
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    await User.deleteMany({ clerkId: { $regex: /^seed_user_/ } });
    await User.insertMany(seedUsers);
    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
