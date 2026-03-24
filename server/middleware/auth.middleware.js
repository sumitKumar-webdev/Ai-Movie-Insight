import User from "../models/User.js";
import { getAccessToken, verifyAccessToken } from "../lib/auth.js";

export async function requireAuth(req, res, next) {
  const token = getAccessToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyAccessToken(token);
  if (!payload?.userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = await User.findById(payload.userId).lean();
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.auth = payload;
  req.user = user;
  next();
}
