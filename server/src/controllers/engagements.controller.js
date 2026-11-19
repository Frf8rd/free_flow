const service = require("../services/engagements.service");

async function create(req, res) {
  const engagement = await service.createEngagement(req.user.id, req.body?.projectId);
  res.status(201).json({ data: engagement });
}

async function list(req, res) {
  res.json({ data: await service.listEngagements(req.user) });
}

async function update(req, res) {
  res.json({ data: await service.updateEngagement(req.user.id, req.params.id, req.body?.status) });
}

module.exports = { create, list, update };
