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

export interface IUser extends mongoose.Document {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const User = mongoose.model<IUser>("User", userSchema);
export default User;