const projectsService = require("../services/projects.service");
const { writeAuditLog } = require("../utils/auditLog");
const { getIo } = require("../realtime");

async function create(req, res) {
  const project = await projectsService.createProject(req.user.id, req.body);
  writeAuditLog("project.created", { actorId: req.user.id, resourceId: project.id });
  const io = getIo();
  if (io) io.to("projects:browse").emit("projects:new", { id: project.id, createdAt: project.createdAt });
  res.status(201).json({ data: project });
}

async function update(req, res) {
  const project = await projectsService.updateProject(req.params.id, req.user.id, req.body);
  writeAuditLog("project.updated", { actorId: req.user.id, resourceId: project.id });
  res.json({ data: project });
}

async function close(req, res) {
  const project = await projectsService.closeProject(req.params.id, req.user.id);
  writeAuditLog("project.closed", { actorId: req.user.id, resourceId: project.id });
  res.json({ data: project });
}

async function reopen(req, res) {
  const project = await projectsService.reopenProject(req.params.id, req.user.id);
  writeAuditLog("project.reopened", { actorId: req.user.id, resourceId: project.id });
  res.json({ data: project });
}

async function remove(req, res) {
  await projectsService.deleteProject(req.params.id, req.user.id);
  writeAuditLog("project.deleted", { actorId: req.user.id, resourceId: req.params.id });
  res.status(204).end();
}

async function list(req, res) {
  res.json(await projectsService.listProjects(req.query));
}

async function listMine(req, res) {
  res.json(await projectsService.listProjects(req.query, { clientId: req.user.id }));
}

async function getById(req, res) {
  res.json({ data: await projectsService.getProject(req.params.id) });
}

module.exports = { create, update, close, reopen, remove, list, listMine, getById };
