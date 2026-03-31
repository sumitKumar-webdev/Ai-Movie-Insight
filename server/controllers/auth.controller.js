import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  genJti,
  getAccessCookieOptions,
  getAccessToken,
  getRefreshCookieOptions,
  getRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/auth.js";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../lib/email.js";
import { isValidUsername, sanitizeUser } from "../lib/user-profile.js";
import { errorRes, successRes } from "../lib/res.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const isDevelopment = process.env.NODE_ENV === "development";
const clientPublicUrl = (
  process.env.CLIENT_PUBLIC_URL ||
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3000"
).replace(/\/+$/, "");

function normalizePreferenceList(value, limit = 8) {
  const items = Array.isArray(value) ? value : [];
  const seen = new Set();

  return items
    .map((item) => String(item ?? "").trim())
    .filter((item) => {
      if (!item) {
        return false;
      }

      const normalized = item.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .slice(0, limit);
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

function buildAuthSession(user) {
  const jti = genJti();
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken({
      userId: String(user._id),
      email: user.email,
    }),
    refreshToken: signRefreshToken({ userId: String(user._id), jti }),
  };
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    ...getAccessCookieOptions(),
    maxAge: undefined,
  });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
}

function buildEmailVerificationRedirectUrl(status, message) {
  const redirectUrl = new URL("/auth/login", clientPublicUrl);
  redirectUrl.searchParams.set("emailVerification", status);

  if (message) {
    redirectUrl.searchParams.set("message", message);
  }

  return redirectUrl.toString();
}

export const register = async (req, res) => {
  try {
    const { name, email, username, password } = req.body ?? {}

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

    if (password.length < 6) return errorRes(res, 400, "Password must be at least 6 characters long");

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existingUser?.email === email) return errorRes(res, 409, "An account with this email already exists");
    if (existingUser?.username === username) return errorRes(res, 409, "This username is already taken");

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

        if (!delivery.delivered && !isDevelopment) {
          throw new Error("Verification email could not be sent. Please try again later.");
        }
      });
    } finally {
      await session.endSession();
    }
    return successRes(res, 201, "Verification email sent", {
      user: sanitizeUser(user),
      requiresVerification: true,
      emailSent: delivery.delivered,
      verificationUrl: isDevelopment ? delivery.verificationUrl : undefined,
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

    const session = buildAuthSession(user);
    res.cookie(ACCESS_COOKIE_NAME, session.accessToken, getAccessCookieOptions());
    res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshCookieOptions());

    return successRes(res, 200, "Login successful", {
      ...session,
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
    let createdWithGoogle = false;
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
      createdWithGoogle = true;
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

    if (createdWithGoogle) {
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Unknown welcome email error";
        console.error(`[email:welcome] Failed after Google signup for ${user.email}: ${reason}`);
      }
    }

    const session = buildAuthSession(user);
    res.cookie(ACCESS_COOKIE_NAME, session.accessToken, getAccessCookieOptions());
    res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshCookieOptions());

    return successRes(res, 200, "Google authentication successful", {
      ...session,
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
      return res.redirect(
        302,
        buildEmailVerificationRedirectUrl("error", "Verification token is required"),
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(
        302,
        buildEmailVerificationRedirectUrl("error", "Invalid or expired verification link"),
      );
    }

    user.emailVerified = true;
    user.isactive = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();
    await sendWelcomeEmail(user.email, user.name);

    return res.redirect(
      302,
      buildEmailVerificationRedirectUrl("success", "Email verified successfully. You can log in now."),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify email";
    return res.redirect(302, buildEmailVerificationRedirectUrl("error", message));
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

    if (!delivery.delivered && !isDevelopment) {
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
        verificationUrl: isDevelopment ? delivery.verificationUrl : undefined,
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
        resetUrl: isDevelopment ? delivery.resetUrl : undefined,
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

export const refreshSession = async (req, res) => {
  try {
    const token =
      getRefreshToken(req) ||
      (typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : "");
    if (!token) {
      return errorRes(res, 401, "Unauthorized");
    }

    const payload = verifyRefreshToken(token);
    if (!payload?.userId) {
      clearAuthCookies(res);
      return errorRes(res, 401, "Invalid refresh token");
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      clearAuthCookies(res);
      return errorRes(res, 401, "User not found");
    }

    const session = buildAuthSession(user);
    res.cookie(ACCESS_COOKIE_NAME, session.accessToken, getAccessCookieOptions());
    res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshCookieOptions());

    return successRes(res, 200, "Session refreshed", {
      ...session,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh session";
    return errorRes(res, 500, message);
  }
};

export const logout = async (_req, res) => {
  clearAuthCookies(res);

  return successRes(res, 200, "Logged out successfully");
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = getAccessToken(req);
    if (!token) {
      return errorRes(res, 401, "Unauthorized");
    }

    const payload = verifyAccessToken(token);
    if (!payload?.userId) {
      return errorRes(res, 401, "Invalid token");
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      clearAuthCookies(res);
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

export const updatePreferences = async (req, res) => {
  try {
    const user = req.user ? await User.findById(req.user._id) : null;
    if (!user) {
      return errorRes(res, 401, "Unauthorized");
    }

    user.preferences = {
      cinemas: normalizePreferenceList(req.body?.cinemas, 8),
      genres: normalizePreferenceList(req.body?.genres, 12),
      languages: normalizePreferenceList(req.body?.languages, 10),
      moods: normalizePreferenceList(req.body?.moods, 10),
      formats: normalizePreferenceList(req.body?.formats, 8),
      onboardingCompleted: true,
    };

    await user.save();

    return successRes(res, 200, "Preferences saved successfully", {
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save preferences";
    return errorRes(res, 500, message);
  }
};
