const reportsService = require("../services/reports.service");
const { writeAuditLog } = require("../utils/auditLog");

async function create(req, res) {
  const report = await reportsService.createReport(req.user.id, req.body);
  writeAuditLog("report.created", { actorId: req.user.id, resourceId: report.id });
  res.status(201).json({ data: report });
}

module.exports = { create };