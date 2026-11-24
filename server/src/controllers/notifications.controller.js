const notificationsService = require("../services/notifications.service");

async function list(req, res) {
  res.json(await notificationsService.listNotifications(req.user.id, req.query));
}

async function read(req, res) {
  res.json({ data: await notificationsService.markRead(req.user.id, req.params.id) });
}

async function readAll(req, res) {
  res.json({ data: await notificationsService.markAllRead(req.user.id) });
}

module.exports = { list, read, readAll };