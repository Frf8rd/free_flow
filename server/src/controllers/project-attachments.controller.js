const service = require("../services/project-attachments.service");

async function list(req, res) {
  const data = await service.listAttachments(req.user, req.params.id);
  res.json({ data });
}

async function upload(req, res) {
  const data = await service.uploadAttachment(req.user.id, req.params.id, req.file);
  res.status(201).json({ data });
}

async function file(req, res) {
  const attachment = await service.getAttachment(req.user, req.params.id, req.params.attachmentId);
  res.set({
    "Content-Type": "image/webp",
    "Content-Length": attachment.buffer.length,
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(attachment.buffer);
}

async function remove(req, res) {
  await service.deleteAttachment(req.user.id, req.params.id, req.params.attachmentId);
  res.status(204).end();
}

module.exports = { list, upload, file, remove };
