import mongoose, { Document, Types } from "mongoose";

export interface IEventChat extends Document {
  eventId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventChatSchema = new mongoose.Schema<IEventChat>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const EventChat = mongoose.model<IEventChat>("EventChat", eventChatSchema);
export default EventChat;
