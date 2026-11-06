const { normalize, tokenize, containsPhrase } = require('./text');
const { scoreSkills, rankFreelancers } = require('./scoring');

module.exports = {
  normalize,
  tokenize,
  containsPhrase,
  scoreSkills,
  rankFreelancers,
};
