import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import { server } from "./lib/socket.js";
import "./app.js"; // attaches middleware + API routes to the app

dotenv.config();

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
