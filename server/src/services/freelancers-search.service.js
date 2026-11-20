const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { parsePagination } = require("../utils/pagination");

// Filtre din specificație care au nevoie de date care nu există încă în baza de date
// (abilități, tarif și disponibilitate declarate de freelancer). Sunt refuzate explicit,
// ca să nu primești rezultate greșite în tăcere.
const UNAVAILABLE_FILTERS = ["categoryId", "skillIds", "minRate", "maxRate", "availability"];

const freelancerSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  _count: { select: { freelancerEngagements: { where: { status: "COMPLETED" } } } },
};

function parseSearch(value) {
  if (value === undefined) return null;
  if (typeof value !== "string" || value.trim().length > 100) {
    throw new AppError(400, "VALIDATION_ERROR", "Căutarea trebuie să aibă maximum 100 de caractere.");
  }
  return value.trim() || null;
}

function toListItem({ _count, ...freelancer }) {
  return { ...freelancer, completedProjects: _count.freelancerEngagements };
}

async function searchFreelancers(query = {}, { db = prisma } = {}) {
  const { page, limit } = parsePagination(query);

  const unavailable = UNAVAILABLE_FILTERS.filter((filter) => query[filter] !== undefined);
  if (unavailable.length) {
    throw new AppError(
      400,
      "FILTER_NOT_AVAILABLE",
      `Filtrele ${unavailable.join(", ")} nu sunt disponibile încă pentru freelanceri.`
    );
  }

  const where = { role: "FREELANCER", isBlocked: false };
  const search = parseSearch(query.q);
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: freelancerSelect,
      // id ca al doilea criteriu: paginarea rămâne stabilă când mai mulți au același createdAt
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { data: rows.map(toListItem), page, limit, total };
}

module.exports = { searchFreelancers, UNAVAILABLE_FILTERS };