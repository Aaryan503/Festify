import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

app.listen(5000, () =>
  console.log("Server running on port 5000")
);