/** Setările algoritmului sunt centralizate pentru a putea fi calibrate ușor. */
const MATCHING_CONFIG = Object.freeze({
  algorithmVersion: '1.0.0',
  weights: Object.freeze({
    skills: 0.35,
    evidence: 0.2,
    budget: 0.15,
    availability: 0.1,
    level: 0.1,
    reviews: 0.05,
    language: 0.05,
  }),
  filters: Object.freeze({
    // Peste 2x costul maxim al proiectului, candidatul nu mai este eligibil.
    maxPriceOverrun: 2,
    unavailableValues: Object.freeze(['UNAVAILABLE', 'INACTIVE']),
    requireAllEssentialSkills: true,
  }),
  limits: Object.freeze({
    candidates: 300,
    matchesPerProject: 50,
    matchesPerFreelancer: 50,
    notifyTop: 5,
  }),
  // Estimări inițiale, folosite doar când brief-ul nu conține durata.
  sizeHours: Object.freeze({ SMALL: 10, MEDIUM: 40, LARGE: 120 }),
});

module.exports = { MATCHING_CONFIG };
