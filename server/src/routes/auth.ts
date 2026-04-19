import { Router } from "express";
import passport from "passport";
import { signToken } from "../utils/jwt";
import { getClientUrl } from "../config/urls";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user as any;

    const token = signToken(user._id.toString());

    // Redirect to the client-side callback page with the token in the URL.
    // We can no longer use cookies because Railway's .up.railway.app domain
    // is on the Public Suffix List and browsers refuse cross-site cookies.
    res.redirect(`${getClientUrl()}/auth/callback?token=${token}`);
  }
);

router.get("/logout", (_req, res) => {
  // Cookie clearing kept for backward compat with any lingering cookies
  res.clearCookie("token", { httpOnly: true, path: "/" });
  res.json({ message: "Logged out" });
});

export default router;