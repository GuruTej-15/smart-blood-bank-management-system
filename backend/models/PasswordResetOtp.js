const mongoose = require("mongoose");

const passwordResetOtpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "verified", "consumed", "revoked"], default: "pending", index: true },
    consumedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    verificationTokenHash: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, default: null, index: true },
    attempts: { type: Number, default: 0 },
    requestIp: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

passwordResetOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

module.exports = mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
