const mongoose = require("mongoose");
const { BLOOD_GROUPS } = require("../utils/constants");

// Real SMS/email delivery is listed as Future Scope in the project spec;
// this model simulates the broadcast by logging who *would* be notified.
const broadcastSchema = new mongoose.Schema(
  {
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    reason: { type: String, required: true }, // e.g. "low_stock" | "emergency_request"
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    stockAtTrigger: { type: Number, required: true },
    notifiedDonors: [
      {
        donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" },
        name: String,
        phone: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Broadcast", broadcastSchema);
