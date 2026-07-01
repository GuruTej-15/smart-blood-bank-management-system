const crypto = require("crypto");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashValue(value) {
  const pepper = String(process.env.SECURITY_PEPPER || process.env.JWT_SECRET || "");
  return crypto.createHash("sha256").update(`${String(value)}:${pepper}`).digest("hex");
}

function generateNumericOtp(length = 6) {
  let otp = "";
  while (otp.length < length) {
    otp += String(crypto.randomInt(0, 10));
  }
  return otp;
}

function generateInviteCode(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex").toUpperCase();
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password || ""));
}

module.exports = {
  normalizeEmail,
  hashValue,
  generateNumericOtp,
  generateInviteCode,
  isStrongPassword,
};
