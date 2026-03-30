import { Router } from "express";
import {
  checkUsernameAvailability,
  forgotPassword,
  getCurrentUser,
  googleAuth,
  login,
  logout,
  refreshSession,
  register,
  resendVerificationEmail,
  resetPassword,
  updatePreferences,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshSession);
router.post("/register", register);
router.post("/resend-verification", resendVerificationEmail);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", getCurrentUser);
router.patch("/preferences", requireAuth, updatePreferences);
router.get("/check-username", checkUsernameAvailability);
router.get("/verify-email", verifyEmail);

export default router;
