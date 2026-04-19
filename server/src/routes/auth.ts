import { Router } from "express";
import passport from "passport";
import { signToken } from "../utils/jwt";
import { getClientUrl } from "../config/urls";

const router = Router();

function cookieOptions() {
  const clientUrl = getClientUrl();
  const https = clientUrl.startsWith("https:");
  return {
    httpOnly: true,
    path: "/" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: https,
    sameSite: (https ? "none" : "lax") as "none" | "lax",
  };
}

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

    res.cookie("token", token, cookieOptions());

    res.redirect(`${getClientUrl()}/home`);
  }
);

router.get("/logout", (_req, res) => {
  const opts = cookieOptions();
  res.clearCookie("token", {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
  });
  res.json({ message: "Logged out" });
});

export default router;