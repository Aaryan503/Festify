import mongoose from "mongoose";

export type EventStatus = "pending" | "accepted" | "rejected";
const EVENT_STATUSES: EventStatus[] = ["pending", "accepted", "rejected"];

const eventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: "pending",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interestedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
