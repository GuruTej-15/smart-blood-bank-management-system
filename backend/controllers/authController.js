const User = require("../models/User");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const PasswordResetOtp = require("../models/PasswordResetOtp");
const AdminInviteCode = require("../models/AdminInviteCode");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail } = require("../utils/email");
const {
  normalizeEmail,
  hashValue,
  generateNumericOtp,
  generateInviteCode,
  isStrongPassword,
} = require("../utils/security");
const { OAuth2Client } = require("google-auth-library");
const { BLOOD_GROUPS } = require("../utils/constants");

const ALLOWED_ROLES = ["admin", "hospital", "donor"];

let googleClient;

function validateCommonFields({ name, email, password }) {
  if (!name || !email || !password) {
    return "name, email and password are required";
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Please provide a valid email address";
  }
  if (!isStrongPassword(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, and a number";
  }
  return null;
}

function getGoogleClient() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return null;
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

function roleFor(inputRole) {
  return ALLOWED_ROLES.includes(inputRole) ? inputRole : "donor";
}

function validateRoleFields(role, body) {
  if (role === "donor") {
    if (!body.bloodGroup || !BLOOD_GROUPS.includes(body.bloodGroup)) {
      return "A valid bloodGroup is required for donor registration";
    }
    if (!body.phone) {
      return "phone is required for donor registration";
    }
  }

  if (role === "hospital") {
    const { hospitalName, contactNumber } = body;
    if (!hospitalName || !contactNumber) {
      return "hospitalName and contactNumber are required for hospital registration";
    }
  }

  return null;
}

async function validateAdminInviteOrBootstrap(adminCodeInput) {
  const adminCode = String(adminCodeInput || "").trim();
  if (!adminCode) {
    return { error: "Admin invite code is required" };
  }

  const adminCount = await User.countDocuments({ role: "admin" });
  const bootstrapCode = String(
    process.env.ADMIN_BOOTSTRAP_CODE || process.env.ADMIN_REGISTRATION_CODE || ""
  ).trim();

  if (adminCount === 0 && bootstrapCode && adminCode === bootstrapCode) {
    return { bootstrap: true };
  }

  const now = new Date();
  const invite = await AdminInviteCode.findOne({
    codeHash: hashValue(adminCode),
    usedAt: null,
    revokedAt: null,
    expiresAt: { $gt: now },
  });

  if (!invite) {
    return { error: "Invalid or expired admin invite code" };
  }

  return { invite };
}

function authResponse(user) {
  return {
    user: user.toSafeObject(),
    token: generateToken(user),
  };
}

async function createLinkedProfileForRole(role, payload) {
  let donorProfile = null;
  let hospitalProfile = null;

  if (role === "donor") {
    donorProfile = await Donor.create({
      name: payload.name,
      email: payload.email,
      phone: String(payload.phone).trim(),
      bloodGroup: payload.bloodGroup,
      address: payload.address || "",
      age: payload.age ? Number(payload.age) : undefined,
      isActive: true,
    });
  }

  if (role === "hospital") {
    hospitalProfile = await Hospital.create({
      hospitalName: String(payload.hospitalName).trim(),
      contactNumber: String(payload.contactNumber).trim(),
      email: payload.email,
      address: payload.address || "",
    });
  }

  return { donorProfile, hospitalProfile };
}

async function register(req, res) {
  const { name, email, password, role } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const selectedRole = roleFor(role);

  const commonValidationError = validateCommonFields({ name, email: normalizedEmail, password });
  if (commonValidationError) {
    return res.status(400).json({ message: commonValidationError });
  }

  const roleValidationError = validateRoleFields(selectedRole, req.body);
  if (roleValidationError) {
    return res.status(400).json({ message: roleValidationError });
  }

  let inviteValidation = null;
  if (selectedRole === "admin") {
    inviteValidation = await validateAdminInviteOrBootstrap(req.body.adminCode);
    if (inviteValidation.error) {
      return res.status(403).json({ message: inviteValidation.error });
    }
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: "An account with this email already exists" });

  let donorProfile = null;
  let hospitalProfile = null;

  try {
    ({ donorProfile, hospitalProfile } = await createLinkedProfileForRole(selectedRole, {
      ...req.body,
      name,
      email: normalizedEmail,
    }));

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      authProvider: "local",
      role: selectedRole,
      donor: donorProfile?._id,
      hospital: hospitalProfile?._id,
    });

    if (inviteValidation?.invite) {
      inviteValidation.invite.usedBy = user._id;
      inviteValidation.invite.usedAt = new Date();
      await inviteValidation.invite.save();
    }

    return res.status(201).json(authResponse(user));
  } catch (err) {
    if (donorProfile) await Donor.findByIdAndDelete(donorProfile._id);
    if (hospitalProfile) await Hospital.findByIdAndDelete(hospitalProfile._id);
    return res.status(500).json({ message: err.message || "Registration failed" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return res.status(401).json({ message: "Invalid email or password" });

  if (user.isLocked()) {
    return res.status(423).json({ message: "Account temporarily locked due to failed login attempts" });
  }

  if (user.authProvider === "google" && !user.password) {
    return res.status(400).json({ message: "This account uses Google sign-in. Continue with Google." });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    await user.recordFailedLogin();
    return res.status(401).json({ message: "Invalid email or password" });
  }

  await user.clearLoginFailures();

  res.json(authResponse(user));
}

async function forgotPasswordRequest(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "If the email exists, an OTP has been sent" });
  }

  const otpLength = Number(process.env.OTP_LENGTH) || 6;
  const otpExpiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
  const otp = generateNumericOtp(otpLength);

  await PasswordResetOtp.deleteMany({ email, consumedAt: null });
  await PasswordResetOtp.create({
    user: user._id,
    email,
    otpHash: hashValue(otp),
    expiresAt: new Date(Date.now() + otpExpiryMinutes * 60 * 1000),
  });

  await sendOtpEmail({ to: email, otp, expiresMinutes: otpExpiryMinutes });

  res.json({ message: "If the email exists, an OTP has been sent" });
}

async function resetPasswordWithOtp(req, res) {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "email, otp and newPassword are required" });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: "Password must be at least 8 characters and include uppercase, lowercase, and a number" });
  }

  const otpDoc = await PasswordResetOtp.findOne({
    email,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const maxOtpAttempts = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
  if ((otpDoc.attempts || 0) >= maxOtpAttempts) {
    return res.status(429).json({ message: "Too many invalid OTP attempts. Request a new OTP" });
  }

  if (otpDoc.otpHash !== hashValue(otp)) {
    otpDoc.attempts = (otpDoc.attempts || 0) + 1;
    await otpDoc.save();
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const user = await User.findOne({ _id: otpDoc.user, email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.password = newPassword;
  user.authProvider = user.googleId ? user.authProvider : "local";
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  otpDoc.consumedAt = new Date();
  await otpDoc.save();
  await PasswordResetOtp.deleteMany({ user: user._id, consumedAt: null });

  res.json(authResponse(user));
}

async function googleAuth(req, res) {
  const { idToken, role, adminCode } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: "idToken is required" });
  }

  const client = getGoogleClient();
  if (!client) {
    return res.status(503).json({ message: "Google auth is not configured" });
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    return res.status(400).json({ message: "Google account email is missing or unverified" });
  }

  const email = normalizeEmail(payload.email);
  const googleId = payload.sub;
  const selectedRole = roleFor(role);

  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    await user.clearLoginFailures();
    return res.json(authResponse(user));
  }

  const roleValidationError = validateRoleFields(selectedRole, req.body);
  if (roleValidationError) {
    return res.status(400).json({ message: roleValidationError });
  }

  let inviteValidation = null;
  if (selectedRole === "admin") {
    inviteValidation = await validateAdminInviteOrBootstrap(adminCode);
    if (inviteValidation.error) {
      return res.status(403).json({ message: inviteValidation.error });
    }
  }

  let donorProfile = null;
  let hospitalProfile = null;

  try {
    ({ donorProfile, hospitalProfile } = await createLinkedProfileForRole(selectedRole, {
      ...req.body,
      name: req.body.name || payload.name || "Google User",
      email,
    }));

    user = await User.create({
      name: req.body.name || payload.name || "Google User",
      email,
      authProvider: "google",
      googleId,
      role: selectedRole,
      donor: donorProfile?._id,
      hospital: hospitalProfile?._id,
    });

    if (inviteValidation?.invite) {
      inviteValidation.invite.usedBy = user._id;
      inviteValidation.invite.usedAt = new Date();
      await inviteValidation.invite.save();
    }

    return res.status(201).json(authResponse(user));
  } catch (err) {
    if (donorProfile) await Donor.findByIdAndDelete(donorProfile._id);
    if (hospitalProfile) await Hospital.findByIdAndDelete(hospitalProfile._id);
    return res.status(500).json({ message: err.message || "Google authentication failed" });
  }
}

async function createAdminInvite(req, res) {
  const expiresInHours = Math.max(1, Number(req.body.expiresInHours) || Number(process.env.ADMIN_INVITE_EXPIRES_HOURS) || 24);
  const inviteCode = generateInviteCode(12);
  const invite = await AdminInviteCode.create({
    codeHash: hashValue(inviteCode),
    createdBy: req.user._id,
    expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
  });

  res.status(201).json({
    code: inviteCode,
    expiresAt: invite.expiresAt,
  });
}

async function listAdminInvites(req, res) {
  const invites = await AdminInviteCode.find()
    .populate("createdBy", "name email")
    .populate("usedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    count: invites.length,
    invites: invites.map((invite) => ({
      id: invite._id,
      createdBy: invite.createdBy,
      usedBy: invite.usedBy,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      usedAt: invite.usedAt,
      revokedAt: invite.revokedAt,
      active: !invite.usedAt && !invite.revokedAt && invite.expiresAt > new Date(),
    })),
  });
}

async function revokeAdminInvite(req, res) {
  const invite = await AdminInviteCode.findById(req.params.id);
  if (!invite) {
    return res.status(404).json({ message: "Invite code not found" });
  }
  if (invite.usedAt) {
    return res.status(400).json({ message: "Invite code is already used" });
  }

  invite.revokedAt = new Date();
  await invite.save();
  res.json({ message: "Invite code revoked" });
}

async function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = {
  register,
  login,
  me,
  forgotPasswordRequest,
  resetPasswordWithOtp,
  googleAuth,
  createAdminInvite,
  listAdminInvites,
  revokeAdminInvite,
};
