import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";

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