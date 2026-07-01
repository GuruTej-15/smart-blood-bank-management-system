require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const Inventory = require("../models/Inventory");
const Request = require("../models/Request");
const Donation = require("../models/Donation");
const Broadcast = require("../models/Broadcast");

async function purgeSeedData() {
  await connectDB();

  const seedEmailPattern = /@(bloodbank|example)\.test$/i;
  const knownSeedHospitalNames = ["City General Hospital", "Sunrise Multispecialty", "LPU Campus Clinic"];

  const [seedUsers, seedDonors, seedHospitals] = await Promise.all([
    User.find({ email: { $regex: seedEmailPattern } }).select("_id"),
    Donor.find({ email: { $regex: seedEmailPattern } }).select("_id"),
    Hospital.find({
      $or: [
        { email: { $regex: seedEmailPattern } },
        { hospitalName: { $in: knownSeedHospitalNames } },
      ],
    }).select("_id"),
  ]);

  const userIds = seedUsers.map((u) => u._id);
  const donorIds = seedDonors.map((d) => d._id);
  const hospitalIds = seedHospitals.map((h) => h._id);
  const seededRequestIds = hospitalIds.length
    ? await Request.find({ hospital: { $in: hospitalIds } }).distinct("_id")
    : [];

  const [usersResult, donorsResult, hospitalsResult, inventoryResult] = await Promise.all([
    User.deleteMany({ _id: { $in: userIds } }),
    Donor.deleteMany({ _id: { $in: donorIds } }),
    Hospital.deleteMany({ _id: { $in: hospitalIds } }),
    Inventory.deleteMany({ source: "seed-data" }),
  ]);

  const broadcastDeleteFilter = [];
  if (seededRequestIds.length) {
    broadcastDeleteFilter.push({ relatedRequest: { $in: seededRequestIds } });
  }
  if (donorIds.length) {
    broadcastDeleteFilter.push({ "notifiedDonors.donor": { $in: donorIds } });
  }

  const [requestsResult, donationsResult, broadcastsResult] = await Promise.all([
    Request.deleteMany(hospitalIds.length ? { hospital: { $in: hospitalIds } } : { _id: null }),
    Donation.deleteMany(donorIds.length ? { donor: { $in: donorIds } } : { _id: null }),
    Broadcast.deleteMany(broadcastDeleteFilter.length ? { $or: broadcastDeleteFilter } : { _id: null }),
  ]);

  console.log("[Purge] Seed cleanup summary");
  console.log(`- Users removed: ${usersResult.deletedCount}`);
  console.log(`- Donors removed: ${donorsResult.deletedCount}`);
  console.log(`- Hospitals removed: ${hospitalsResult.deletedCount}`);
  console.log(`- Inventory batches removed: ${inventoryResult.deletedCount}`);
  console.log(`- Requests removed: ${requestsResult.deletedCount}`);
  console.log(`- Donations removed: ${donationsResult.deletedCount}`);
  console.log(`- Broadcast logs removed: ${broadcastsResult.deletedCount}`);

  await mongoose.disconnect();
}

purgeSeedData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Purge] Failed:", err);
    process.exit(1);
  });
