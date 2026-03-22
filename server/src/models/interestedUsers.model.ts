import mongoose from "mongoose";

const interestedUsersSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
  },
  { 
    timestamps: true,
    // Ensure a user can only be interested in an event once
    indexes: [
      { userId: 1, eventId: 1 }, // Compound index for uniqueness
    ]
  }
);

// Create a compound unique index to prevent duplicate entries
interestedUsersSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("InterestedUsers", interestedUsersSchema);
