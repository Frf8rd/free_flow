const service = require("../services/freelancers.service");
const { writeAuditLog } = require("../utils/auditLog");
const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");

async function getMe(req, res) {
  res.json({ data: await service.getMyProfile(req.user.id) });
}

async function updateMe(req, res) {
  const data = await service.updateMyProfile(req.user.id, req.body);
  writeAuditLog("freelancer.profile_updated", { actorId: req.user.id, resourceId: req.user.id });
  res.json({ data });
}

async function getById(req, res) {
  res.json({ data: await service.getFreelancerProfile(req.params.id) });
}

async function listPortfolio(req, res) {
  res.json({ data: await service.listMyPortfolio(req.user.id) });
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

async function tier(req, res) {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId: req.user.id }, select: { tier: true, completedCount: true } });
  if (!profile) throw new AppError(404, "FREELANCER_PROFILE_NOT_FOUND", "Profilul nu a fost găsit.");
  res.json({ data: { tier: profile.tier, completedCount: profile.completedCount, progress: null } });
}

async function exposure(req, res) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [profile, impressions, matches] = await Promise.all([
    prisma.freelancerProfile.findUnique({ where: { userId: req.user.id }, select: { id: true } }),
    prisma.recommendationImpression.count({ where: { viewerUserId: req.user.id, side: "FREELANCER", shownAt: { gte: since } } }),
    prisma.match.groupBy({ by: ["status"], where: { freelancer: { userId: req.user.id }, updatedAt: { gte: since } }, _count: { _all: true } }),
  ]);
  if (!profile) throw new AppError(404, "FREELANCER_PROFILE_NOT_FOUND", "Profilul nu a fost găsit.");
  const counts = new Map(matches.map((row) => [row.status, row._count._all]));
  res.json({ data: { impressions7d: impressions, interests7d: counts.get("FREELANCER_INTERESTED") ?? 0, invites7d: counts.get("CLIENT_INVITED") ?? 0 } });
}

module.exports = { getMe, updateMe, getById, listPortfolio, createPortfolioItem, updatePortfolioItem, deletePortfolioItem, tier, exposure };
