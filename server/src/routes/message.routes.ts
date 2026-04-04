import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import InterestedUsers from "../models/interestedUsers.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send message to interested users of an event
router.post("/send-to-interested", isAuthenticated, async (req, res) => {
  try {
    const { eventId, title, body } = req.body;
    const senderId = req.user?._id;

    if (!eventId || !title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: "Event ID, title, and body are required" });
    }

    // Get all users interested in this event
    const interestedUsers = await InterestedUsers.find({ eventId })
      .populate('userId', 'name email')
      .lean();

    if (interestedUsers.length === 0) {
      return res.status(404).json({ message: "No users are interested in this event" });
    }

    // Filter out the sender if they're also interested in the event
    const recipients = interestedUsers
      .filter(interest => (interest.userId as any)._id.toString() !== senderId?.toString())
      .map(interest => ({
        userId: (interest.userId as any)._id,
        email: (interest.userId as any).email,
        status: "pending"
      }));

    if (recipients.length === 0) {
      return res.status(404).json({ message: "No other users are interested in this event" });
    }

    const message = await Message.create({
      eventId,
      senderId,
      title: title.trim(),
      body: body.trim(),
      recipients,
    });

    // Send emails to all interested users (excluding sender)
    const emailPromises = recipients.map(async (recipient) => {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipient.email,
          subject: title.trim(),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px;">${title.trim()}</h2>
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
                  <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${body.trim()}</p>
                </div>
                <p style="margin: 20px 0 0 0; font-size: 14px; opacity: 0.8;">
                  This message was sent to users interested in an event on Festify.
                </p>
              </div>
            </div>
          `,
        });

        // Update recipient status to sent
        await Message.updateOne(
          { _id: message._id, "recipients.userId": recipient.userId },
          { $set: { "recipients.$.sentAt": new Date(), "recipients.$.status": "sent" } }
        );

        return { success: true, email: recipient.email };
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        
        // Update recipient status to failed
        await Message.updateOne(
          { _id: message._id, "recipients.userId": recipient.userId },
          { $set: { "recipients.$.status": "failed" } }
        );

        return { success: false, email: recipient.email, error: (error as Error).message };
      }
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    const successful = emailResults.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = emailResults.filter(result => result.status === 'rejected' || !result.value.success).length;
    res.json({
      message: `Message sent to ${successful} users${failed > 0 ? ` (${failed} failed)` : ''}`,
      messageId: message._id,
      totalRecipients: recipients.length,
      successful,
      failed,
    });

  } catch (error) {
    console.error("Error sending message to interested users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get message history for an event
router.get("/event/:eventId/history", isAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = "1", limit = "10" } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const messages = await Message.find({ eventId })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Message.countDocuments({ eventId });
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      messages,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalMessages: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching message history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
