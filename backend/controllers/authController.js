const User = require("../models/User");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const AdminInviteCode = require("../models/AdminInviteCode");
const generateToken = require("../utils/generateToken");
const {
  sanitizeInput,
  normalizeEmail,
  hashValue,
  generateInviteCode,
  generateSecureToken,
  isStrongPassword,
  validateFullName,
  validateEmailAddress,
  validatePassword,
  validatePhoneNumber,
  validateHospitalName,
  validateContactNumber,
  validateRole,
} = require("../utils/security");
const { BLOOD_GROUPS } = require("../utils/constants");

const ALLOWED_ROLES = ["admin", "hospital", "donor"];

function validateCommonFields({ name, email, password }) {
  const nameError = validateFullName(name);
  if (nameError) {
    return nameError;
  }

  const emailError = validateEmailAddress(email);
  if (emailError) {
    return emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return passwordError;
  }

  return null;
}

function roleFor(inputRole) {
  if (!inputRole) return "donor";
  const normalizedRole = String(inputRole).trim().toLowerCase();
  return ALLOWED_ROLES.includes(normalizedRole) ? normalizedRole : "donor";
}

function validateRoleFields(role, body) {
  const roleError = validateRole(role);
  if (roleError) {
    return roleError;
  }

  if (role === "donor") {
    if (!body.bloodGroup || !BLOOD_GROUPS.includes(body.bloodGroup)) {
      return "A valid bloodGroup is required for donor registration";
    }
    const phoneError = validatePhoneNumber(body.phone);
    if (phoneError) {
      return phoneError;
    }
  }

  if (role === "hospital") {
    const hospitalNameError = validateHospitalName(body.hospitalName);
    if (hospitalNameError) {
      return hospitalNameError;
    }
    const contactNumberError = validateContactNumber(body.contactNumber);
    if (contactNumberError) {
      return contactNumberError;
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

  if (bootstrapCode && adminCode === bootstrapCode) {
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

function passwordValidationMessage() {
  return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";
}

async function createLinkedProfileForRole(role, payload) {
  let donorProfile = null;
  let hospitalProfile = null;

  if (role === "donor") {
    donorProfile = await Donor.create({
      name: sanitizeInput(payload.name),
      email: normalizeEmail(payload.email),
      phone: sanitizeInput(payload.phone),
      bloodGroup: sanitizeInput(payload.bloodGroup).toUpperCase(),
      address: sanitizeInput(payload.address || ""),
      age: payload.age ? Number(payload.age) : undefined,
      isActive: true,
    });
  }

  if (role === "hospital") {
    hospitalProfile = await Hospital.create({
      hospitalName: sanitizeInput(payload.hospitalName),
      contactNumber: sanitizeInput(payload.contactNumber),
      email: normalizeEmail(payload.email),
      address: sanitizeInput(payload.address || ""),
    });
  }

  return { donorProfile, hospitalProfile };
}

async function register(req, res) {
  const name = sanitizeInput(req.body.name);
  const email = sanitizeInput(req.body.email);
  const password = sanitizeInput(req.body.password);
  const role = sanitizeInput(req.body.role);
  const normalizedEmail = normalizeEmail(email);
  const selectedRole = roleFor(role);

  const sanitizedPayload = {
    ...req.body,
    name,
    email: normalizedEmail,
    password,
    role: selectedRole,
    phone: sanitizeInput(req.body.phone),
    bloodGroup: sanitizeInput(req.body.bloodGroup).toUpperCase(),
    hospitalName: sanitizeInput(req.body.hospitalName),
    contactNumber: sanitizeInput(req.body.contactNumber),
    address: sanitizeInput(req.body.address),
  };

  const commonValidationError = validateCommonFields({ name, email: normalizedEmail, password });
  if (commonValidationError) {
    return res.status(400).json({ message: commonValidationError });
  }

  const roleValidationError = validateRoleFields(selectedRole, sanitizedPayload);
  if (roleValidationError) {
    return res.status(400).json({ message: roleValidationError });
  }

  let inviteValidation = null;
  if (selectedRole === "admin") {
    inviteValidation = await validateAdminInviteOrBootstrap(sanitizeInput(req.body.adminCode));
    if (inviteValidation.error) {
      return res.status(403).json({ message: inviteValidation.error });
    }
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: "An account with this email already exists" });

  const phoneExists = selectedRole === "donor"
    ? await Donor.findOne({ phone: sanitizeInput(req.body.phone) })
    : null;
  if (phoneExists) {
    return res.status(409).json({ message: "A donor with this phone number already exists" });
  }

  let donorProfile = null;
  let hospitalProfile = null;

  try {
    ({ donorProfile, hospitalProfile } = await createLinkedProfileForRole(selectedRole, sanitizedPayload));

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      authProvider: "local",
      role: selectedRole,
      donor: donorProfile?._id,
      hospital: hospitalProfile?._id,
      isEmailVerified: false,
    });

    // Mark email as verified so users can access the app immediately without email verification
    user.isEmailVerified = true;
    await user.save();

    if (inviteValidation?.invite) {
      inviteValidation.invite.usedBy = user._id;
      inviteValidation.invite.usedAt = new Date();
      await inviteValidation.invite.save();
    }

    return res.status(201).json({
      message: "Account created successfully.",
      ...authResponse(user),
    });
  } catch (err) {
    if (donorProfile) await Donor.findByIdAndDelete(donorProfile._id);
    if (hospitalProfile) await Hospital.findByIdAndDelete(hospitalProfile._id);
    return res.status(500).json({ message: err.message || "Registration failed" });
  }
}

async function login(req, res) {
  const email = sanitizeInput(req.body.email);
  const password = sanitizeInput(req.body.password);
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const emailError = validateEmailAddress(email);
  if (emailError) {
    return res.status(400).json({ message: emailError });
  }

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return res.status(401).json({ message: "Invalid email or password" });

  if (user.isLocked()) {
    return res.status(423).json({ message: "Account temporarily locked due to failed login attempts" });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    await user.recordFailedLogin();
    return res.status(401).json({ message: "Invalid email or password" });
  }

  await user.clearLoginFailures();

  res.json(authResponse(user));
}

async function logout(req, res) {
  try {
    if (req.user) {
      req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
      await req.user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
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
  logout,
  me,
  createAdminInvite,
  listAdminInvites,
  revokeAdminInvite,
};
