const mongoose = require("mongoose");
const { BLOOD_GROUPS, UNIT_STATUSES } = require("../utils/constants");

// Each document is one collected "batch" of blood, not just a running count -
// this is what lets the Min Heap track expiry per-unit instead of per-group.
const inventorySchema = new mongoose.Schema(
  {
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    units: { type: Number, required: true, min: 1, default: 1 }, // number of (e.g. 450ml) units in this batch
    collectedDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, required: true }, // typically collectedDate + 42 days for whole blood
    status: { type: String, enum: UNIT_STATUSES, default: "available" },
    source: { type: String, default: "" }, // donor id / drive name, optional
  },
  { timestamps: true }
);

inventorySchema.index({ bloodGroup: 1, status: 1 });
inventorySchema.index({ expiryDate: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
