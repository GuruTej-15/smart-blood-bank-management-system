const mongoose = require("mongoose");
const { BLOOD_GROUPS } = require("../utils/constants");

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
    date: { type: Date, required: true, default: Date.now },
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    unitsDonated: { type: Number, required: true, default: 1, min: 1 },
    inventoryBatch: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" }, // the batch this donation created
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
