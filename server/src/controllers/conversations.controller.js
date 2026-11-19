const service = require("../services/conversations.service");

async function list(req, res) { res.json({ data: await service.listConversations(req.user.id) }); }
async function messages(req, res) { res.json(await service.getMessages(req.user.id, req.params.id, req.query)); }
async function send(req, res) { res.status(201).json({ data: await service.sendMessage(req.user.id, req.params.id, req.body) }); }
async function read(req, res) { res.json({ data: await service.markRead(req.user.id, req.params.id) }); }

module.exports = { list, messages, send, read };
