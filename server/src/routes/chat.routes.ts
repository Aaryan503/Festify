import express from "express";
import mongoose from "mongoose";
import { isAuthenticated } from "../middleware/auth.middleware";
import EventChat from "../models/eventChat.model";
import ChatMessage from "../models/chatMessage.model";
import ChatResource from "../models/chatResource.model";
import {
  getChatAccessContext,
  isChatAdmin,
  isParticipant,
} from "../services/chatAccess.service";

const router = express.Router();

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const getOrCreateChat = async (eventId: string) => {
  const existing = await EventChat.findOne({ eventId }).lean();
  if (existing) {
    return existing;
  }

  return EventChat.create({ eventId });
};

router.get("/events/:eventId", isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const context = await getChatAccessContext(eventId);
    if (!context) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (!isParticipant(userId, context)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const chat = await getOrCreateChat(eventId);

    return res.json({
      chatId: chat._id,
      eventId: chat.eventId,
      isAdmin: isChatAdmin(userId, context),
      participantsCount: context.participantIds.size,
    });
  } catch (error) {
    console.error("Error fetching event chat:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/events/:eventId/messages", isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const { before, limit = "50" } = req.query;
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const context = await getChatAccessContext(eventId);
    if (!context) {
      return res.status(404).json({ message: "Event not found." });
    }
    if (!isParticipant(userId, context)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const chat = await getOrCreateChat(eventId);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));

    const filter: Record<string, unknown> = { chatId: chat._id, eventId };
    if (typeof before === "string" && mongoose.Types.ObjectId.isValid(before)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await ChatMessage.find(filter)
      .populate("senderId", "name email avatar role")
      .sort({ _id: -1 })
      .limit(parsedLimit)
      .lean();

    return res.json({
      messages: messages.reverse(),
      nextBefore: messages.length ? messages[0]._id : null,
      isAdmin: isChatAdmin(userId, context),
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/events/:eventId/messages", isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const { content } = req.body as { content?: string };
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required." });
    }

    const context = await getChatAccessContext(eventId);
    if (!context) {
      return res.status(404).json({ message: "Event not found." });
    }
    if (!isParticipant(userId, context)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const chat = await getOrCreateChat(eventId);
    const message = await ChatMessage.create({
      chatId: chat._id,
      eventId,
      senderId: userId,
      content: content.trim(),
    });

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate("senderId", "name email avatar role")
      .lean();

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/events/:eventId/messages/:messageId", isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const messageId = req.params.messageId as string;
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id." });
    }

    const context = await getChatAccessContext(eventId);
    if (!context) {
      return res.status(404).json({ message: "Event not found." });
    }
    if (!isParticipant(userId, context)) {
      return res.status(403).json({ message: "Access denied." });
    }
    if (!isChatAdmin(userId, context)) {
      return res.status(403).json({ message: "Only chat admins can delete messages." });
    }

    const deleted = await ChatMessage.findOneAndDelete({
      _id: messageId,
      eventId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Message not found." });
    }

    return res.json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/events/:eventId/resources", isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const context = await getChatAccessContext(eventId);
    if (!context) {
      return res.status(404).json({ message: "Event not found." });
    }
    if (!isParticipant(userId, context)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const chat = await getOrCreateChat(eventId);
    const resources = await ChatResource.find({ chatId: chat._id, eventId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ resources });
  } catch (error) {
    console.error("Error fetching chat resources:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/events/:eventId/resources", isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const { title, url } = req.body as { title?: string; url?: string };
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Resource title is required." });
    }
    if (!url || !isValidHttpUrl(url)) {
      return res.status(400).json({ message: "A valid http/https URL is required." });
    }

    const context = await getChatAccessContext(eventId);
    if (!context) {
      return res.status(404).json({ message: "Event not found." });
    }
    if (!isParticipant(userId, context)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const chat = await getOrCreateChat(eventId);
    const resource = await ChatResource.create({
      chatId: chat._id,
      eventId,
      title: title.trim(),
      url: url.trim(),
      createdBy: userId,
    });

    const populatedResource = await ChatResource.findById(resource._id)
      .populate("createdBy", "name email")
      .lean();

    return res.status(201).json({ resource: populatedResource });
  } catch (error) {
    console.error("Error creating chat resource:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
