import { Router } from "express";
import { protect, AuthRequest } from "../middleware/auth.middleware";
import User from "../models/user.model";

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

export default router;
