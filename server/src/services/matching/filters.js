const { MATCHING_CONFIG } = require('./config');
const { scoreSkills } = require('./scoring');

function filterFreelancers(project, freelancers, config = MATCHING_CONFIG) {
  const candidates = Array.isArray(freelancers) ? freelancers : [];
  const hours = config.sizeHours[project?.size ?? 'MEDIUM'] ?? config.sizeHours.MEDIUM;
  const maxPriceOverrun = config.filters.maxPriceOverrun;

  const evaluations = candidates.map((freelancer) => {
    const reasons = [];
    const skillResult = scoreSkills(project, freelancer);

    if (freelancer.blocked === true || freelancer.active === false || freelancer.accountStatus === 'BLOCKED') {
      reasons.push('ACCOUNT_BLOCKED');
    }
    if (config.filters.unavailableValues.includes(freelancer.availability)) {
      reasons.push('UNAVAILABLE');
    }
    if (config.filters.requireAllEssentialSkills && skillResult.missingEssentialSkills.length > 0) {
      reasons.push('MISSING_ESSENTIAL_SKILLS');
    }

    const rate = Number(freelancer.hourlyRate);
    const budgetMax = Number(project?.budgetMax);
    if (Number.isFinite(rate) && rate >= 0 && Number.isFinite(budgetMax) && budgetMax > 0) {
      const estimatedCost = rate * hours;
      if (estimatedCost > budgetMax * maxPriceOverrun) reasons.push('OVER_BUDGET');
    }

    return {
      freelancer,
      eligible: reasons.length === 0,
      reasons,
      skillScore: skillResult.score,
      matchedSkills: skillResult.matchedSkills,
      missingEssentialSkills: skillResult.missingEssentialSkills,
    };
  });

  return {
    eligible: evaluations.filter((candidate) => candidate.eligible),
    rejected: evaluations.filter((candidate) => !candidate.eligible),
  };
}

module.exports = { filterFreelancers };
