const service = require("../services/freelancers.service");
const { writeAuditLog } = require("../utils/auditLog");

async function getMe(req, res) {
  res.json({ data: await service.getMyProfile(req.user.id) });
}

async function updateMe(req, res) {
  const data = await service.updateMyProfile(req.user.id, req.body);
  writeAuditLog("freelancer.profile_updated", { actorId: req.user.id, resourceId: req.user.id });
  res.json({ data });
}

async function getById(req, res) {
  res.json({ data: await service.getFreelancerById(req.params.id) });
}

async function listPortfolio(req, res) {
  res.json({ data: await service.listPortfolio(req.user.id) });
}

async function createPortfolioItem(req, res) {
  const data = await service.createPortfolioItem(req.user.id, req.body);
  writeAuditLog("portfolio.created", { actorId: req.user.id, resourceId: data.id });
  res.status(201).json({ data });
}

async function updatePortfolioItem(req, res) {
  const data = await service.updatePortfolioItem(req.user.id, req.params.itemId, req.body);
  writeAuditLog("portfolio.updated", { actorId: req.user.id, resourceId: data.id });
  res.json({ data });
}

async function deletePortfolioItem(req, res) {
  await service.deletePortfolioItem(req.user.id, req.params.itemId);
  writeAuditLog("portfolio.deleted", { actorId: req.user.id, resourceId: req.params.itemId });
  res.status(204).end();
}

module.exports = { getMe, updateMe, getById, listPortfolio, createPortfolioItem, updatePortfolioItem, deletePortfolioItem };