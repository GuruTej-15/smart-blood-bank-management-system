const { COMPATIBILITY_MAP, BLOOD_GROUPS } = require("./constants");

/** Donor groups a given RECIPIENT blood group can safely receive from */
function compatibleDonorsFor(recipientGroup) {
  return COMPATIBILITY_MAP[recipientGroup] || [];
}

/** Recipient groups a given DONOR blood group can safely give to (inverse lookup) */
function compatibleRecipientsFor(donorGroup) {
  return BLOOD_GROUPS.filter((recipient) => COMPATIBILITY_MAP[recipient]?.includes(donorGroup));
}

module.exports = { compatibleDonorsFor, compatibleRecipientsFor };
