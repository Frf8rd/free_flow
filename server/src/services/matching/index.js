const { normalize, tokenize, containsPhrase } = require('./text');
const { scoreSkills, rankFreelancers } = require('./scoring');
const { MATCHING_CONFIG } = require('./config');
const { extractProjectData } = require('./extract');
const { filterFreelancers } = require('./filters');

module.exports = {
  normalize,
  tokenize,
  containsPhrase,
  scoreSkills,
  rankFreelancers,
  MATCHING_CONFIG,
  extractProjectData,
  filterFreelancers,
};
