import { Router } from "express";
import { protect, isAuthenticated, AuthRequest } from "../middleware/auth.middleware";
import User from "../models/user.model";
import { UserRole } from "../models/userRole";

const router = Router();

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById((req as AuthRequest).userId).select(
      "-googleId -__v"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Fest Organizing Body: promote an existing user to Event Manager by email
router.post("/promote-event-manager", isAuthenticated, async (req, res) => {
  try {
    if (req.user?.role !== UserRole.FestOrganizingBody) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { email } = req.body as { email?: string };
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i"),
    });
    if (!user) {
      return res.status(404).json({ message: "User not found for the provided email." });
    }

    if (user.role === UserRole.EventManager) {
      return res.status(200).json({ message: "User is already an Event Manager.", user });
    }

    if (user.role !== UserRole.FestAttendee) {
      return res
        .status(400)
        .json({ message: "Only users with role 'Fest Attendee' can be promoted." });
    }

    user.role = UserRole.EventManager;
    await user.save();

    res.json({
      message: "User promoted to Event Manager.",
      user,
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
