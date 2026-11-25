const trustService = require("../services/trust.service");

async function getMine(req, res) {
  res.json({ data: await trustService.getMyTrust(req.user.id) });
}

async function getByUser(req, res) {
  res.json({ data: await trustService.getPublicTrust(req.params.userId) });
}

module.exports = { getMine, getByUser };