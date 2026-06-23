const Hospital = require("../models/Hospital");

async function createHospital(req, res) {
  const hospital = await Hospital.create(req.body);
  res.status(201).json(hospital);
}

async function listHospitals(req, res) {
  const hospitals = await Hospital.find().sort({ hospitalName: 1 });
  res.json({ count: hospitals.length, hospitals });
}

async function getHospital(req, res) {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) return res.status(404).json({ message: "Hospital not found" });
  res.json(hospital);
}

async function updateHospital(req, res) {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!hospital) return res.status(404).json({ message: "Hospital not found" });
  res.json(hospital);
}

async function deleteHospital(req, res) {
  const hospital = await Hospital.findByIdAndDelete(req.params.id);
  if (!hospital) return res.status(404).json({ message: "Hospital not found" });
  res.json({ message: "Hospital deleted", id: hospital._id });
}

module.exports = { createHospital, listHospitals, getHospital, updateHospital, deleteHospital };
