const QRCode = require("qrcode");
const Donor = require("../models/Donor");
const { checkEligibility } = require("../utils/eligibility");
const { compatibleRecipientsFor } = require("../utils/compatibility");
const { REWARD_LEVELS } = require("../utils/constants");
const {
  syncDonorInsert,
  syncDonorUpdate,
  syncDonorDelete,
} = require("../utils/store");

function rewardLevelFor(totalDonations) {
  const level = REWARD_LEVELS.find((l) => totalDonations >= l.min && totalDonations <= l.max);
  return level ? level.name : "Bronze";
}

// ---------- CRUD ----------

async function createDonor(req, res) {
  const donor = await Donor.create(req.body);
  syncDonorInsert(donor.toObject());
  res.status(201).json(donor);
}

async function listDonors(req, res) {
  const { bloodGroup } = req.query;
  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  const donors = await Donor.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ count: donors.length, donors });
}

async function getDonor(req, res) {
  const donor = await Donor.findById(req.params.id).lean();
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  res.json(donor);
}

async function updateDonor(req, res) {
  const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  syncDonorUpdate(donor.toObject());
  res.json(donor);
}

async function deleteDonor(req, res) {
  const donor = await Donor.findByIdAndDelete(req.params.id);
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  syncDonorDelete(donor._id);
  res.json({ message: "Donor deleted", id: donor._id });
}

// ---------- Search ----------

async function searchDonors(req, res) {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) return res.json({ count: 0, donors: [] });
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const results = await Donor.find({
    $or: [
      { name: regex },
      { phone: regex },
      { email: regex },
      { bloodGroup: String(req.query.q || "").trim().toUpperCase() },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ count: results.length, donors: results });
}

// ---------- Smart Donor Finder (Advanced Feature) ----------

async function smartFinder(req, res) {
  const { bloodGroup } = req.query;
  if (!bloodGroup) return res.status(400).json({ message: "bloodGroup query param is required" });

  // Any donor whose blood type is compatible *as a donor* for this recipient group
  const compatibleGroups = require("../utils/constants").BLOOD_GROUPS.filter((donorGroup) =>
    compatibleRecipientsFor(donorGroup).includes(bloodGroup)
  );

  const donors = await Donor.find({
    isActive: { $ne: false },
    bloodGroup: { $in: compatibleGroups },
  }).lean();

  const candidates = donors
    .map((d) => ({ ...d, eligibility: checkEligibility(d) }))
    .filter((d) => d.eligibility.eligible)
    // Exact blood-group match first, then by recency of last donation (longer rested = prioritized)
    .sort((a, b) => {
      if (a.bloodGroup === bloodGroup && b.bloodGroup !== bloodGroup) return -1;
      if (b.bloodGroup === bloodGroup && a.bloodGroup !== bloodGroup) return 1;
      const aDate = a.lastDonationDate ? new Date(a.lastDonationDate) : new Date(0);
      const bDate = b.lastDonationDate ? new Date(b.lastDonationDate) : new Date(0);
      return aDate - bDate;
    });

  res.json({ bloodGroup, compatibleGroups, count: candidates.length, donors: candidates });
}

// ---------- Donation Eligibility Checker ----------

async function eligibilityCheck(req, res) {
  const donor = await Donor.findById(req.params.id).lean();
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  res.json({ donorId: donor._id, ...checkEligibility(donor) });
}

// ---------- Donor Reward System ----------

async function rewardInfo(req, res) {
  const donor = await Donor.findById(req.params.id).lean();
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  const totalDonations = donor.totalDonations || 0;
  const level = rewardLevelFor(totalDonations);
  const currentTierIndex = REWARD_LEVELS.findIndex((l) => l.name === level);
  const next = REWARD_LEVELS[currentTierIndex + 1] || null;
  res.json({
    donorId: donor._id,
    totalDonations,
    level,
    nextLevel: next ? { name: next.name, donationsNeeded: next.min - totalDonations } : null,
  });
}

// Top Donor Ranking System (Max Heap leaderboard)
async function leaderboard(req, res) {
  const n = Number(req.query.limit) || 10;
  const top = (await Donor.find().sort({ totalDonations: -1, createdAt: 1 }).limit(n).lean()).map((d) => ({
    ...d,
    level: rewardLevelFor(d.totalDonations || 0),
  }));
  res.json({ count: top.length, leaderboard: top });
}

// ---------- Digital Donor Card ----------

async function donorCard(req, res) {
  const donor = await Donor.findById(req.params.id).lean();
  if (!donor) return res.status(404).json({ message: "Donor not found" });

  const payload = JSON.stringify({
    donorId: donor._id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(payload);

  res.json({
    donor,
    rewardLevel: rewardLevelFor(donor.totalDonations || 0),
    qrCodeDataUrl,
  });
}

async function myProfile(req, res) {
  if (req.user.role !== "donor") {
    return res.status(403).json({ message: "Only donor accounts can access this profile" });
  }
  if (!req.user.donor) {
    return res.status(404).json({ message: "No donor profile is linked to this account" });
  }

  const donor = await Donor.findById(req.user.donor);
  if (!donor) {
    return res.status(404).json({ message: "Donor profile not found" });
  }

  const eligibility = checkEligibility(donor);
  const rewardLevel = rewardLevelFor(donor.totalDonations || 0);
  const currentTierIndex = REWARD_LEVELS.findIndex((l) => l.name === rewardLevel);
  const next = REWARD_LEVELS[currentTierIndex + 1] || null;
  const qrCodeDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      donorId: donor._id,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
    })
  );

  res.json({
    donor,
    eligibility,
    rewardLevel,
    nextLevel: next ? { name: next.name, donationsNeeded: next.min - (donor.totalDonations || 0) } : null,
    qrCodeDataUrl,
  });
}

module.exports = {
  createDonor,
  listDonors,
  getDonor,
  updateDonor,
  deleteDonor,
  searchDonors,
  smartFinder,
  eligibilityCheck,
  rewardInfo,
  leaderboard,
  donorCard,
  myProfile,
};
