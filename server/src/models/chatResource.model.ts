import mongoose, { Document, Types } from "mongoose";

export interface IChatResource extends Document {
  chatId: Types.ObjectId;
  eventId: Types.ObjectId;
  title: string;
  url: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatResourceSchema = new mongoose.Schema<IChatResource>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventChat",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

chatResourceSchema.index({ chatId: 1, createdAt: -1 });

const ChatResource = mongoose.model<IChatResource>("ChatResource", chatResourceSchema);
export default ChatResource;
