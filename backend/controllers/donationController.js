const Donation = require("../models/Donation");
const Donor = require("../models/Donor");
const Inventory = require("../models/Inventory");
const { syncDonorUpdate, syncInventoryAdd } = require("../utils/store");
const { checkEligibility } = require("../utils/eligibility");

const WHOLE_BLOOD_SHELF_LIFE_DAYS = 42;

async function recordDonation(req, res) {
  const { donorId, unitsDonated = 1, date } = req.body;
  const donor = await Donor.findById(donorId);
  if (!donor) return res.status(404).json({ message: "Donor not found" });

  const eligibility = checkEligibility(donor);
  if (!eligibility.eligible && !req.body.override) {
    return res.status(400).json({
      message: "Donor is not yet eligible to donate again",
      eligibility,
    });
  }

  const donationDate = date ? new Date(date) : new Date();
  const expiryDate = new Date(donationDate.getTime() + WHOLE_BLOOD_SHELF_LIFE_DAYS * 24 * 60 * 60 * 1000);

  // 1) Create the inventory batch this donation produces
  const batch = await Inventory.create({
    bloodGroup: donor.bloodGroup,
    units: unitsDonated,
    collectedDate: donationDate,
    expiryDate,
    status: "available",
    source: `donor:${donor._id}`,
  });
  syncInventoryAdd(batch.toObject());

  // 2) Log the donation
  const donation = await Donation.create({
    donor: donor._id,
    date: donationDate,
    bloodGroup: donor.bloodGroup,
    unitsDonated,
    inventoryBatch: batch._id,
  });

  // 3) Update donor stats
  donor.totalDonations = (donor.totalDonations || 0) + 1;
  donor.lastDonationDate = donationDate;
  await donor.save();
  syncDonorUpdate(donor.toObject());

  res.status(201).json({ donation, batch, donor });
}

async function listDonations(req, res) {
  const { donorId } = req.query;
  const filter = {};
  if (donorId) filter.donor = donorId;
  const donations = await Donation.find(filter).populate("donor", "name bloodGroup").sort({ date: -1 });
  res.json({ count: donations.length, donations });
}

module.exports = { recordDonation, listDonations };
