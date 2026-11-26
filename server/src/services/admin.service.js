const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { isAdminAllowlisted } = require("../utils/adminAccess");
const { enqueueMatchingJob } = require("./matching/jobs");

const ROLES = new Set(["CLIENT", "FREELANCER", "ADMIN"]);
const PROJECT_STATUSES = new Set(["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"]);
const REPORT_STATUSES = new Set(["OPEN", "RESOLVED", "DISMISSED"]);

function parsePagination(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "Parametrul page trebuie să fie pozitiv.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError(400, "VALIDATION_ERROR", "Parametrul limit trebuie să fie între 1 și 100.");
  }
  return { page, limit };
}

function optionalEnum(value, allowed, field) {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !allowed.has(value)) {
    throw new AppError(400, "VALIDATION_ERROR", `Filtrul ${field} nu este valid.`);
  }
  return value;
}

function searchFilter(value) {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > 100) {
    throw new AppError(400, "VALIDATION_ERROR", "Căutarea trebuie să aibă maximum 100 de caractere.");
  }
  return value.trim();
}

async function listUsers(query = {}, db = prisma) {
  const { page, limit } = parsePagination(query);
  const search = searchFilter(query.search);
  const role = optionalEnum(query.role, ROLES, "rol");
  let isBlocked;
  if (query.blocked !== undefined && query.blocked !== "") {
    if (!["true", "false"].includes(query.blocked)) {
      throw new AppError(400, "VALIDATION_ERROR", "Filtrul blocked trebuie să fie true sau false.");
    }
    isBlocked = query.blocked === "true";
  }
  const where = {
    ...(role ? { role } : {}),
    ...(isBlocked === undefined ? {} : { isBlocked }),
    ...(search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
      : {}),
  };
  const [total, data] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        clientProfile: { select: { companyName: true, industry: true, onboarded: true } },
        freelancerProfile: { select: { title: true, level: true, hourlyRate: true, onboarded: true } },
        _count: { select: { projects: true, clientEngagements: true, freelancerEngagements: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { data, page, limit, total };
}

async function updateUser(adminId, userId, input, db = prisma) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Identificatorul utilizatorului nu este valid.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "VALIDATION_ERROR", "Modificările utilizatorului sunt invalide.");
  }
  const fields = Object.keys(input);
  if (
    fields.length === 0 ||
    fields.some((field) => !["role", "isBlocked", "name"].includes(field)) ||
    (input.name !== undefined && (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 80)) ||
    (input.role !== undefined && !ROLES.has(input.role)) ||
    (input.isBlocked !== undefined && typeof input.isBlocked !== "boolean")
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Specifică un nume, rol sau stare de blocare validă.");
  }
  if (adminId === userId && (input.role !== undefined || input.isBlocked === true)) {
    throw new AppError(400, "SELF_ADMIN_CHANGE", "Nu poți să-ți schimbi rolul sau să-ți blochezi propriul cont.");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, isBlocked: true },
  });
  if (!target) throw new AppError(404, "USER_NOT_FOUND", "Utilizatorul nu a fost găsit.");

  if (input.role === "ADMIN" && target.role !== "ADMIN" && !(await isAdminAllowlisted(target.email, db))) {
    throw new AppError(403, "ADMIN_NOT_ALLOWLISTED", "Adaugă emailul în allowlist înainte de a acorda rolul ADMIN.");
  }

  const data = { ...input };
  if (data.name !== undefined) data.name = data.name.trim();
  if (
    (input.role !== undefined && input.role !== target.role) ||
    (input.isBlocked === true && !target.isBlocked)
  ) {
    data.tokenVersion = { increment: 1 };
  }
  return db.user.update({
    where: { id: target.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
}

async function listProjects(query = {}, db = prisma) {
  const { page, limit } = parsePagination(query);
  const search = searchFilter(query.search);
  const status = optionalEnum(query.status, PROJECT_STATUSES, "status");
  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
      : {}),
  };
  const [total, data] = await Promise.all([
    db.project.count({ where }),
    db.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { data, page, limit, total };
}

async function updateProject(projectId, input, db = prisma) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Identificatorul proiectului nu este valid.");
  }
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !Object.keys(input).length ||
    Object.keys(input).some((field) => !["status", "title", "description", "budgetMin", "budgetMax", "deadline"].includes(field)) ||
    (input.status !== undefined && !PROJECT_STATUSES.has(input.status))
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Specifică un status valid pentru proiect.");
  }
  const project = await db.project.findUnique({ where: { id: projectId.trim() }, select: { id: true, status: true, budgetMin: true, budgetMax: true } });
  if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  const data = { ...input };
  for (const [field, min, max] of [["title", 1, 120], ["description", 1, 5000]]) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== "string" || data[field].trim().length < min || data[field].trim().length > max) {
      throw new AppError(400, "VALIDATION_ERROR", `Câmpul ${field} trebuie să aibă între ${min} și ${max} de caractere.`);
    }
    data[field] = data[field].trim();
  }
  for (const field of ["budgetMin", "budgetMax"]) {
    const value = data[field];
    if (value != null && (!Number.isInteger(value) || value < 0 || value > 2147483647)) {
      throw new AppError(400, "VALIDATION_ERROR", "Bugetul trebuie să fie un număr întreg valid.");
    }
  }
  const min = data.budgetMin === undefined ? project.budgetMin : data.budgetMin;
  const max = data.budgetMax === undefined ? project.budgetMax : data.budgetMax;
  if (min != null && max != null && min > max) throw new AppError(400, "VALIDATION_ERROR", "Bugetul minim depășește bugetul maxim.");
  if (data.deadline != null) {
    if (typeof data.deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.deadline)) {
      throw new AppError(400, "VALIDATION_ERROR", "Termenul trebuie să fie o dată validă.");
    }
    const deadline = new Date(data.deadline);
    if (!Number.isFinite(deadline.getTime()) || deadline.toISOString().slice(0, 10) !== data.deadline) {
      throw new AppError(400, "VALIDATION_ERROR", "Termenul trebuie să fie o dată validă.");
    }
    data.deadline = deadline;
  }
  const rematch = (data.status ?? project.status) === "OPEN" &&
    (project.status !== "OPEN" || Object.keys(data).some((field) => field !== "status"));
  const save = async (tx) => {
    const updated = await tx.project.update({
    where: { id: project.id },
    data: { ...data, ...(rematch ? { matchingStatus: "PENDING", matchingError: null } : {}) },
    include: {
      client: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
    },
    });
    if (rematch) await enqueueMatchingJob("PROJECT", project.id, tx);
    return updated;
  };
  return rematch ? db.$transaction(save) : save(db);
}

async function deleteProject(projectId, db = prisma) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Identificatorul proiectului nu este valid.");
  }
  const project = await db.project.findUnique({
    where: { id: projectId.trim() },
    select: { id: true },
  });
  if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  await db.project.delete({ where: { id: project.id } });
  return project;
}

async function listReports(query = {}, db = prisma) {
  const { page, limit } = parsePagination(query);
  const status = optionalEnum(query.status, REPORT_STATUSES, "status");
  const where = status ? { status } : {};
  const [total, data] = await Promise.all([
    db.report.count({ where }),
    db.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { data: await attachReportTargets(data, db), page, limit, total };
}

// Raportul păstrează doar targetType + targetId; pentru panoul de admin adăugăm un nume lizibil al țintei.
async function attachReportTargets(reports, db) {
  const ids = (type) => [...new Set(reports.filter((r) => r.targetType === type).map((r) => r.targetId))];
  const userIds = ids("USER");
  const projectIds = ids("PROJECT");
  const [users, projects] = await Promise.all([
    userIds.length ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }) : [],
    projectIds.length ? db.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, title: true } }) : [],
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  return reports.map((r) => {
    const found = r.targetType === "USER" ? userMap.get(r.targetId) : projectMap.get(r.targetId);
    return {
      ...r,
      target: found
        ? { id: r.targetId, exists: true, label: r.targetType === "USER" ? `${found.name} (${found.email})` : found.title }
        : { id: r.targetId, exists: false, label: "Conținut șters" },
    };
  });
}

async function resolveReport(adminId, reportId, input, db = prisma) {
  if (typeof reportId !== "string" || !reportId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Identificatorul raportului nu este valid.");
  }
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((field) => !["status", "resolution"].includes(field)) ||
    !["RESOLVED", "DISMISSED"].includes(input.status) ||
    (input.resolution !== undefined &&
      (typeof input.resolution !== "string" || input.resolution.trim().length > 1000))
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Statusul sau rezoluția raportului nu sunt valide.");
  }
  const report = await db.report.findUnique({
    where: { id: reportId.trim() },
    select: { id: true },
  });
  if (!report) throw new AppError(404, "REPORT_NOT_FOUND", "Raportul nu a fost găsit.");

  return db.report.update({
    where: { id: report.id },
    data: {
      status: input.status,
      resolution: input.resolution?.trim() || null,
      resolvedById: adminId,
      resolvedAt: new Date(),
    },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
  });
}

async function getStats(db = prisma) {
  const [users, projects, reports, engagements, usersByRole, projectsByStatus, reportsByStatus] = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.report.count(),
    db.engagement.count(),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.project.groupBy({ by: ["status"], _count: { _all: true } }),
    db.report.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const toCounts = (rows, key) => Object.fromEntries(
    rows.map((row) => [row[key], row._count._all]),
  );
  return {
    totals: { users, projects, reports, engagements },
    usersByRole: toCounts(usersByRole, "role"),
    projectsByStatus: toCounts(projectsByStatus, "status"),
    reportsByStatus: toCounts(reportsByStatus, "status"),
  };
}

async function getActivity(db = prisma) {
  const lastWeek = new Date(Date.now() - 7 * 86400000);
  const [newUsers, newProjects, blockedUsers, conversations, messages, reviews, matches, matchingProjects, engagements, jobs] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: lastWeek } } }),
    db.project.count({ where: { createdAt: { gte: lastWeek } } }),
    db.user.count({ where: { isBlocked: true } }),
    db.conversation.count(),
    db.message.count(),
    db.review.count(),
    db.match.groupBy({ by: ["status"], _count: { _all: true } }),
    db.project.groupBy({ by: ["matchingStatus"], _count: { _all: true } }),
    db.engagement.groupBy({ by: ["status"], _count: { _all: true } }),
    db.matchingJob.count(),
  ]);
  const by = (rows, key) => Object.fromEntries(rows.map((row) => [row[key], row._count._all]));
  return { newUsers, newProjects, blockedUsers, conversations, messages, reviews, jobs,
    matches: by(matches, "status"), matchingProjects: by(matchingProjects, "matchingStatus"), engagements: by(engagements, "status") };
}

module.exports = {
  listUsers,
  updateUser,
  listProjects,
  updateProject,
  deleteProject,
  listReports,
  resolveReport,
  getStats,
  getActivity,
};
