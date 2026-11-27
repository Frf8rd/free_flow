const service = require("../services/engagements.service");
const { getIo } = require("../realtime");
const notifications = require("../services/notifications.service");

async function create(req, res) {
  const engagement = await service.createEngagement(req.user.id, req.body);
  void notifications.notifyEngagementRequested(engagement);
  const io = getIo();
  if (io) {
    io.to(`user:${engagement.clientId}`).emit("engagement:new", {
      id: engagement.id,
      projectId: engagement.projectId,
      status: engagement.status,
    });
  }
  res.status(201).json({ data: engagement });
}

async function discloseAi(req, res) {
  res.json({ data: await service.discloseAiUse(req.user, req.params.id, req.body?.usedAi) });
}

async function list(req, res) {
  res.json({ data: await service.listEngagements(req.user) });
}

async function getById(req, res) {
  res.json({ data: await service.getEngagement(req.user, req.params.id) });
}

async function update(req, res) {
  const engagement = await service.updateEngagement(req.user, req.params.id, req.body);
  void notifications.notifyEngagementUpdated(engagement, req.user.id);
  const io = getIo();
  if (io) {
    const event = {
      id: engagement.id,
      projectId: engagement.projectId,
      status: engagement.status,
      updatedAt: engagement.updatedAt,
      conversation: engagement.conversation,
    };
    io.to(`user:${engagement.clientId}`).emit("engagement:updated", event);
    io.to(`user:${engagement.freelancerId}`).emit("engagement:updated", event);
  }
  res.json({ data: engagement });
}

module.exports = { create, list, getById, update, discloseAi };
