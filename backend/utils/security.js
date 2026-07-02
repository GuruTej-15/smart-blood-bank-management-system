const crypto = require("crypto");

const TEMP_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "guerrillamail.com",
  "yopmail.com",
  "maildrop.cc",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
]);

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "qwerty123",
  "welcome123",
  "changeme",
  "letmein",
  "admin123",
  "abc123",
  "12345678",
  "password1",
  "qwerty",
  "iloveyou",
]);

function sanitizeInput(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value).trim();
  const withoutScriptBlocks = raw.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const withoutTags = withoutScriptBlocks.replace(/<[^>]*>/g, " ");
  const withoutJs = withoutTags.replace(/javascript\s*:/gi, " ").replace(/on\w+\s*=\s*("[^"]*"|'[^']*')/gi, " ");
  const withoutControlChars = withoutJs.replace(/[\u0000-\u001F\u007F]/g, " ");
  return withoutControlChars.replace(/\s+/g, " ").trim();
}

function normalizeEmail(email) {
  return sanitizeInput(email).toLowerCase();
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

function validateFullName(name) {
  const sanitizedName = sanitizeInput(name);
  if (!sanitizedName) {
    return "Name is required";
  }
  if (sanitizedName.length < 2 || sanitizedName.length > 80) {
    return "Name must be between 2 and 80 characters";
  }
  if (!/^[A-Za-z ]+$/.test(sanitizedName)) {
    return "Name can only contain letters and spaces";
  }
  return null;
}

function validateEmailAddress(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(normalizedEmail)) {
    return "Please provide a valid email address";
  }
  if (normalizedEmail.length > 254) {
    return "Email address is too long";
  }
  const [localPart, domain] = normalizedEmail.split("@");
  if (!localPart || localPart.length > 64) {
    return "Invalid email address";
  }
  if (!/^[a-zA-Z0-9._%-]+$/.test(localPart)) {
    return "Email address contains invalid characters";
  }
  if (domain.toLowerCase().includes("..")) {
    return "Invalid email domain";
  }

  if (TEMP_EMAIL_DOMAINS.has(domain)) {
    return "Temporary or invalid email domains are not allowed";
  }
  return null;
}

function validatePassword(password) {
  const sanitizedPassword = sanitizeInput(password);
  if (!sanitizedPassword) {
    return "Password is required";
  }
  if (sanitizedPassword.length < 8) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(sanitizedPassword)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";
  }
  if (COMMON_PASSWORDS.has(sanitizedPassword.toLowerCase())) {
    return "Password is too common. Choose a stronger password";
  }
  return null;
}

function validatePhoneNumber(phone) {
  const sanitizedPhone = sanitizeInput(phone);
  if (!sanitizedPhone) {
    return "Phone number is required";
  }
  const cleanPhone = sanitizedPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length !== 10) {
    return "Phone number must be exactly 10 digits";
  }
  if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
    return "Phone number must be a valid Indian mobile number (starting with 6-9)";
  }
  return null;
}

function validateHospitalName(name) {
  const sanitizedName = sanitizeInput(name);
  if (!sanitizedName) {
    return "Hospital name is required";
  }
  if (sanitizedName.length < 3 || sanitizedName.length > 100) {
    return "Hospital name must be between 3 and 100 characters";
  }
  return null;
}

function validateContactNumber(contact) {
  const sanitizedContact = sanitizeInput(contact);
  if (!sanitizedContact) {
    return "Contact number is required";
  }
  const cleanContact = sanitizedContact.replace(/[^0-9+]/g, "");
  if (cleanContact.length < 8 || cleanContact.length > 15) {
    return "Contact number must be between 8 and 15 digits";
  }
  if (!/^\+?[0-9]{8,15}$/.test(cleanContact)) {
    return "Contact number must contain only digits";
  }
  return null;
}

function validateRole(role) {
  const normalizedRole = sanitizeInput(role).toLowerCase();
  if (!normalizedRole) {
    return "Role is required";
  }
  if (!["admin", "hospital", "donor"].includes(normalizedRole)) {
    return "Invalid role";
  }
  return null;
}

function isStrongPassword(password) {
  return validatePassword(password) === null;
}

function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = {
  sanitizeInput,
  normalizeEmail,
  hashValue,
  generateNumericOtp,
  generateInviteCode,
  validateFullName,
  validateEmailAddress,
  validatePassword,
  validatePhoneNumber,
  validateHospitalName,
  validateContactNumber,
  validateRole,
  isStrongPassword,
  generateSecureToken,
};
