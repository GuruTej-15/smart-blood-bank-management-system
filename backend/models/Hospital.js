const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hospital", hospitalSchema);
