const mongoose = require("mongoose");

const adminInviteCodeSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    expiresAt: { type: Date, required: true, index: true },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminInviteCode", adminInviteCodeSchema);
