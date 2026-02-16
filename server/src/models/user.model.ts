import mongoose from "mongoose";
import {UserRole} from "./userRole"
const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.FestAttendee,
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);