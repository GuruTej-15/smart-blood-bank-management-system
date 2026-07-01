const mongoose = require("mongoose");

const passwordResetAuditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    action: {
      type: String,
      enum: ["request", "verify_attempt", "verify_success", "reset_success", "reset_failed", "request_missing_user"],
      required: true,
      index: true,
    },
    success: { type: Boolean, default: false },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PasswordResetAudit", passwordResetAuditSchema);