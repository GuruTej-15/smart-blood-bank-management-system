const mongoose = require("mongoose");
const { BLOOD_GROUPS } = require("../utils/constants");

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    address: { type: String, default: "" },
    age: { type: Number, min: 18, max: 65 },
    lastDonationDate: { type: Date, default: null },
    totalDonations: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }, // false = opted out of broadcasts
  },
  { timestamps: true }
);

donorSchema.index({ bloodGroup: 1 });

module.exports = mongoose.model("Donor", donorSchema);
