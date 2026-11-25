const clientsService = require("../services/clients.service");
const { writeAuditLog } = require("../utils/auditLog");

async function getMe(req, res) {
  res.json({ data: await clientsService.getMyProfile(req.user.id) });
}

async function updateMe(req, res) {
  const data = await clientsService.updateMyProfile(req.user.id, req.body);
  writeAuditLog("client.profile_updated", { actorId: req.user.id, resourceId: req.user.id });
  res.json({ data });
}

module.exports = { getMe, updateMe };