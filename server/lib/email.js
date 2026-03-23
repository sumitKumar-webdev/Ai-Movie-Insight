import { Resend } from "resend";

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

function buildEmailLayout({ eyebrow, title, greeting, message, ctaLabel, ctaUrl }) {
  const html = `
    <div style="margin:0;padding:32px 16px;background:#050816;font-family:Arial,sans-serif;color:#dbe7f5;">
      <div style="max-width:560px;margin:0 auto;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(180deg,#111827 0%,#0b1220 100%);box-shadow:0 24px 70px rgba(0,0,0,0.35);">
        <div style="padding:32px 32px 12px;background:radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 58%);">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#7dd3fc;">${eyebrow}</p>
          <h1 style="margin:0;font-size:30px;line-height:1.15;color:#ffffff;">${title}</h1>
        </div>
        <div style="padding:8px 32px 32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#dbe7f5;">${greeting}</p>
          <div style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#b9c6d8;">
            ${message}
          </div>
          ${
            ctaLabel && ctaUrl
              ? `<a href="${ctaUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#ffffff;color:#0b1220;text-decoration:none;font-weight:700;">${ctaLabel}</a>`
              : ""
          }
        </div>
      </div>
    </div>
  `.trim();

  const text = [greeting, message.replace(/<[^>]+>/g, " "), ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : ""]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
}

function getTemplatePayload(template, { name, message, token } = {}) {
  switch (template) {
    case "verification": {
      const verificationUrl = `${serverPublicUrl}/api/auth/verify-email?token=${encodeURIComponent(token ?? "")}`;
      return {
        subject: "Verify your email",
        verificationUrl,
        ...buildEmailLayout({
          eyebrow: "Sign Up",
          title: "Verify your account",
          greeting: `Hi ${name},`,
          message:
            message ||
            "Thanks for creating your account. Verify your email to activate your profile and start using Movie Insight.",
          ctaLabel: "Verify email",
          ctaUrl: verificationUrl,
        }),
      };
    }
    case "welcome": {
      return {
        subject: "Welcome to Movie Insight",
        ...buildEmailLayout({
          eyebrow: "Welcome",
          title: "Your account is ready",
          greeting: `Hi ${name},`,
          message:
            message ||
            "Welcome aboard. Your Movie Insight account has been created successfully.",
        }),
      };
    }
    case "password-reset": {
      const resetUrl = `${clientPublicUrl}/auth/forgot-password?token=${encodeURIComponent(token ?? "")}`;
      return {
        subject: "Reset your password",
        resetUrl,
        ...buildEmailLayout({
          eyebrow: "Password Help",
          title: "Reset your password",
          greeting: `Hi ${name},`,
          message:
            message ||
            "We received a request to reset your password. Use the button below to choose a new one.",
          ctaLabel: "Reset password",
          ctaUrl: resetUrl,
        }),
      };
    }
    case "password-reset-success": {
      return {
        subject: "Your password was reset successfully",
        ...buildEmailLayout({
          eyebrow: "Security Update",
          title: "Password updated",
          greeting: `Hi ${name},`,
          message:
            message ||
            "Your password was changed successfully. If this was not you, please contact support and secure your account immediately.",
        }),
      };
    }
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

export async function sendTemplateEmail(email, name, message, template, options = {}) {
  const resend = getResendClient();
  const payload = getTemplatePayload(template, {
    name,
    message,
    token: options.token,
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
