import mongoose, { Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  chatId: Types.ObjectId;
  eventId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new mongoose.Schema<IChatMessage>(
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
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ chatId: 1, createdAt: -1 });

const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", chatMessageSchema);
export default ChatMessage;
