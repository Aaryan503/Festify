import express from "express";
import cors from "cors";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user.routes";
import eventRoutes from "./routes/event.routes";
import chatRoutes from "./routes/chat.routes";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(passport.initialize());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/chats", chatRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});