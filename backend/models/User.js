const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { hashValue } = require("../utils/security");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8 },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpiresAt: { type: Date, default: null },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null, index: true },
    role: { type: String, enum: ["admin", "hospital", "donor"], default: "donor" },
    // Optional links to a Hospital/Donor profile document
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.path("password").validate(function validatePassword(value) {
  if (this.authProvider === "google" && !value) {
    return true;
  }
  if (!value) {
    return false;
  }
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
}, "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character");

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

userSchema.methods.recordFailedLogin = async function () {
  const maxAttempts = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS) || 5;
  const lockMinutes = Number(process.env.AUTH_LOCK_MINUTES) || 15;
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save();
};

userSchema.methods.clearLoginFailures = async function () {
  if (!this.failedLoginAttempts && !this.lockUntil) {
    return;
  }
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

userSchema.methods.markEmailVerified = async function () {
  this.isEmailVerified = true;
  this.emailVerifiedAt = new Date();
  this.emailVerificationTokenHash = null;
  this.emailVerificationExpiresAt = null;
  await this.save();
};

userSchema.methods.setEmailVerificationToken = async function (token, expiresMinutes = 60 * 24) {
  this.emailVerificationTokenHash = hashValue(token);
  this.emailVerificationExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
  await this.save();
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  delete obj.tokenVersion;
  delete obj.emailVerificationTokenHash;
  delete obj.emailVerificationExpiresAt;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
