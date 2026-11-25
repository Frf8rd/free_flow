const { MATCHING_CONFIG } = require('./config');
const { normalize, tokenize, containsPhrase, languageMatches } = require('./text');
const { applyFairness } = require('./fairness');
const { buildReasons } = require('./explain');

const LEVELS = ['BEGINNER', 'JUNIOR', 'MID', 'SENIOR'];
const DAY_MS = 24 * 60 * 60 * 1000;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const levelIndex = (level) => {
  const aliases = { INTERMEDIATE: 'MID', ADVANCED: 'SENIOR', EXPERT: 'SENIOR' };
  const index = LEVELS.indexOf(aliases[level] ?? level);
  return index < 0 ? 0 : index;
};
const skillId = (skill) => skill?.skillId ?? skill?.id;

function scoreSkills(project = {}, freelancer = {}) {
  const required = Array.isArray(project.skills) ? project.skills : [];
  const skills = Array.isArray(freelancer.skills) ? freelancer.skills : [];
  const mine = new Map(skills.map((skill) => [skillId(skill), skill]).filter(([id]) => id != null));
  const matchedSkills = [];
  const missingEssentialSkills = [];
  let totalWeight = 0;
  let earnedWeight = 0;
  let essentialCount = 0;
  let essentialMatched = 0;
  const requiredLevel = levelIndex(project.requiredLevel);

  for (const requiredSkill of required) {
    const essential = requiredSkill.essential === true;
    const weight = essential ? 1 : 0.5;
    totalWeight += weight;
    if (essential) essentialCount += 1;
    const match = mine.get(skillId(requiredSkill));
    if (!match) {
      if (essential) missingEssentialSkills.push(requiredSkill.name ?? String(skillId(requiredSkill) ?? 'abilitate'));
      continue;
    }
    const ratio = requiredLevel === 0 ? 1 : Math.min(1, levelIndex(match.level) / requiredLevel);
    earnedWeight += weight * (0.7 + 0.3 * ratio);
    if (essential) essentialMatched += 1;
    matchedSkills.push(requiredSkill.name ?? match.name ?? String(skillId(requiredSkill)));
  }

  const sameCategory = required.length === 0 && skills.some((skill) => skill.categoryId === project.categoryId);
  const coverage = totalWeight > 0 ? earnedWeight / totalWeight : (sameCategory ? 0.5 : 0);
  return {
    score: Math.round(coverage * 100),
    value: coverage,
    coverage,
    essentialCoverage: essentialCount === 0 ? 1 : essentialMatched / essentialCount,
    matchedSkills,
    missingEssentialSkills,
    verifiedSkills: matchedSkills.filter((name) => skills.some((skill) => skill.name === name && skill.verified)),
    total: required.length,
    categoryOnly: required.length === 0,
    sameCategory,
  };
}

function portfolioEvidence(project, freelancer, skills, config) {
  const skillPhrases = (project.skills ?? []).map((skill) => normalize(skill.name)).filter(Boolean);
  const titleTokens = new Set(tokenize(`${project.title ?? ''} ${project.categoryName ?? ''}`));
  let sum = 0;
  let relevant = 0;
  let semantic = 0;

  for (const item of freelancer.portfolio ?? []) {
    const text = normalize(`${item.title ?? ''} ${item.description ?? ''}`);
    const hasSkill = skillPhrases.some((phrase) => containsPhrase(text, phrase));
    const overlap = new Set(tokenize(text).filter((token) => titleTokens.has(token))).size;
    const lexical = hasSkill || overlap >= 2;
    const lo = config.embeddings?.minSimilarity ?? 0.55;
    const hi = config.embeddings?.fullSimilarity ?? 0.75;
    const similarity = Number.isFinite(item.similarity) && hi > lo
      ? clamp01((item.similarity - lo) / (hi - lo))
      : 0;
    const value = lexical ? 1 : similarity;
    sum += value;
    if (value >= 0.5) {
      relevant += 1;
      if (!lexical) semantic += 1;
    }
  }

  const portfolioValue = clamp01(sum / config.evidence.portfolioTarget);
  const verifiedFraction = skills.verifiedSkills.length / Math.max(1, skills.matchedSkills.length);
  return {
    value: config.evidence.portfolioWeight * portfolioValue + config.evidence.verifiedWeight * verifiedFraction,
    relevantPortfolio: relevant,
    semanticPortfolio: semantic,
  };
}

function estimateCost(project, freelancer, config) {
  if (freelancer.hourlyRate === null || freelancer.hourlyRate === undefined || freelancer.hourlyRate === '') return null;
  const rate = Number(freelancer.hourlyRate);
  if (!Number.isFinite(rate) || rate < 0) return null;
  const defaultHours = config.sizeHours[project.size ?? 'MEDIUM'] ?? config.sizeHours.MEDIUM;
  const hours = Number.isFinite(project.estimatedHours) && project.estimatedHours > 0
    ? project.estimatedHours
    : defaultHours;
  return rate * hours;
}

function budgetScore(project, freelancer, config) {
  const estimatedCost = estimateCost(project, freelancer, config);
  const maximum = Number(project.budgetMax);
  if (estimatedCost == null || !Number.isFinite(maximum) || maximum <= 0) {
    return { value: estimatedCost == null ? 0.5 : 0.7, estimatedCost, overrun: null, known: false };
  }
  const sizeHours = config.sizeHours[project.size ?? 'MEDIUM'] ?? config.sizeHours.MEDIUM;
  const hardHours = Number.isFinite(project.estimatedHours) && project.estimatedHours > 0
    ? Math.min(project.estimatedHours, sizeHours)
    : sizeHours;
  const hardOverrun = (Number(freelancer.hourlyRate) * hardHours) / maximum;
  const overrun = estimatedCost / maximum;
  const value = overrun <= 1
    ? 1
    : clamp01(1 - ((overrun - 1) / Math.max(0.01, config.filters.maxPriceOverrun - 1)) * 0.8);
  return { value, estimatedCost, overrun, hardOverrun, known: true };
}

function scoreFreelancerForProject(project, freelancer, config = MATCHING_CONFIG, now = new Date()) {
  const fail = (reason, details = {}) => ({ eligible: false, reason, ...details });
  if (freelancer.blocked || freelancer.active === false || freelancer.accountStatus === 'BLOCKED') return fail('ACCOUNT_BLOCKED');
  if (config.filters.unavailableValues.includes(freelancer.availability)) return fail('UNAVAILABLE');
  if (project.deadline && new Date(project.deadline).getTime() < now.getTime()) return fail('DEADLINE_PASSED');

  const skills = scoreSkills(project, freelancer);
  if (skills.categoryOnly && !skills.sameCategory) return fail('NO_CATEGORY_SKILL');
  if (skills.essentialCoverage < config.filters.minEssentialCoverage) return fail('MISSING_ESSENTIAL_SKILLS');

  const budget = budgetScore(project, freelancer, config);
  if (budget.known && budget.hardOverrun > config.filters.maxPriceOverrun) return fail('PRICE_TOO_HIGH');

  const levelDifference = levelIndex(freelancer.level) - levelIndex(project.requiredLevel);
  if (levelDifference < -config.filters.maxLevelGap) return fail('LEVEL_TOO_LOW');

  const evidence = portfolioEvidence(project, freelancer, skills, config);
  if (!skills.categoryOnly && skills.matchedSkills.length === 0 && evidence.relevantPortfolio === 0) {
    return fail('NO_RELEVANT_SKILLS');
  }

  let availability = freelancer.availability === 'AVAILABLE' ? 1 : 0.6;
  let tightDeadline = false;
  if (project.deadline) {
    const days = Math.ceil((new Date(project.deadline).getTime() - now.getTime()) / DAY_MS);
    const minimum = config.minimumDaysBySize[project.size ?? 'MEDIUM'] ?? config.minimumDaysBySize.MEDIUM;
    if (days < minimum) {
      tightDeadline = true;
      availability *= freelancer.availability === 'AVAILABLE' ? 0.8 : 0.5;
    }
  }

  const levelScore = levelDifference === 0
    ? 1
    : levelDifference < 0
      ? Math.max(0, 1 + levelDifference * 0.4)
      : Math.max(0, 1 - levelDifference * 0.2);
  const reviewsCount = Math.min(freelancer.reviews?.count ?? 0, config.trust.reviewCap);
  const average = reviewsCount > 0 && Number.isFinite(freelancer.reviews?.avg)
    ? freelancer.reviews.avg
    : config.trust.priorRating;
  const adjustedRating = (average * reviewsCount + config.trust.priorRating * config.trust.priorWeight)
    / (reviewsCount + config.trust.priorWeight);
  const trust = clamp01((adjustedRating - 1) / 4);
  const languageOk = project.language
    ? languageMatches(project.language, freelancer.languages ?? [])
    : null;
  const other = project.language ? (languageOk ? 1 : 0.3) : 0.7;
  const components = {
    skills: skills.value,
    evidence: evidence.value,
    budget: budget.value,
    availability,
    level: levelScore,
    trust,
    other,
  };
  const scoreRaw = Object.entries(config.weights)
    .reduce((total, [component, weight]) => total + (components[component] ?? 0) * weight * 100, 0);
  const score = Math.round(clamp01(scoreRaw / 100) * 1000) / 10;
  if (score < config.minScore) return fail('LOW_SCORE', { score, components });

  return {
    eligible: true,
    score,
    components,
    details: {
      matchedSkills: skills.matchedSkills,
      verifiedSkills: skills.verifiedSkills,
      missingEssential: skills.missingEssentialSkills,
      totalSkills: skills.total,
      categoryOnly: skills.categoryOnly,
      relevantPortfolio: evidence.relevantPortfolio,
      semanticPortfolio: evidence.semanticPortfolio,
      estimatedCost: budget.estimatedCost,
      overrun: budget.overrun,
      budgetKnown: budget.known,
      tightDeadline,
      levelDifference,
      languageOk,
    },
  };
}

function rankFreelancers(project, freelancers, config = MATCHING_CONFIG, fairnessContext = {}) {
  const now = fairnessContext.now instanceof Date ? fairnessContext.now : new Date();
  const evaluated = (Array.isArray(freelancers) ? freelancers : [])
    .map((freelancer) => ({ freelancer, result: scoreFreelancerForProject(project, freelancer, config, now) }))
    .filter((item) => item.result.eligible)
    .map(({ freelancer, result }) => ({
      key: freelancer.id,
      score: result.score,
      ref: { freelancer, result },
      ...((fairnessContext.exposureById ?? {})[freelancer.id] ?? {}),
      isNewcomer: (freelancer.reviews?.count ?? 0) < config.fairness.newcomerReviews,
    }));
  const fair = applyFairness(evaluated, { ...config.fairness, ...fairnessContext, maxActive: config.fairness.maxActivePerFreelancer });
  return fair.slice(0, config.limits.matchesPerProject).map((candidate) => {
    const { freelancer, result } = candidate.ref;
    return {
      freelancer,
      ...result,
      rank: candidate.rank,
      exploration: candidate.exploration,
      reasons: buildReasons(result, project, freelancer, { exploration: candidate.exploration }),
    };
  });
}

function rankProjectsForFreelancer(freelancer, projects, config = MATCHING_CONFIG, fairnessContext = {}) {
  const now = fairnessContext.now instanceof Date ? fairnessContext.now : new Date();
  const exposureById = fairnessContext.exposureById ?? {};
  const evaluated = (Array.isArray(projects) ? projects : [])
    .map((project) => ({ project, result: scoreFreelancerForProject(project, freelancer, config, now) }))
    .filter((item) => item.result.eligible)
    .map(({ project, result }) => {
      const exposure = exposureById[project.id] ?? {};
      return {
        key: project.id,
        score: result.score,
        ref: { project, result },
        ...exposure,
        isNewcomer: (exposure.exposure ?? 0) <= config.fairnessFreelancerSide.lowExposure,
      };
    });
  const fair = applyFairness(evaluated, {
    ...config.fairnessFreelancerSide,
    ...fairnessContext,
    maxActive: config.fairnessFreelancerSide.maxActivePerProject,
  });
  return fair.slice(0, config.limits.matchesPerFreelancer).map((candidate) => {
    const { project, result } = candidate.ref;
    return {
      project,
      ...result,
      rank: candidate.rank,
      exploration: candidate.exploration,
      reasons: buildReasons(result, project, freelancer, { exploration: candidate.exploration }),
    };
  });
}

module.exports = {
  scoreSkills,
  scoreFreelancerForProject,
  rankFreelancers,
  rankProjectsForFreelancer,
  estimateCost,
};
