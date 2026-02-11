import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app: Application = express();
app.use(express.json());

connectDB();

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});