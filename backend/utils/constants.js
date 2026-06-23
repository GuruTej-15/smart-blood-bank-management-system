const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const PRIORITY_LEVELS = ["critical", "high", "medium", "normal"];
const REQUEST_STATUSES = ["pending", "approved", "rejected", "fulfilled"];
const UNIT_STATUSES = ["available", "reserved", "used", "expired"];

// Standard compatibility chart: who a RECIPIENT of each group can receive FROM
const COMPATIBILITY_MAP = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], // universal recipient
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"], // universal donor, but as a recipient can only take O-
};

const REWARD_LEVELS = [
  { name: "Bronze", min: 1, max: 4 },
  { name: "Silver", min: 5, max: 9 },
  { name: "Gold", min: 10, max: 19 },
  { name: "Platinum", min: 20, max: Infinity },
];

module.exports = {
  BLOOD_GROUPS,
  PRIORITY_LEVELS,
  REQUEST_STATUSES,
  UNIT_STATUSES,
  COMPATIBILITY_MAP,
  REWARD_LEVELS,
};
