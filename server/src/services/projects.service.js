const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");

const PROJECT_STATUSES = new Set(["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"]);
const projectInclude = {
  category: { select: { id: true, name: true } },
  client: { select: { id: true, name: true } },
  skills: {
    include: {
      skill: { select: { id: true, name: true } },
    },
  },
};

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

  return db.project.create({
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
    where.status = query.status;
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
  if (minBudget !== null) where.budgetMax = { gte: minBudget };
  if (maxBudget !== null) where.budgetMin = { lte: maxBudget };

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
  return { data, page, limit, total };
}

async function getProject(id, db = prisma) {
  if (typeof id !== "string" || !id.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Identificatorul proiectului nu este valid.");
  }
  const project = await db.project.findUnique({
    where: { id: id.trim() },
    include: projectInclude,
  });
  if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  return project;
}

module.exports = { createProject, listProjects, getProject };
