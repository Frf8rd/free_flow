const { normalize, tokenize, containsPhrase, languageMatches, detectLanguage } = require('./text');
const { scoreSkills, scoreFreelancerForProject, rankFreelancers, rankProjectsForFreelancer, estimateCost } = require('./scoring');
const { MATCHING_CONFIG } = require('./config');
const { extractProjectData, extractProjectDataWithAI, createOpenAICompatibleAnalyzer, validateAiAnalysis } = require('./extract');
const { filterFreelancers } = require('./filters');
const { applyFairness } = require('./fairness');
const { buildReasons } = require('./explain');
const { cosineSimilarity, projectText, portfolioText, createPortfolioEmbedder, rankFreelancersWithEmbeddings } = require('./semantic');
const { createMatchingQueue, createInMemoryQueueAdapter } = require('./queue');
const { createMatchingWorker } = require('./worker');

module.exports = {
  normalize,
  tokenize,
  containsPhrase,
  languageMatches,
  detectLanguage,
  scoreSkills,
  scoreFreelancerForProject,
  rankFreelancers,
  rankProjectsForFreelancer,
  estimateCost,
  MATCHING_CONFIG,
  extractProjectData,
  extractProjectDataWithAI,
  createOpenAICompatibleAnalyzer,
  validateAiAnalysis,
  filterFreelancers,
  applyFairness,
  buildReasons,
  cosineSimilarity,
  projectText,
  portfolioText,
  createPortfolioEmbedder,
  rankFreelancersWithEmbeddings,
  createMatchingQueue,
  createInMemoryQueueAdapter,
  createMatchingWorker,
};
