const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const attachmentStorage = require("../utils/projectAttachmentStorage");
const { enqueueMatchingJob } = require("./matching/jobs");

const PROJECT_STATUSES = new Set(["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"]);
const projectInclude = {
  category: { select: { id: true, name: true } },
  client: { select: { id: true, name: true, avatarUrl: true, clientProfile: { select: { type: true, companyName: true } } } },
  _count: { select: { matches: true } },
  skills: {
    include: {
      skill: { select: { id: true, name: true, categoryId: true } },
    },
  },
  attachments: {
    select: { storageKey: true },
    orderBy: { createdAt: "asc" },
    take: 8,
  },
};

function withImageUrls(project) {
  const { attachments = [], ...data } = project;
  if (!attachments.length) return data;
  const images = attachments.map(({ storageKey }) => attachmentStorage.imageUrl(storageKey));
  return { ...data, images };
}

function parseOptionalBudget(value, field) {
  if (value === undefined || value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} trebuie să fie un număr întreg pozitiv.`);
  }
  return value;
}

function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "Parametrul page trebuie să fie un număr pozitiv.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError(400, "VALIDATION_ERROR", "Parametrul limit trebuie să fie între 1 și 100.");
  }
  return { page, limit };
}

function parseFilterBudget(value, field) {
  if (value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} trebuie să fie un număr întreg pozitiv.`);
  }
  return parsed;
}

function parseSkillIds(value) {
  if (value === undefined) return [];
  const ids = Array.isArray(value) ? value : String(value).split(",");
  if (
    ids.length > 20 ||
    ids.some((id) => typeof id !== "string" || !id.trim()) ||
    new Set(ids).size !== ids.length
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Lista de abilități este invalidă.");
  }
  return ids;
}

async function createProject(clientId, input, db = prisma) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "VALIDATION_ERROR", "Datele proiectului sunt invalide.");
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const categoryId = typeof input.categoryId === "string" ? input.categoryId.trim() : "";
  if (!title || title.length > 120) {
    throw new AppError(400, "VALIDATION_ERROR", "Titlul este obligatoriu și trebuie să aibă maximum 120 de caractere.");
  }
  if (!description || description.length > 5000) {
    throw new AppError(400, "VALIDATION_ERROR", "Descrierea este obligatorie și trebuie să aibă maximum 5000 de caractere.");
  }
  if (!categoryId) {
    throw new AppError(400, "VALIDATION_ERROR", "Categoria este obligatorie.");
  }

  const budgetMin = parseOptionalBudget(input.budgetMin, "Bugetul minim");
  const budgetMax = parseOptionalBudget(input.budgetMax, "Bugetul maxim");
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
    throw new AppError(400, "VALIDATION_ERROR", "Bugetul minim nu poate depăși bugetul maxim.");
  }

  let deadline = null;
  if (input.deadline !== undefined && input.deadline !== null && input.deadline !== "") {
    if (typeof input.deadline !== "string" || Number.isNaN(Date.parse(input.deadline))) {
      throw new AppError(400, "VALIDATION_ERROR", "Termenul proiectului nu este o dată validă.");
    }
    deadline = new Date(input.deadline);
    if (input.deadline.slice(0, 10) < new Date().toISOString().slice(0, 10)) {
      throw new AppError(400, "VALIDATION_ERROR", "Termenul proiectului nu poate fi în trecut.");
    }
  }

  const skillIds = parseSkillIds(input.skillIds);
  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new AppError(400, "INVALID_CATEGORY", "Categoria selectată nu există.");
  }

  if (skillIds.length) {
    const skills = await db.skill.findMany({
      where: { id: { in: skillIds }, categoryId },
      select: { id: true },
    });
    if (skills.length !== skillIds.length) {
      throw new AppError(400, "INVALID_SKILLS", "Selectează abilități existente din categoria proiectului.");
    }
  }

  const create = async (tx) => {
    const project = await tx.project.create({
      data: {
      clientId,
      title,
      description,
      categoryId,
      budgetMin,
      budgetMax,
      deadline,
      ...(skillIds.length
        ? { skills: { create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })) } }
        : {}),
      },
      include: projectInclude,
    });
    if (db === prisma) await enqueueMatchingJob("PROJECT", project.id, tx);
    return project;
  };
  const project = db === prisma ? await db.$transaction(create) : await create(db);
  return withImageUrls(project);
}

function validateProjectInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "VALIDATION_ERROR", "Datele proiectului sunt invalide.");
  }
}

async function findOwnedProject(projectId, clientId, db) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Identificatorul proiectului nu este valid.");
  }
  const project = await db.project.findUnique({
    where: { id: projectId.trim() },
    select: {
      id: true,
      clientId: true,
      status: true,
      categoryId: true,
      budgetMin: true,
      budgetMax: true,
    },
  });
  if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  if (project.clientId !== clientId) {
    throw new AppError(403, "FORBIDDEN", "Poți modifica doar proiectele create de tine.");
  }
  return project;
}

async function updateProject(projectId, clientId, input, db = prisma) {
  validateProjectInput(input);
  const allowedFields = new Set([
    "title",
    "description",
    "categoryId",
    "budgetMin",
    "budgetMax",
    "deadline",
    "skillIds",
  ]);
  const fields = Object.keys(input);
  if (!fields.length || fields.some((field) => !allowedFields.has(field))) {
    throw new AppError(400, "VALIDATION_ERROR", "Datele pentru actualizare sunt invalide.");
  }

  const project = await findOwnedProject(projectId, clientId, db);
  if (project.status !== "OPEN") {
    throw new AppError(409, "PROJECT_NOT_EDITABLE", "Poți modifica doar proiectele deschise.");
  }

  const data = {};
  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Titlul este obligatoriu și trebuie să aibă maximum 120 de caractere.");
    }
    data.title = input.title.trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    if (typeof input.description !== "string" || !input.description.trim() || input.description.trim().length > 5000) {
      throw new AppError(400, "VALIDATION_ERROR", "Descrierea este obligatorie și trebuie să aibă maximum 5000 de caractere.");
    }
    data.description = input.description.trim();
  }

  const categoryId = Object.prototype.hasOwnProperty.call(input, "categoryId")
    ? typeof input.categoryId === "string" ? input.categoryId.trim() : ""
    : project.categoryId;
  if (Object.prototype.hasOwnProperty.call(input, "categoryId")) {
    if (!categoryId) throw new AppError(400, "VALIDATION_ERROR", "Categoria este obligatorie.");
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new AppError(400, "INVALID_CATEGORY", "Categoria selectată nu există.");
    data.categoryId = categoryId;
  }

  const budgetMin = Object.prototype.hasOwnProperty.call(input, "budgetMin")
    ? parseOptionalBudget(input.budgetMin, "Bugetul minim")
    : project.budgetMin;
  const budgetMax = Object.prototype.hasOwnProperty.call(input, "budgetMax")
    ? parseOptionalBudget(input.budgetMax, "Bugetul maxim")
    : project.budgetMax;
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
    throw new AppError(400, "VALIDATION_ERROR", "Bugetul minim nu poate depăși bugetul maxim.");
  }
  if (Object.prototype.hasOwnProperty.call(input, "budgetMin")) data.budgetMin = budgetMin;
  if (Object.prototype.hasOwnProperty.call(input, "budgetMax")) data.budgetMax = budgetMax;

  if (Object.prototype.hasOwnProperty.call(input, "deadline")) {
    if (input.deadline === null || input.deadline === "") {
      data.deadline = null;
    } else if (typeof input.deadline !== "string" || Number.isNaN(Date.parse(input.deadline))) {
      throw new AppError(400, "VALIDATION_ERROR", "Termenul proiectului nu este o dată validă.");
    } else {
      data.deadline = new Date(input.deadline);
      if (input.deadline.slice(0, 10) < new Date().toISOString().slice(0, 10)) {
        throw new AppError(400, "VALIDATION_ERROR", "Termenul proiectului nu poate fi în trecut.");
      }
    }
  }

  const categoryChanged = categoryId !== project.categoryId;
  if (Object.prototype.hasOwnProperty.call(input, "skillIds")) {
    const skillIds = parseSkillIds(input.skillIds);
    if (skillIds.length) {
      const skills = await db.skill.findMany({
        where: { id: { in: skillIds }, categoryId },
        select: { id: true },
      });
      if (skills.length !== skillIds.length) {
        throw new AppError(400, "INVALID_SKILLS", "Selectează abilități existente din categoria proiectului.");
      }
    }
    data.skills = {
      deleteMany: {},
      ...(skillIds.length
        ? { create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })) }
        : {}),
    };
  } else if (categoryChanged) {
    data.skills = { deleteMany: {} };
  }

  const update = async (tx) => {
    const updated = await tx.project.update({
      where: { id: project.id },
      data,
      include: projectInclude,
    });
    if (db === prisma && project.status === "OPEN") await enqueueMatchingJob("PROJECT", updated.id, tx);
    return updated;
  };
  const updated = db === prisma ? await db.$transaction(update) : await update(db);
  return withImageUrls(updated);
}

async function closeProject(projectId, clientId, db = prisma) {
  const project = await findOwnedProject(projectId, clientId, db);
  if (project.status === "CLOSED") return getProject(project.id, db, { id: clientId });
  if (project.status !== "OPEN") throw new AppError(409, "PROJECT_NOT_CLOSABLE", "Un proiect aflat în lucru sau finalizat nu poate fi închis.");
  return db.project.update({
    where: { id: project.id },
    data: { status: "CLOSED" },
    include: projectInclude,
  }).then(withImageUrls);
}

async function reopenProject(projectId, clientId, db = prisma) {
  const project = await findOwnedProject(projectId, clientId, db);
  if (project.status !== "CLOSED") {
    throw new AppError(409, "PROJECT_NOT_CLOSED", "Doar proiectele închise pot fi redeschise.");
  }
  const reopen = async (tx) => {
    const reopened = await tx.project.update({
      where: { id: project.id },
      data: { status: "OPEN" },
      include: projectInclude,
    });
    if (db === prisma) await enqueueMatchingJob("PROJECT", reopened.id, tx);
    return reopened;
  };
  const reopened = db === prisma ? await db.$transaction(reopen) : await reopen(db);
  return withImageUrls(reopened);
}

async function deleteProject(projectId, clientId, db = prisma) {
  const project = await findOwnedProject(projectId, clientId, db);
  if (project.status === "IN_PROGRESS" || project.status === "COMPLETED") {
    throw new AppError(409, "PROJECT_HAS_HISTORY", "Un proiect aflat în lucru sau finalizat nu poate fi șters.");
  }
  const [engagement, conversation] = await Promise.all([
    db.engagement.findFirst({ where: { projectId: project.id }, select: { id: true } }),
    db.conversation.findFirst({ where: { projectId: project.id }, select: { id: true } }),
  ]);
  if (engagement || conversation) throw new AppError(409, "PROJECT_HAS_HISTORY", "Proiectul are colaborări sau conversații asociate; închide-l în loc să-l ștergi.");
  const attachments = db.projectAttachment
    ? await db.projectAttachment.findMany({ where: { projectId: project.id }, select: { storageKey: true } })
    : [];
  await db.project.delete({ where: { id: project.id } });
  await Promise.all(attachments.map(({ storageKey }) => attachmentStorage.removeImage(storageKey).catch((error) => {
    console.error("Private project image cleanup failed.", { code: error.code || "UNKNOWN" });
  })));
}

async function listProjects(query = {}, { clientId, db = prisma } = {}) {
  const { page, limit } = parsePagination(query);
  const where = {};

  if (clientId) where.clientId = clientId;
  else where.status = "OPEN";

  if (query.status !== undefined) {
    if (!PROJECT_STATUSES.has(query.status)) {
      throw new AppError(400, "VALIDATION_ERROR", "Starea proiectului nu este validă.");
    }
    if (clientId) where.status = query.status;
    else if (query.status !== "OPEN") throw new AppError(403, "FORBIDDEN", "Poți lista doar proiectele deschise.");
  }
  if (query.categoryId !== undefined) {
    if (typeof query.categoryId !== "string" || !query.categoryId.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "Categoria nu este validă.");
    }
    where.categoryId = query.categoryId.trim();
  }
  if (query.q !== undefined) {
    if (typeof query.q !== "string" || query.q.trim().length > 100) {
      throw new AppError(400, "VALIDATION_ERROR", "Căutarea trebuie să aibă maximum 100 de caractere.");
    }
    const search = query.q.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
  }

  const skillIds = parseSkillIds(query.skillIds);
  if (skillIds.length) where.skills = { some: { skillId: { in: skillIds } } };

  const minBudget = parseFilterBudget(query.minBudget, "Bugetul minim");
  const maxBudget = parseFilterBudget(query.maxBudget, "Bugetul maxim");
  if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
    throw new AppError(400, "VALIDATION_ERROR", "Bugetul minim nu poate depăși bugetul maxim.");
  }
  if (minBudget !== null) {
    where.AND = [...(where.AND || []), { OR: [{ budgetMax: { gte: minBudget } }, { budgetMax: null }] }];
  }
  if (maxBudget !== null) {
    where.AND = [...(where.AND || []), { OR: [{ budgetMin: { lte: maxBudget } }, { budgetMin: null }] }];
  }

  const [total, data] = await Promise.all([
    db.project.count({ where }),
    db.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const projectIds = data.map(({ id }) => id);
  const interested = projectIds.length && db.match?.groupBy
    ? await db.match.groupBy({ by: ["projectId", "status"], where: { projectId: { in: projectIds }, status: { in: ["FREELANCER_INTERESTED", "CLIENT_INVITED", "ACCEPTED"] } }, _count: { _all: true } })
    : [];
  const interestedByProject = new Map();
  for (const row of interested) interestedByProject.set(row.projectId, (interestedByProject.get(row.projectId) ?? 0) + row._count._all);
  return { data: data.map(({ _count, ...project }) => ({ ...withImageUrls(project), matchesCount: _count?.matches ?? 0, interestedCount: interestedByProject.get(project.id) ?? 0 })), page, limit, total };
}

async function getProject(id, db = prisma, viewer = null) {
  if (typeof id !== "string" || !id.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Identificatorul proiectului nu este valid.");
  }
  const project = await db.project.findUnique({
    where: { id: id.trim() },
    include: projectInclude,
  });
  if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  if (project.status !== "OPEN" && project.clientId !== viewer?.id) {
    if (!viewer?.id) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
    const participant = await db.engagement.findFirst({
      where: { projectId: project.id, status: { in: ["IN_PROGRESS", "DELIVERED", "COMPLETED"] }, OR: [{ clientId: viewer.id }, { freelancerId: viewer.id }] },
      select: { id: true },
    });
    if (!participant) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  }
  return withImageUrls(project);
}

module.exports = {
  createProject,
  updateProject,
  closeProject,
  reopenProject,
  deleteProject,
  listProjects,
  getProject,
};
