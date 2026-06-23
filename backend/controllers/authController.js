const User = require("../models/User");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const generateToken = require("../utils/generateToken");
const { BLOOD_GROUPS } = require("../utils/constants");

const ALLOWED_ROLES = ["admin", "hospital", "donor"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateCommonFields({ name, email, password }) {
  if (!name || !email || !password) {
    return "name, email and password are required";
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Please provide a valid email address";
  }
  if (String(password).length < 6) {
    return "Password must be at least 6 characters long";
  }
  return null;
}

async function register(req, res) {
  const { name, email, password, role } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const selectedRole = ALLOWED_ROLES.includes(role) ? role : "donor";

  const commonValidationError = validateCommonFields({ name, email: normalizedEmail, password });
  if (commonValidationError) {
    return res.status(400).json({ message: commonValidationError });
  }

  if (selectedRole === "donor") {
    const { bloodGroup, phone } = req.body;
    if (!bloodGroup || !BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ message: "A valid bloodGroup is required for donor registration" });
    }
    if (!phone) {
      return res.status(400).json({ message: "phone is required for donor registration" });
    }
  }

  if (selectedRole === "hospital") {
    const { hospitalName, contactNumber } = req.body;
    if (!hospitalName || !contactNumber) {
      return res.status(400).json({ message: "hospitalName and contactNumber are required for hospital registration" });
    }
  }

  if (selectedRole === "admin") {
    if (!process.env.ADMIN_REGISTRATION_CODE) {
      return res.status(403).json({ message: "Admin registration is disabled" });
    }
    if (String(req.body.adminCode || "").trim() !== process.env.ADMIN_REGISTRATION_CODE) {
      return res.status(403).json({ message: "Invalid admin registration code" });
    }
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: "An account with this email already exists" });

  let donorProfile = null;
  let hospitalProfile = null;

  try {
    if (selectedRole === "donor") {
      donorProfile = await Donor.create({
        name,
        email: normalizedEmail,
        phone: String(req.body.phone).trim(),
        bloodGroup: req.body.bloodGroup,
        address: req.body.address || "",
        age: req.body.age ? Number(req.body.age) : undefined,
        isActive: true,
      });
    }

    if (selectedRole === "hospital") {
      hospitalProfile = await Hospital.create({
        hospitalName: String(req.body.hospitalName).trim(),
        contactNumber: String(req.body.contactNumber).trim(),
        email: normalizedEmail,
        address: req.body.address || "",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: selectedRole,
      donor: donorProfile?._id,
      hospital: hospitalProfile?._id,
    });

    return res.status(201).json({
      user: user.toSafeObject(),
      token: generateToken(user),
    });
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

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: "Invalid email or password" });

  res.json({
    user: user.toSafeObject(),
    token: generateToken(user),
  });
}

async function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, me };
