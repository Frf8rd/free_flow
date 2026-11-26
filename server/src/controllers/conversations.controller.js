const service = require("../services/conversations.service");
const { getIo } = require("../realtime");
const notifications = require("../services/notifications.service");

async function list(req, res) { res.json({ data: await service.listConversations(req.user.id) }); }
async function create(req, res) { res.status(201).json({ data: await service.startConversation(req.user, req.body?.projectId, req.body?.otherUserId) }); }
async function messages(req, res) { res.json(await service.getMessages(req.user.id, req.params.id, req.query)); }
async function send(req, res) {
  const message = await service.sendMessage(req.user.id, req.params.id, req.body);
  void notifications.notifyNewMessage({ conversationId: req.params.id, senderId: req.user.id, senderName: message.sender.name });
  const io = getIo();
  if (io) io.to(`conversation:${req.params.id}`).emit("message:new", message);
  res.status(201).json({ data: message });
}
async function read(req, res) {
  const result = await service.markRead(req.user.id, req.params.id);
  await notifications.markConversationRead(req.user.id, req.params.id);
  res.json({ data: result });
}

module.exports = { list, create, messages, send, read };
