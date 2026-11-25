const adminService = require("../services/admin.service");
const { writeAuditLog } = require("../utils/auditLog");

async function users(req, res) {
  res.json(await adminService.listUsers(req.query));
}

async function updateUser(req, res) {
  const user = await adminService.updateUser(req.user.id, req.params.id, req.body);
  writeAuditLog("admin.user_updated", { actorId: req.user.id, resourceId: user.id });
  res.json({ data: user });
}

async function projects(req, res) {
  res.json(await adminService.listProjects(req.query));
}

async function deleteProject(req, res) {
  const project = await adminService.deleteProject(req.params.id);
  writeAuditLog("admin.project_deleted", { actorId: req.user.id, resourceId: project.id });
  res.status(204).end();
}

async function reports(req, res) {
  res.json(await adminService.listReports(req.query));
}

async function resolveReport(req, res) {
  const report = await adminService.resolveReport(req.user.id, req.params.id, req.body);
  writeAuditLog("admin.report_resolved", { actorId: req.user.id, resourceId: report.id });
  res.json({ data: report });
}

async function stats(req, res) {
  res.json(await adminService.getStats());
}

module.exports = { users, updateUser, projects, deleteProject, reports, resolveReport, stats };
