import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();

const seedUsers = [
  // Female Users
  {
    mobileNumber: "+14155551001",
    fullName: "Emma Thompson",
    profilePic: "https://randomuser.me/api/portraits/women/1.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155551002",
    fullName: "Olivia Miller",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155551003",
    fullName: "Sophia Davis",
    profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155551004",
    fullName: "Ava Wilson",
    profilePic: "https://randomuser.me/api/portraits/women/4.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155551005",
    fullName: "Isabella Brown",
    profilePic: "https://randomuser.me/api/portraits/women/5.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155551006",
    fullName: "Mia Johnson",
    profilePic: "https://randomuser.me/api/portraits/women/6.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155551007",
    fullName: "Charlotte Williams",
    profilePic: "https://randomuser.me/api/portraits/women/7.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155551008",
    fullName: "Amelia Garcia",
    profilePic: "https://randomuser.me/api/portraits/women/8.jpg",
    isVerified: true,
  },

  // Male Users
  {
    mobileNumber: "+14155552001",
    fullName: "James Anderson",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155552002",
    fullName: "William Clark",
    profilePic: "https://randomuser.me/api/portraits/men/2.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155552003",
    fullName: "Benjamin Taylor",
    profilePic: "https://randomuser.me/api/portraits/men/3.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155552004",
    fullName: "Lucas Moore",
    profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155552005",
    fullName: "Henry Jackson",
    profilePic: "https://randomuser.me/api/portraits/men/5.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155552006",
    fullName: "Alexander Martin",
    profilePic: "https://randomuser.me/api/portraits/men/6.jpg",
    isVerified: true,
  },
  {
    mobileNumber: "+14155552007",
    fullName: "Daniel Rodriguez",
    profilePic: "https://randomuser.me/api/portraits/men/7.jpg",
    isVerified: true,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    await User.insertMany(seedUsers);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

// Call the function
seedDatabase();
