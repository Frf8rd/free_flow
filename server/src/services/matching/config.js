/** Setările algoritmului sunt centralizate pentru a putea fi calibrate ușor. */
const MATCHING_CONFIG = Object.freeze({
  algorithmVersion: '1.0.0',
  weights: Object.freeze({
    skills: 0.35,
    evidence: 0.2,
    budget: 0.15,
    availability: 0.1,
    level: 0.1,
    trust: 0.05,
    other: 0.05,
  }),
  filters: Object.freeze({
    // Peste 2x costul maxim al proiectului, candidatul nu mai este eligibil.
    maxPriceOverrun: 2,
    unavailableValues: Object.freeze(['UNAVAILABLE', 'INACTIVE']),
    minEssentialCoverage: 0.5,
    maxLevelGap: 1,
  }),
  minScore: 35,
  minimumDaysBySize: Object.freeze({ SMALL: 2, MEDIUM: 7, LARGE: 21 }),
  trust: Object.freeze({ reviewCap: 10, priorRating: 4, priorWeight: 3 }),
  evidence: Object.freeze({ portfolioTarget: 3, portfolioWeight: 0.6, verifiedWeight: 0.4 }),
  fairness: Object.freeze({
    topK: 5,
    explorationSlots: 2,
    explorationMinScore: 50,
    explorationBand: 20,
    mainBand: 5,
    newcomerReviews: 3,
    lowExposure: 2,
    maxActivePerFreelancer: 15,
  }),
  fairnessFreelancerSide: Object.freeze({
    topK: 5,
    explorationSlots: 1,
    explorationMinScore: 50,
    explorationBand: 20,
    mainBand: 5,
    newcomerReviews: 3,
    lowExposure: 2,
    maxActivePerProject: 10,
  }),
  limits: Object.freeze({
    candidates: 300,
    matchesPerProject: 50,
    matchesPerFreelancer: 30,
    notifyTop: 5,
  }),
  // Estimări inițiale, folosite doar când brief-ul nu conține durata.
  sizeHours: Object.freeze({ SMALL: 10, MEDIUM: 40, LARGE: 120 }),
  llm: Object.freeze({
    enabled: Boolean(process.env.MATCH_LLM_MODEL && process.env.MATCH_LLM_BASE_URL && process.env.MATCH_LLM_API_KEY)
      && process.env.MATCH_LLM_ENABLED !== 'false',
    baseURL: process.env.MATCH_LLM_BASE_URL || '',
    model: process.env.MATCH_LLM_MODEL || '',
    apiKey: process.env.MATCH_LLM_API_KEY || '',
    timeoutMs: Number(process.env.MATCH_LLM_TIMEOUT_MS) || 20000,
    maxDescriptionChars: 4000,
  }),
  embeddings: Object.freeze({
    enabled: Boolean(process.env.MATCH_EMBED_MODEL && process.env.MATCH_EMBED_BASE_URL
      && (process.env.MATCH_EMBED_API_KEY || process.env.MATCH_EMBED_BASE_URL === process.env.MATCH_LLM_BASE_URL))
      && process.env.MATCH_EMBED_ENABLED !== 'false',
    baseURL: process.env.MATCH_EMBED_BASE_URL || process.env.MATCH_LLM_BASE_URL || '',
    model: process.env.MATCH_EMBED_MODEL || '',
    apiKey: process.env.MATCH_EMBED_API_KEY
      || (process.env.MATCH_EMBED_BASE_URL === process.env.MATCH_LLM_BASE_URL ? process.env.MATCH_LLM_API_KEY : '')
      || '',
    dimensions: Number(process.env.MATCH_EMBED_DIMENSIONS) || 256,
    timeoutMs: Number(process.env.MATCH_EMBED_TIMEOUT_MS) || 20000,
    batchSize: 32,
    minSimilarity: Number(process.env.MATCH_EMBED_MIN_SIM) || 0.55,
    fullSimilarity: Number(process.env.MATCH_EMBED_FULL_SIM) || 0.75,
  }),
});

module.exports = { MATCHING_CONFIG };
