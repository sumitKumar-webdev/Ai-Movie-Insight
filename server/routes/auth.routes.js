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
  verifyEmail,
} from "../controllers/auth.controller.js";

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
router.get("/check-username", checkUsernameAvailability);
router.get("/verify-email", verifyEmail);

export default router;
