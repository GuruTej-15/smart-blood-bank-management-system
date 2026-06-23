const Broadcast = require("../models/Broadcast");
const { store, getAvailableUnitCount } = require("./store");
const { checkEligibility } = require("./eligibility");
const { compatibleRecipientsFor } = require("./compatibility");
const { BLOOD_GROUPS } = require("./constants");

/**
 * Emergency Broadcast System (simulated - see Future Scope for real
 * SMS/email delivery). Finds donors compatible with + eligible for the
 * given blood group and logs them as "notified" on a Broadcast record.
 */
async function triggerBroadcast(bloodGroup, reason, relatedRequestId = null, limit = 25) {
  const compatibleGroups = BLOOD_GROUPS.filter((donorGroup) =>
    compatibleRecipientsFor(donorGroup).includes(bloodGroup)
  );

  const eligibleDonors = store.donorList
    .filter((d) => d.isActive !== false && compatibleGroups.includes(d.bloodGroup))
    .map((d) => ({ ...d, eligibility: checkEligibility(d) }))
    .filter((d) => d.eligibility.eligible)
    .slice(0, limit);

  const broadcast = await Broadcast.create({
    bloodGroup,
    reason,
    relatedRequest: relatedRequestId,
    stockAtTrigger: getAvailableUnitCount(bloodGroup),
    notifiedDonors: eligibleDonors.map((d) => ({ donor: d._id, name: d.name, phone: d.phone })),
  });

  console.log(
    `[Broadcast] ${bloodGroup} (${reason}): notified ${eligibleDonors.length} eligible donor(s).`
  );

  return broadcast;
}

module.exports = { triggerBroadcast };
