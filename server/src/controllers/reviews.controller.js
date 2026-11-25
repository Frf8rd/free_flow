const service = require("../services/reviews.service");
const { writeAuditLog } = require("../utils/auditLog");

async function create(req, res) {
  const data = await service.createReview(req.user, req.params.id, req.body);
  writeAuditLog("review.created", { actorId: req.user.id, resourceId: data.id });
  res.status(201).json({ data });
}

async function update(req, res) {
  const data = await service.updateReview(req.user, req.params.id, req.body);
  writeAuditLog("review.updated", { actorId: req.user.id, resourceId: data.id });
  res.json({ data });
}

async function remove(req, res) {
  await service.deleteReview(req.user, req.params.id);
  writeAuditLog("review.deleted", { actorId: req.user.id, resourceId: req.params.id });
  res.status(204).end();
}

async function listForFreelancer(req, res) {
  res.json(await service.listFreelancerReviews(req.params.id, req.query));
}

module.exports = { create, update, remove, listForFreelancer };