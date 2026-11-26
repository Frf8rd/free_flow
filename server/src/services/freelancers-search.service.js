const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { parsePagination } = require("../utils/pagination");

const freelancerSelect = {
  id: true, name: true, avatarUrl: true, createdAt: true,
  _count: { select: { freelancerEngagements: { where: { status: "COMPLETED" } } } },
  freelancerProfile: { select: {
    id: true, title: true, bio: true, level: true, hourlyRate: true, availability: true,
    languages: true, onboarded: true, tier: true,
    skills: { select: { level: true, verified: true, skill: { select: { id: true, name: true, categoryId: true } } } },
    portfolio: { select: { id: true, title: true, description: true, imageUrl: true, link: true } },
  } },
};

function parseSearch(value) {
  if (value === undefined) return null;
  if (typeof value !== "string" || value.trim().length > 100) throw new AppError(400, "VALIDATION_ERROR", "Căutarea trebuie să aibă maximum 100 de caractere.");
  return value.trim() || null;
}

function parseIds(value) {
  if (value === undefined) return [];
  const ids = Array.isArray(value) ? value : String(value).split(",");
  if (ids.length > 20 || ids.some((id) => typeof id !== "string" || !id.trim())) throw new AppError(400, "VALIDATION_ERROR", "Lista de abilități nu este validă.");
  return [...new Set(ids.map((id) => id.trim()))];
}

function parseRate(value, field) {
  if (value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new AppError(400, "VALIDATION_ERROR", `${field} trebuie să fie un număr întreg pozitiv.`);
  return parsed;
}

function toListItem({ _count, freelancerProfile: profile, ...user }) {
  return {
    ...user,
    ...(profile ? {
      profileId: profile.id, title: profile.title, bio: profile.bio, level: profile.level,
      hourlyRate: profile.hourlyRate, availability: profile.availability, languages: profile.languages,
      onboarded: profile.onboarded, tier: profile.tier,
      skills: profile.skills.map(({ skill, ...meta }) => ({ ...skill, ...meta })),
      portfolio: profile.portfolio,
    } : {}),
    completedProjects: _count.freelancerEngagements,
  };
}

async function searchFreelancers(query = {}, { db = prisma } = {}) {
  const { page, limit } = parsePagination(query);
  const profile = { onboarded: true };
  const where = { role: "FREELANCER", isBlocked: false, freelancerProfile: profile };
  const search = parseSearch(query.q);
  if (search) where.name = { contains: search, mode: "insensitive" };
  const profileConditions = [];
  if (query.categoryId !== undefined) {
    if (typeof query.categoryId !== "string" || !query.categoryId.trim()) throw new AppError(400, "VALIDATION_ERROR", "Categoria invalidă.");
    profileConditions.push({ skills: { some: { skill: { categoryId: query.categoryId.trim() } } } });
  }
  const skillIds = parseIds(query.skillIds);
  if (skillIds.length) profileConditions.push({ skills: { some: { skillId: { in: skillIds } } } });
  if (profileConditions.length) profile.AND = profileConditions;
  if (query.availability !== undefined) {
    if (!["AVAILABLE", "LIMITED", "UNAVAILABLE"].includes(query.availability)) throw new AppError(400, "VALIDATION_ERROR", "Disponibilitatea nu este validă.");
    profile.availability = query.availability;
  }
  const minRate = parseRate(query.minRate, "Tariful minim");
  const maxRate = parseRate(query.maxRate, "Tariful maxim");
  if (minRate !== null && maxRate !== null && minRate > maxRate) throw new AppError(400, "VALIDATION_ERROR", "Tariful minim nu poate depăși tariful maxim.");
  if (minRate !== null || maxRate !== null) profile.hourlyRate = { ...(minRate !== null ? { gte: minRate } : {}), ...(maxRate !== null ? { lte: maxRate } : {}) };

  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, select: freelancerSelect, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit }),
  ]);
  return { data: rows.map(toListItem), page, limit, total };
}

module.exports = { searchFreelancers };
