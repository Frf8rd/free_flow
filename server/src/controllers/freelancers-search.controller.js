const searchService = require("../services/freelancers-search.service");

async function list(req, res) {
  res.json(await searchService.searchFreelancers(req.query));
}

module.exports = { list };