function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailLayout({
  eyebrow,
  title,
  subtitle,
  greeting,
  message,
  ctaLabel,
  ctaUrl,
  linkLabel,
  linkValue,
  note,
  secondaryBlock,
}) {
  const safeGreeting = escapeHtml(greeting);
  const safeLinkValue = escapeHtml(linkValue);
  const safeLinkLabel = escapeHtml(linkLabel);
  const safeNote = note ? escapeHtml(note) : "";
  const normalizedMessage = Array.isArray(message) ? message : [message];
  const messageHtml = normalizedMessage
    .filter(Boolean)
    .map(
      (item) =>
        `<p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#cbd5e1;">${item}</p>`,
    )
    .join("");

  const html = `
    <div style="margin:0;padding:32px 16px;background:#000000;font-family:Arial,sans-serif;color:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #1f2937;background:#0a0a0a;box-shadow:0 24px 80px rgba(0,0,0,0.45);">
        <div style="padding:26px 32px;border-bottom:1px solid #1f2937;background:#000000;">
          <div style="font-size:26px;line-height:1;font-weight:700;letter-spacing:0.12em;">
            <span style="color:#f8fafc;">CINE</span><span style="color:#06b6d4;">AI</span>
          </div>
          <p style="margin:6px 0 0;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#64748b;">
            Film &amp; Series Insights
          </p>
        </div>
        <div style="padding:36px 32px 28px;background:#111111;border-bottom:1px solid #1f2937;">
          <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#06b6d4;">
            ${escapeHtml(eyebrow)}
          </p>
          <h1 style="margin:0 0 12px;font-size:34px;line-height:1.02;color:#ffffff;font-weight:800;">
            ${escapeHtml(title)}
          </h1>
          <p style="margin:0;max-width:390px;font-size:13px;line-height:1.8;color:#94a3b8;">
            ${escapeHtml(subtitle)}
          </p>
        </div>
        <div style="padding:30px 32px 32px;background:#0a0a0a;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#ffffff;">${safeGreeting}</p>
          <div style="margin:0 0 22px;">
            ${messageHtml}
          </div>
          ${
            ctaLabel && ctaUrl
              ? `
                <div style="margin:24px 0;text-align:center;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:14px 30px;border-radius:999px;background:#06b6d4;color:#03141a;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">
                    ${escapeHtml(ctaLabel)}
                  </a>
                </div>
              `
              : ""
          }
          ${
            linkValue
              ? `
                <p style="margin:0 0 8px;font-size:11px;line-height:1.6;color:#64748b;text-align:center;">
                  ${safeLinkLabel}
                </p>
                <div style="margin:0 0 22px;padding:12px 14px;border:1px solid #1f2937;border-radius:8px;background:#111111;color:#94a3b8;font-size:11px;line-height:1.6;font-family:'Courier New',monospace;word-break:break-all;">
                  ${safeLinkValue}
                </div>
              `
              : ""
          }
          ${
            secondaryBlock
              ? `<div style="margin:0 0 22px;padding:18px;border:1px solid #1f2937;border-top:2px solid #06b6d4;border-radius:10px;background:#111111;">${secondaryBlock}</div>`
              : ""
          }
          ${
            note
              ? `<div style="padding:14px 16px;border:1px solid #1f2937;border-radius:8px;background:#111111;font-size:12px;line-height:1.7;color:#94a3b8;">${safeNote}</div>`
              : ""
          }
        </div>
        <div style="padding:18px 32px;border-top:1px solid #1f2937;background:#000000;text-align:center;">
          <div style="margin:0 0 8px;font-size:15px;letter-spacing:0.12em;font-weight:700;color:#64748b;">
            CINE<span style="color:#06b6d4;">AI</span>
          </div>
          <p style="margin:0;font-size:11px;line-height:1.6;color:#475569;">
            This is an automated email from CineAI.
          </p>
        </div>
      </div>
    </div>
  `.trim();

  const text = [
    greeting,
    ...normalizedMessage.map((item) => String(item).replace(/<[^>]+>/g, " ")),
    ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : "",
    linkValue ? `${linkLabel || "Open this link"}: ${linkValue}` : "",
    note || "",
  ].filter(Boolean)
    .join("\n\n");

  return { html, text };
}

export function getTemplatePayload(template, { name, message, token, serverPublicUrl, clientPublicUrl } = {}) {
  switch (template) {
    case "verification": {
      const verificationUrl = `${serverPublicUrl}/api/auth/verify-email?token=${encodeURIComponent(token ?? "")}`;
      return {
        subject: "Verify your email",
        verificationUrl,
        ...buildEmailLayout({
          eyebrow: "Account Security",
          title: "Verify Your Account",
          subtitle: "Confirm your email to activate your CineAI account and start exploring AI-powered movie insights.",
          greeting: `Hi ${name},`,
          message:
            message || [
              "Thanks for signing up for CineAI.",
              "Use the button below to verify your email address. This verification link stays valid for 24 hours.",
            ],
          ctaLabel: "Verify Email",
          ctaUrl: verificationUrl,
          linkLabel: "Or paste this link into your browser:",
          linkValue: verificationUrl,
          note: "If you did not create a CineAI account, you can safely ignore this email.",
        }),
      };
    }
    case "welcome": {
      return {
        subject: "Welcome to CineAI",
        ...buildEmailLayout({
          eyebrow: "Welcome",
          title: "The Screening Room Is Yours",
          subtitle: "Your account is live. Discover films, track favorites, and unlock AI-guided recommendations.",
          greeting: `Hi ${name},`,
          message:
            message || [
              "Welcome aboard. Your CineAI account is ready.",
              "Start discovering films, reading insights, and building a watchlist that feels personal to you.",
            ],
          ctaLabel: "Start Exploring",
          ctaUrl: clientPublicUrl,
          secondaryBlock: `
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#06b6d4;">Inside CineAI</p>
            <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#f8fafc;">Smart discovery, curated movie insights, ratings, reviews, and your personal watchlist.</p>
            <p style="margin:0;font-size:12px;line-height:1.7;color:#94a3b8;">Signed in as <span style="color:#ffffff;">${escapeHtml(name)}</span></p>
          `,
        }),
      };
    }
    case "password-reset": {
      const resetUrl = `${clientPublicUrl}/auth/forgot-password?token=${encodeURIComponent(token ?? "")}`;
      return {
        subject: "Reset your password",
        resetUrl,
        ...buildEmailLayout({
          eyebrow: "Password Reset",
          title: "Reset Your Password",
          subtitle: "Use the secure link below to choose a new password and get back into your CineAI account.",
          greeting: `Hi ${name},`,
          message:
            message || [
              "We received a request to reset the password for your CineAI account.",
              "This reset link expires in 60 minutes for your security.",
            ],
          ctaLabel: "Reset Password",
          ctaUrl: resetUrl,
          linkLabel: "Or copy this link into your browser:",
          linkValue: resetUrl,
          note: "If you did not request a password reset, you can ignore this email and your password will remain unchanged.",
        }),
      };
    }
    case "password-reset-success": {
      return {
        subject: "Your password was reset successfully",
        ...buildEmailLayout({
          eyebrow: "Security Update",
          title: "Password Updated",
          subtitle: "Your CineAI account password was changed successfully.",
          greeting: `Hi ${name},`,
          message:
            message || [
              "Your password was changed successfully.",
              "If this was not you, secure your account immediately and contact support.",
            ],
          note: "If you did not make this change, please reset your password again right away.",
        }),
      };
    }
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}
