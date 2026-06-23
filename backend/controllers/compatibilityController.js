const { compatibleDonorsFor, compatibleRecipientsFor } = require("../utils/compatibility");
const { BLOOD_GROUPS } = require("../utils/constants");

async function checkCompatibility(req, res) {
  const { bloodGroup } = req.params;
  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({ message: `Unknown blood group: ${bloodGroup}` });
  }
  res.json({
    bloodGroup,
    canReceiveFrom: compatibleDonorsFor(bloodGroup), // as a recipient
    canDonateTo: compatibleRecipientsFor(bloodGroup), // as a donor
  });
}

async function fullChart(req, res) {
  const chart = BLOOD_GROUPS.map((group) => ({
    bloodGroup: group,
    canReceiveFrom: compatibleDonorsFor(group),
    canDonateTo: compatibleRecipientsFor(group),
  }));
  res.json({ chart });
}

module.exports = { checkCompatibility, fullChart };
