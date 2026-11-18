const { normalize, tokenize, containsPhrase, languageMatches, detectLanguage } = require('./text');
const { scoreSkills, scoreFreelancerForProject, rankFreelancers, estimateCost } = require('./scoring');
const { MATCHING_CONFIG } = require('./config');
const { extractProjectData, extractProjectDataWithAI, createOpenAICompatibleAnalyzer, validateAiAnalysis } = require('./extract');
const { filterFreelancers } = require('./filters');
const { applyFairness } = require('./fairness');
const { buildReasons } = require('./explain');

module.exports = {
  normalize,
  tokenize,
  containsPhrase,
  languageMatches,
  detectLanguage,
  scoreSkills,
  scoreFreelancerForProject,
  rankFreelancers,
  estimateCost,
  MATCHING_CONFIG,
  extractProjectData,
  extractProjectDataWithAI,
  createOpenAICompatibleAnalyzer,
  validateAiAnalysis,
  filterFreelancers,
  applyFairness,
  buildReasons,
};
