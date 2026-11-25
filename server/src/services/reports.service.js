const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { createReportSchema, parse } = require("../validators/reports.validator");

const DAY_MS = 24 * 60 * 60 * 1000;
// Maximum de raportări trimise de un utilizator în ultimele 24 de ore (împotriva abuzului sistemului de raportare).
const MAX_REPORTS_PER_DAY = 10;

const reportSelect = {
  id: true,
  targetType: true,
  targetId: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
};

async function assertTargetReportable(reporterId, { targetType, targetId }, db) {
  if (targetType === "USER") {
    if (targetId === reporterId) {
      throw new AppError(400, "SELF_REPORT", "Nu te poți raporta pe tine însuți.");
    }
    const user = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!user) throw new AppError(404, "REPORT_TARGET_NOT_FOUND", "Utilizatorul raportat nu a fost găsit.");
    return;
  }

  const project = await db.project.findUnique({ where: { id: targetId }, select: { id: true, clientId: true } });
  if (!project) throw new AppError(404, "REPORT_TARGET_NOT_FOUND", "Proiectul raportat nu a fost găsit.");
  if (project.clientId === reporterId) {
    throw new AppError(400, "SELF_REPORT", "Nu îți poți raporta propriul proiect.");
  }
}

async function createReport(reporterId, input, db = prisma) {
  const data = parse(createReportSchema, input);
  await assertTargetReportable(reporterId, data, db);

  const duplicate = await db.report.findFirst({
    where: { reporterId, targetType: data.targetType, targetId: data.targetId, status: "OPEN" },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError(409, "REPORT_EXISTS", "Ai raportat deja acest conținut, iar raportul este în curs de analiză.");
  }

  const recent = await db.report.count({
    where: { reporterId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
  });
  if (recent >= MAX_REPORTS_PER_DAY) {
    throw new AppError(429, "REPORT_LIMIT_REACHED", "Ai atins limita zilnică de raportări. Încearcă mâine.");
  }

  return db.report.create({
    data: { reporterId, ...data },
    select: reportSelect,
  });
}

module.exports = { createReport, MAX_REPORTS_PER_DAY };