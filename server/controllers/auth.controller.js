import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getAuthToken,
  signAuthToken,
  verifyAuthToken,
} from "../lib/auth.js";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../lib/email.js";
import { errorRes, successRes } from "../lib/res.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

function sanitizeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    username: user.username ?? "",
    authProvider: Array.isArray(user.authProvider)
      ? user.authProvider
      : user.authProvider
        ? [user.authProvider]
        : [],
    emailVerified: Boolean(user.emailVerified),
  };
}

function isValidUsername(value) {
  return USERNAME_PATTERN.test(value.trim());
}

function buildTokenWithExpiry(hours = 24) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return {
    rawToken,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * hours),
  };
}

async function generateUniqueUsername(seedValue) {
  const baseValue = String(seedValue ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  let base = baseValue || `user_${crypto.randomBytes(3).toString("hex")}`;
  if (base.length < 3) {
    base = `${base}${crypto.randomBytes(2).toString("hex")}`.slice(0, 3);
  }

  let candidate = base.slice(0, 20);
  let suffix = 0;

  while (true) {
    const existing = await User.exists({ username: candidate });
    if (!existing) {
      return candidate;
    }

    suffix += 1;
    const suffixText = String(suffix);
    const trimmedBase = base.slice(0, Math.max(3, 20 - suffixText.length - 1));
    candidate = `${trimmedBase}_${suffixText}`;
  }
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getAuthCookieOptions(),
    maxAge: undefined,
  });
}

export const register = async (req, res) => {
  try {
    const body = req.body ?? {};
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const username = String(body.username ?? "").trim();
    const password = typeof body.password === "string" ? body.password : "";

    if (!name) return errorRes(res, 400, "name is required");
    if (!email) return errorRes(res, 400, "email is required");
    if (!username) return errorRes(res, 400, "username is required");
    if (!password) return errorRes(res, 400, "password is required");

    if (!isValidUsername(username)) {
      return errorRes(
        res,
        400,
        "Username must be 3 to 20 characters and use only letters, numbers, or underscores",
      );
    }

    if (password.length < 6) {
      return errorRes(res, 400, "Password must be at least 6 characters long");
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existingUser?.email === email) {
      return errorRes(res, 409, "An account with this email already exists");
    }

    if (existingUser?.username === username) {
      return errorRes(res, 409, "This username is already taken");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verification = buildTokenWithExpiry(24);
    const session = await mongoose.startSession();
    let user;
    let delivery;

    try {
      await session.withTransaction(async () => {
        user = new User({
          name,
          email,
          username,
          passwordHash,
          authProvider: ["local"],
          isactive: false,
          emailVerified: false,
          emailVerificationTokenHash: verification.tokenHash,
          emailVerificationExpiresAt: verification.expiresAt,
        });

        await user.save({ session });

        delivery = await sendVerificationEmail(
          user.email,
          user.name,
          verification.rawToken,
        );

        if (!delivery.delivered) {
          throw new Error("Verification email could not be sent. Please try again later.");
        }
      });
    } finally {
      await session.endSession();
    }

    await sendWelcomeEmail(user.email, user.name);

    return successRes(res, 201, "Verification email sent", {
      user: sanitizeUser(user),
      requiresVerification: true,
      emailSent: delivery.delivered,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to register user";
    return errorRes(res, 500, message);
  }
};

export const login = async (req, res) => {
  try {
    const body = req.body ?? {};
    const identifier = String(body.identifier ?? "").trim();
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return errorRes(res, 400, "username or email and password are required");
    }

    const normalizedEmail = identifier.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: identifier }],
    });

    if (!user) {
      return errorRes(res, 401, "Invalid username/email or password");
    }

    const providers = Array.isArray(user.authProvider)
      ? user.authProvider
      : user.authProvider
        ? [user.authProvider]
        : [];

    if (!providers.includes("local") || !user.passwordHash) {
      return errorRes(res, 400, "This account uses a different sign-in method");
    }

    if (!user.emailVerified) {
      return errorRes(res, 403, "Please verify your email before logging in");
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return errorRes(res, 401, "Invalid username/email or password");
    }

    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
    });
    setAuthCookie(res, token);

    return successRes(res, 200, "Login successful", {
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to login";
    return errorRes(res, 500, message);
  }
};

export const googleAuth = async (req, res) => {
  try {
    if (!googleClient || !googleClientId) {
      return errorRes(res, 500, "Google sign-in is not configured");
    }

    const body = req.body ?? {};
    const googleToken =
      typeof body.token === "string"
        ? body.token.trim()
        : typeof body.idToken === "string"
          ? body.idToken.trim()
          : "";

    if (!googleToken) {
      return errorRes(res, 400, "Google ID token is required");
    }

    let user;
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const googleId = payload?.sub?.trim();
    const email = payload?.email?.trim().toLowerCase();
    const name =
      payload?.name?.trim() || payload?.given_name?.trim() || "Google User";
    const avatar = payload?.picture?.trim() || null;

    if (!googleId || !email || !payload?.email_verified) {
      throw new Error("Invalid Google account payload");
    }

    user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (!user) {
      user = new User({
        name,
        email,
        avatar,
        username: await generateUniqueUsername(email.split("@")[0] || name),
        authProvider: ["google"],
        googleId,
        isactive: true,
        emailVerified: true,
      });

      await user.save();
    } else {
      const providers = Array.isArray(user.authProvider)
        ? user.authProvider
        : user.authProvider
          ? [user.authProvider]
          : [];

      if (!providers.includes("google")) {
        providers.push("google");
      }

      if (user.passwordHash && !providers.includes("local")) {
        providers.push("local");
      }

      user.authProvider = providers;
      user.googleId = user.googleId || googleId;
      user.emailVerified = true;
      user.isactive = true;
      user.name = user.name || name;
      user.avatar = user.avatar || avatar;

      if (!user.username) {
        user.username = await generateUniqueUsername(email.split("@")[0] || name);
      }

      await user.save();
    }

    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
    });
    setAuthCookie(res, token);

    return successRes(res, 200, "Google authentication successful", {
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to authenticate with Google";
    return errorRes(res, 500, message);
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token =
      typeof req.query.token === "string" ? req.query.token.trim() : "";

    if (!token) {
      return errorRes(res, 400, "Verification token is required");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return errorRes(res, 400, "Invalid or expired verification link");
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    return successRes(res, 200, "Email verified successfully", {
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify email";
    return errorRes(res, 500, message);
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return errorRes(res, 400, "email is required");
    }

    const user = await User.findOne({ email });
    const providers = Array.isArray(user?.authProvider)
      ? user.authProvider
      : user?.authProvider
        ? [user.authProvider]
        : [];

    if (!user || !providers.includes("local")) {
      return successRes(
        res,
        200,
        "If that email is registered, a verification link has been sent.",
        {
          emailSent: true,
        },
      );
    }

    if (user.emailVerified) {
      return successRes(res, 200, "This email is already verified.", {
        alreadyVerified: true,
        emailSent: false,
      });
    }

    const verification = buildTokenWithExpiry(24);
    user.emailVerificationTokenHash = verification.tokenHash;
    user.emailVerificationExpiresAt = verification.expiresAt;
    await user.save();

    const delivery = await sendVerificationEmail(
      user.email,
      user.name,
      verification.rawToken,
    );

    if (!delivery.delivered) {
      return errorRes(
        res,
        500,
        "We couldn't send the verification email right now. Please try again in a moment.",
      );
    }

    return successRes(
      res,
      200,
      "A new verification email has been sent.",
      {
        emailSent: true,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resend verification email";
    return errorRes(res, 500, message);
  }
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    const username = String(req.query.username ?? "").trim();

    if (!username) {
      return errorRes(res, 400, "username is required");
    }

    if (!isValidUsername(username)) {
      return successRes(res, 200, "Username is unavailable", {
        available: false,
        username,
        reason:
          "Username must be 3 to 20 characters and use only letters, numbers, or underscores",
      });
    }

    const existingUser = await User.exists({ username });

    return successRes(
      res,
      200,
      existingUser ? "Username is unavailable" : "Username is available",
      {
        available: !existingUser,
        username,
        reason: existingUser ? "Username already exists" : "",
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check username";
    return errorRes(res, 500, message);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return errorRes(res, 400, "email is required");
    }

    const user = await User.findOne({ email });
    const providers = Array.isArray(user?.authProvider)
      ? user.authProvider
      : user?.authProvider
        ? [user.authProvider]
        : [];

    if (!user || !providers.includes("local")) {
      return successRes(
        res,
        200,
        "If that email is registered, a reset link has been sent.",
        {
          emailSent: true,
        },
      );
    }

    const resetToken = buildTokenWithExpiry(1);
    user.passwordResetTokenHash = resetToken.tokenHash;
    user.passwordResetExpiresAt = resetToken.expiresAt;
    await user.save();

    const delivery = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken.rawToken,
    );

    return successRes(
      res,
      200,
      "A reset link has been sent.",
      {
        emailSent: delivery.delivered,
        resetUrl:
          process.env.NODE_ENV !== "production" ? delivery.resetUrl : undefined,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to request password reset";
    return errorRes(res, 500, message);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!token || !password) {
      return errorRes(res, 400, "token and password are required");
    }

    if (password.length < 6) {
      return errorRes(res, 400, "Password must be at least 6 characters long");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    const providers = Array.isArray(user?.authProvider)
      ? user.authProvider
      : user?.authProvider
        ? [user.authProvider]
        : [];

    if (!user || !providers.includes("local")) {
      return errorRes(res, 400, "Invalid or expired reset link");
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    await sendPasswordResetSuccessEmail(user.email, user.name);

    return successRes(res, 200, "Password reset successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password";
    return errorRes(res, 500, message);
  }
};

export const logout = async (_req, res) => {
  clearAuthCookie(res);

  return successRes(res, 200, "Logged out successfully");
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return errorRes(res, 401, "Unauthorized");
    }

    const payload = verifyAuthToken(token);
    if (!payload?.userId) {
      clearAuthCookie(res);
      return errorRes(res, 401, "Invalid token");
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      clearAuthCookie(res);
      return errorRes(res, 401, "User not found");
    }

    return successRes(res, 200, "Current user fetched successfully", {
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch current user";
    return errorRes(res, 500, message);
  }
};
