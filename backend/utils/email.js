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
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:56px;height:56px;border-radius:16px;overflow:hidden;background:#ffffff;"><tr><td align="center" valign="middle" style="padding:0;margin:0;width:56px;height:56px;line-height:0;"><img src="${logoUrl}" alt="${appName} logo" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:16px;object-fit:cover;border:0;line-height:0;text-decoration:none;" /></td></tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:56px;height:56px;border-radius:16px;background:${accent};"><tr><td align="center" valign="middle" style="padding:0;margin:0;width:56px;height:56px;"><span style="display:block;font:700 18px/1 Arial, sans-serif;color:#fff;">${brandText}</span></td></tr></table>`;

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
                      <td align="center" valign="middle" style="vertical-align:middle;width:72px;padding:0 0 0 0;text-align:center;line-height:0;">${brandBlock}</td>
                      <td style="vertical-align:middle;padding-left:16px;">
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
  try {
    const info = await tx.sendMail({ from, to, subject, text, html });
    console.log(`[Mail] Sent to ${to} id=${info && info.messageId ? info.messageId : 'unknown'}`);
    return info;
  } catch (err) {
    console.error('[Mail] sendMail error:', err && err.message ? err.message : err);
    throw err;
  }
}

async function sendOtpEmail({ to, otp, expiresMinutes, name }) {
  const { appName } = getAppMeta();
  const subject = "Password Reset OTP";
  const recipientName = String(name || "there").trim() || "there";
  const text = [
    `Dear ${recipientName},`,
    "",
    `Your ${appName} password reset OTP is:`,
    "",
    `**${otp}**`,
    "",
    `This OTP is valid for **${expiresMinutes} minutes**.`,
    "",
    "If you did not request a password reset, please ignore this email.",
    "",
    "Regards,",
    `${appName} Team`,
  ].join("\n");

  const html = renderEmailShell({
    title: `${appName} Password Reset OTP`,
    heading: "Password Reset OTP",
    childrenHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
        Dear <strong>${recipientName}</strong>,
      </p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#374151;">
        Your ${appName} password reset OTP is:
      </p>
      <div style="margin:20px 0 22px;padding:26px 18px;border:1px solid #d8c6c6;border-radius:22px;background:#fff7f7;text-align:center;">
        <div style="font-size:48px;font-weight:800;letter-spacing:0.28em;color:#7f1d1d;">${otp}</div>
      </div>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#374151;">
        This OTP is valid for <strong>${expiresMinutes} minutes</strong>.
      </p>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#374151;">
        If you did not request a password reset, please ignore this email.
      </p>
      <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#374151;">
        Regards,<br />
        ${appName} Team
      </p>
    `,
  });

  await sendMail({ to, subject, text, html });
}

async function sendVerificationEmail({ to, token, expiresMinutes, name }) {
  const { appName } = getAppMeta();
  const subject = `${appName} email verification`;
  const recipientName = String(name || "there").trim() || "there";
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;
  const text = [
    `Hello ${recipientName},`,
    "",
    "Please verify your email address by visiting the link below:",
    verificationUrl,
    "",
    `This link expires in ${expiresMinutes} minutes.`,
    "",
    "If you did not create an account, you can ignore this email.",
  ].join("\n");

  const html = renderEmailShell({
    title: `${appName} email verification`,
    heading: "Verify your email",
    childrenHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
        Hello <strong>${recipientName}</strong>,
      </p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#374151;">
        Please verify your email address by clicking the button below.
      </p>
      <div style="margin:22px 0 18px;">
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#7f1d1d;color:#fff;text-decoration:none;font-weight:700;">Verify email</a>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
        This link expires in <strong>${expiresMinutes} minutes</strong>.
      </p>
    `,
    accent: "#7f1d1d",
  });

  await sendMail({ to, subject, text, html });
}

async function sendPasswordChangedEmail({ to }) {
  const { appName } = getAppMeta();
  const subject = "Password Changed Successfully";
  const text = [
    `Dear ${appName} user,`,
    "",
    `Your ${appName} account password has been changed successfully.`,
    "",
    "If you made this change, no action is required.",
    "",
    "If you did not change your password, please contact support immediately.",
    "",
    "Regards,",
    `${appName} Team`,
  ].join("\n");

  const html = renderEmailShell({
    title: "Password Changed Successfully",
    heading: "Password changed successfully",
    childrenHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
        Dear <strong>${appName} user</strong>,
      </p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#374151;">
        Your ${appName} account password has been changed successfully.
      </p>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#374151;">
        If you made this change, no action is required.
      </p>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#374151;">
        If you did not change your password, please contact support immediately.
      </p>
      <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#374151;">
        Regards,<br />
        ${appName} Team
      </p>
    `,
    accent: "#166534",
  });

  await sendMail({ to, subject, text, html });
}

module.exports = {
  sendMail,
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordChangedEmail,
};
