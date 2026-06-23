/**
 * Donation Eligibility Checker
 * A donor is eligible again once DONATION_ELIGIBILITY_DAYS have passed
 * since their last donation (default 90 days). New donors with no prior
 * donation are always eligible.
 */

function eligibilityDays() {
  return Number(process.env.DONATION_ELIGIBILITY_DAYS || 90);
}

function checkEligibility(donor) {
  if (!donor.lastDonationDate) {
    return { eligible: true, daysSinceLastDonation: null, nextEligibleDate: null };
  }
  const last = new Date(donor.lastDonationDate);
  const msSinceLast = Date.now() - last.getTime();
  const daysSinceLast = Math.floor(msSinceLast / (1000 * 60 * 60 * 24));
  const required = eligibilityDays();
  const eligible = daysSinceLast >= required;

  const nextEligibleDate = new Date(last.getTime() + required * 24 * 60 * 60 * 1000);

  return {
    eligible,
    daysSinceLastDonation: daysSinceLast,
    nextEligibleDate: eligible ? null : nextEligibleDate,
  };
}

module.exports = { checkEligibility, eligibilityDays };
