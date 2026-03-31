import { Resend } from "resend";
import { getTemplatePayload } from "./email-templates/index.js";

function normalizeEnv(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.replace(/^['"]|['"]$/g, "");
}

const resendApiKey =
  normalizeEnv(process.env.EMAIL_API_KEY) ||
  normalizeEnv(process.env.emailAPIkey) ||
  normalizeEnv(process.env.RESEND_API_KEY);
const mailFrom = normalizeEnv(process.env.MAIL_FROM) || "onboarding@resend.dev";
const serverPublicUrl = process.env.SERVER_PUBLIC_URL || "http://localhost:5000";
const clientPublicUrl =
  process.env.CLIENT_PUBLIC_URL ||
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3000";

function getResendClient() {
  if (!resendApiKey) {
    return null;
  }

  return new Resend(resendApiKey);
}

export async function sendTemplateEmail(email, name, message, template, options = {}) {
  const resend = getResendClient();
  const payload = getTemplatePayload(template, {
    name,
    message,
    token: options.token,
    serverPublicUrl,
    clientPublicUrl,
    meta: options.meta,
  });

  if (!resend) {
    console.log(`[email:${template}] Resend not configured for ${email}`);
    if (payload.verificationUrl) {
      console.log(`Verification link for ${email}: ${payload.verificationUrl}`);
    }
    if (payload.resetUrl) {
      console.log(`Reset link for ${email}: ${payload.resetUrl}`);
    }

    return {
      delivered: false,
      verificationUrl: payload.verificationUrl,
      resetUrl: payload.resetUrl,
    };
  }

  try {
    const response = await resend.emails.send({
      from: mailFrom,
      to: email,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (response?.error) {
      throw new Error(response.error.message || "Resend email delivery failed");
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown email delivery error";
    console.error(`[email:${template}] Failed to send email to ${email}: ${reason}`);

    return {
      delivered: false,
      verificationUrl: payload.verificationUrl,
      resetUrl: payload.resetUrl,
      error: reason,
    };
  }

  return {
    delivered: true,
    verificationUrl: payload.verificationUrl,
    resetUrl: payload.resetUrl,
  };
}

export async function sendVerificationEmail(email, name, token) {
  return sendTemplateEmail(
    email,
    name,
    "Thanks for creating your account. Verify your email to activate your profile and start using Movie Insight.",
    "verification",
    { token },
  );
}

export async function sendWelcomeEmail(email, name) {
  return sendTemplateEmail(
    email,
    name,
    "Welcome aboard. Your Movie Insight account has been created successfully.",
    "welcome",
  );
}

export async function sendPasswordResetEmail(email, name, token) {
  return sendTemplateEmail(
    email,
    name,
    "We received a request to reset your password. Use the button below to choose a new one.",
    "password-reset",
    { token },
  );
}

export async function sendPasswordResetSuccessEmail(email, name) {
  return sendTemplateEmail(
    email,
    name,
    "Your password was changed successfully. If this was not you, please secure your account immediately.",
    "password-reset-success",
  );
}

export async function sendUsernameChangedEmail(email, name, meta) {
  return sendTemplateEmail(
    email,
    name,
    "Your username was changed successfully. If this was not you, please have a look at your account activity and secure your account.",
    "username-changed",
    { meta },
  );
}
