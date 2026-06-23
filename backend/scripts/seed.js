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

const { BLOOD_GROUPS } = require("../utils/constants");

const FIRST_NAMES = ["Aarav", "Vivaan", "Aditi", "Diya", "Kabir", "Meera", "Rohan", "Saanvi", "Ishaan", "Anaya", "Arjun", "Priya"];
const LAST_NAMES = ["Sharma", "Verma", "Iyer", "Khan", "Gupta", "Singh", "Reddy", "Nair", "Patel", "Joshi"];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function seed() {
  await connectDB();
  console.log("[Seed] Clearing existing collections...");
  await Promise.all([
    User.deleteMany({}),
    Donor.deleteMany({}),
    Hospital.deleteMany({}),
    Inventory.deleteMany({}),
    Request.deleteMany({}),
    Donation.deleteMany({}),
    Broadcast.deleteMany({}),
  ]);

  console.log("[Seed] Creating users...");
  await User.create([
    { name: "System Admin", email: "admin@bloodbank.test", password: "admin123", role: "admin" },
    { name: "City Hospital Desk", email: "hospital@bloodbank.test", password: "hospital123", role: "hospital" },
  ]);

  console.log("[Seed] Creating hospitals...");
  const hospitals = await Hospital.insertMany([
    { hospitalName: "City General Hospital", contactNumber: "9876500001", email: "contact@citygeneral.test", address: "MG Road, Delhi" },
    { hospitalName: "Sunrise Multispecialty", contactNumber: "9876500002", email: "contact@sunrise.test", address: "Sector 21, Gurugram" },
    { hospitalName: "LPU Campus Clinic", contactNumber: "9876500003", email: "clinic@lpu.test", address: "Phagwara, Punjab" },
  ]);

  console.log("[Seed] Creating donors...");
  const donorDocs = [];
  for (let i = 0; i < 40; i++) {
    const bloodGroup = randomFrom(BLOOD_GROUPS);
    const hasDonatedBefore = Math.random() > 0.3;
    donorDocs.push({
      name: `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`,
      email: `donor${i}@example.test`,
      phone: `98${String(10000000 + i).slice(0, 8)}`,
      bloodGroup,
      address: randomFrom(["Delhi", "Gurugram", "Noida", "Phagwara", "Chandigarh"]),
      age: 18 + Math.floor(Math.random() * 40),
      lastDonationDate: hasDonatedBefore ? daysAgo(Math.floor(Math.random() * 200)) : null,
      totalDonations: hasDonatedBefore ? Math.floor(Math.random() * 25) : 0,
      isActive: true,
    });
  }
  const donors = await Donor.insertMany(donorDocs);

  console.log("[Seed] Creating inventory batches...");
  const inventoryDocs = [];
  BLOOD_GROUPS.forEach((group) => {
    // Deliberately uneven stock so low-stock / crisis features have something to flag
    const batchCount = group === "O-" ? 2 : group === "AB-" ? 1 : 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < batchCount; i++) {
      const collectedDate = daysAgo(Math.floor(Math.random() * 35));
      const expiryDate = new Date(collectedDate.getTime() + 42 * 24 * 60 * 60 * 1000);
      inventoryDocs.push({
        bloodGroup: group,
        units: 1 + Math.floor(Math.random() * 3),
        collectedDate,
        expiryDate,
        status: "available",
        source: "seed-data",
      });
    }
  });
  // A couple of units expiring very soon, to populate the expiry alert
  inventoryDocs.push({
    bloodGroup: "A+",
    units: 2,
    collectedDate: daysAgo(40),
    expiryDate: daysFromNow(2),
    status: "available",
    source: "seed-data",
  });
  inventoryDocs.push({
    bloodGroup: "O+",
    units: 1,
    collectedDate: daysAgo(39),
    expiryDate: daysFromNow(4),
    status: "available",
    source: "seed-data",
  });
  await Inventory.insertMany(inventoryDocs);

  console.log("[Seed] Creating requests (normal + emergency)...");
  const priorities = ["normal", "medium", "high", "critical"];
  const requestDocs = [];
  for (let i = 0; i < 15; i++) {
    const isEmergency = Math.random() > 0.7;
    requestDocs.push({
      hospital: randomFrom(hospitals)._id,
      patientName: `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`,
      bloodGroup: randomFrom(BLOOD_GROUPS),
      unitsRequired: 1 + Math.floor(Math.random() * 4),
      priority: isEmergency ? randomFrom(["critical", "high"]) : randomFrom(priorities),
      isEmergency,
      status: "pending",
    });
  }
  await Request.insertMany(requestDocs);

  console.log("[Seed] Creating donation history (last 6 weeks)...");
  const donationDocs = [];
  for (let i = 0; i < 30; i++) {
    const donor = randomFrom(donors);
    donationDocs.push({
      donor: donor._id,
      date: daysAgo(Math.floor(Math.random() * 42)),
      bloodGroup: donor.bloodGroup,
      unitsDonated: 1,
    });
  }
  await Donation.insertMany(donationDocs);

  console.log("\n[Seed] Done.");
  console.log("Login as admin:    admin@bloodbank.test / admin123");
  console.log("Login as hospital: hospital@bloodbank.test / hospital123\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
