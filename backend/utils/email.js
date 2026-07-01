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

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendOtpEmail({ to, otp, expiresMinutes }) {
  const tx = getTransporter();
  if (!tx) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "Smart Blood Bank";
  const subject = `${appName} password reset OTP`;
  const text = [
    `Your OTP is: ${otp}`,
    `This OTP expires in ${expiresMinutes} minute(s).`,
    "If you did not request this, please ignore this email.",
  ].join("\n");

  await tx.sendMail({
    from,
    to,
    subject,
    text,
  });
}

module.exports = {
  sendOtpEmail,
};
