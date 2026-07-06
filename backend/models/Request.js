const mongoose = require("mongoose");
const { BLOOD_GROUPS, PRIORITY_LEVELS, REQUEST_STATUSES } = require("../utils/constants");

const requestSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    patientName: { type: String, default: "" },
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    unitsRequired: { type: Number, required: true, min: 1 },
    priority: { type: String, enum: PRIORITY_LEVELS, default: "normal" },
    isEmergency: { type: Boolean, default: false }, // true -> routed to PriorityQueue instead of Queue
    status: { type: String, enum: REQUEST_STATUSES, default: "pending" },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fulfilledUnits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Inventory" }],
    fulfilledUnitsCount: { type: Number, default: 0 },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

requestSchema.index({ status: 1, isEmergency: 1 });

module.exports = mongoose.model("Request", requestSchema);
