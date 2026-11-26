const notificationsService = require("../services/notifications.service");

async function list(req, res) {
  const result = await notificationsService.listNotifications(req.user.id, req.query);
  res.json({ ...result, data: result.data.map(({ readAt, ...item }) => ({ ...item, isRead: Boolean(readAt) })) });
}

async function read(req, res) {
  const { readAt, ...item } = await notificationsService.markRead(req.user.id, req.params.id);
  res.json({ data: { ...item, isRead: Boolean(readAt) } });
}

async function readAll(req, res) {
  res.json({ data: await notificationsService.markAllRead(req.user.id) });
}

module.exports = { list, read, readAll };
