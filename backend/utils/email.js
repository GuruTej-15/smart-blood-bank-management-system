const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = String(process.env.SMTP_SERVICE || "").trim().toLowerCase();

  if (!user || !pass || (!host && service !== "gmail")) {
    return null;
  }

  const transportOptions = service === "gmail"
    ? {
        service: "gmail",
        auth: { user, pass },
      }
    : {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      };

  transporter = nodemailer.createTransport(transportOptions);

  return transporter;
}

function getAppMeta() {
  return {
    appName: process.env.APP_NAME || "Smart Blood Bank",
    supportEmail: process.env.APP_SUPPORT_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || "support@example.com",
    logoUrl: String(process.env.APP_LOGO_URL || "").trim(),
  };
}

function renderEmailShell({ title, heading, childrenHtml, accent = "#b91c1c" }) {
  const { appName, supportEmail, logoUrl } = getAppMeta();
  const brandText = appName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  const brandBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${appName} logo" style="display:block;width:56px;height:56px;border-radius:16px;object-fit:cover;">`
    : `<div style="width:56px;height:56px;border-radius:16px;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font:700 18px/1 Arial, sans-serif;">${brandText}</div>`;

  return `
  <html>
    <body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${title}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e7e2d8;border-radius:24px;overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#7f1d1d 0%,#b91c1c 55%,#ef4444 100%);padding:28px 32px;color:#fff;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                    <tr>
                      <td style="vertical-align:middle;width:72px;">${brandBlock}</td>
                      <td style="vertical-align:middle;">
                        <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.88;">${appName}</div>
                        <div style="font-size:26px;line-height:1.2;font-weight:700;margin-top:6px;">${heading}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  ${childrenHtml}
                  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #ece7df;color:#6b7280;font-size:13px;line-height:1.7;">
                    If you need help, contact <a href="mailto:${supportEmail}" style="color:${accent};text-decoration:none;">${supportEmail}</a>.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.");
    }
    console.log(`[Mail:dev] To:${to} Subject:${subject}\n${text}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await tx.sendMail({ from, to, subject, text, html });
}

async function sendOtpEmail({ to, otp, expiresMinutes, name }) {
  const { appName } = getAppMeta();
  const subject = "Password Reset OTP";
  const recipientName = String(name || "there").trim() || "there";
  const text = [
    `Hello ${recipientName},`,
    "",
    "Your OTP is:",
    "",
    otp,
    "",
    `This OTP is valid for ${expiresMinutes} minutes.`,
    "",
    "If you didn't request this, ignore this email.",
  ].join("\n");

  const html = renderEmailShell({
    title: `${appName} Password Reset OTP`,
    heading: "Password Reset OTP",
    childrenHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
        Hello <strong>${recipientName}</strong>,
      </p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#374151;">Your OTP is:</p>
      <div style="margin:20px 0 22px;padding:26px 18px;border:1px solid #d8c6c6;border-radius:22px;background:#fff7f7;text-align:center;">
        <div style="font-size:48px;font-weight:800;letter-spacing:0.28em;color:#7f1d1d;">${otp}</div>
      </div>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#374151;">
        This OTP is valid for <strong>${expiresMinutes} minutes</strong>.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
        If you didn't request this, ignore this email.
      </p>
    `,
  });

  await sendMail({ to, subject, text, html });
}

async function sendPasswordChangedEmail({ to }) {
  const { appName } = getAppMeta();
  const subject = `${appName} password changed successfully`;
  const text = [
    "Your password has been successfully changed.",
    "If this was not you, please contact support immediately and secure your account.",
  ].join("\n");

  const html = renderEmailShell({
    title: `${appName} password changed`,
    heading: "Password changed successfully",
    childrenHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
        Your password has been successfully changed.
      </p>
      <div style="padding:20px 22px;border-radius:18px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:15px;line-height:1.7;">
        If this action was not performed by you, contact support immediately and review your account security.
      </div>
    `,
    accent: "#166534",
  });

  await sendMail({ to, subject, text, html });
}

module.exports = {
  sendOtpEmail,
  sendPasswordChangedEmail,
};
