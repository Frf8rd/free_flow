const { MATCHING_CONFIG } = require('./config');
const { scoreFreelancerForProject } = require('./scoring');

function filterFreelancers(project, freelancers, config = MATCHING_CONFIG, now = new Date()) {
  const candidates = Array.isArray(freelancers) ? freelancers : [];
  const evaluations = candidates.map((freelancer) => {
    const result = scoreFreelancerForProject(project, freelancer, config, now);

    return {
      freelancer,
      eligible: result.eligible,
      reasons: result.eligible ? [] : [result.reason],
      ...(result.eligible ? { score: result.score, components: result.components, details: result.details } : {}),
    };
  });

  return {
    eligible: evaluations.filter((candidate) => candidate.eligible),
    rejected: evaluations.filter((candidate) => !candidate.eligible),
  };
}

module.exports = { filterFreelancers };
