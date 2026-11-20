const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const {
  profileUpdateSchema,
  portfolioCreateSchema,
  portfolioUpdateSchema,
  parse,
  parseId,
} = require("../validators/freelancers.validator");

const MAX_PORTFOLIO_ITEMS = 30;

const portfolioSelect = {
  id: true,
  title: true,
  description: true,
  url: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
};

const publicProfileSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  portfolioItems: { select: portfolioSelect, orderBy: { createdAt: "desc" } },
};

async function getMyProfile(userId, db = prisma) {
  const profile = await db.user.findUnique({
    where: { id: userId },
    select: { ...publicProfileSelect, email: true },
  });
  if (!profile) throw new AppError(404, "NOT_FOUND", "Profilul nu a fost găsit.");
  return profile;
}

async function updateMyProfile(userId, input, db = prisma) {
  const data = parse(profileUpdateSchema, input);
  return db.user.update({
    where: { id: userId },
    data,
    select: { ...publicProfileSelect, email: true },
  });
}

async function getFreelancerById(id, db = prisma) {
  const profile = await db.user.findFirst({
    where: { id: parseId(id), role: "FREELANCER", isBlocked: false },
    select: publicProfileSelect,
  });
  if (!profile) throw new AppError(404, "NOT_FOUND", "Freelancerul nu a fost găsit.");
  return profile;
}

async function listPortfolio(userId, db = prisma) {
  return db.portfolioItem.findMany({
    where: { freelancerId: userId },
    select: portfolioSelect,
    orderBy: { createdAt: "desc" },
  });
}

async function createPortfolioItem(userId, input, db = prisma) {
  const data = parse(portfolioCreateSchema, input);
  const count = await db.portfolioItem.count({ where: { freelancerId: userId } });
  if (count >= MAX_PORTFOLIO_ITEMS) {
    throw new AppError(400, "PORTFOLIO_LIMIT", `Poți avea cel mult ${MAX_PORTFOLIO_ITEMS} lucrări în portofoliu.`);
  }
  return db.portfolioItem.create({
    data: { ...data, freelancerId: userId },
    select: portfolioSelect,
  });
}

// Elementul trebuie să aparțină utilizatorului curent.
async function findOwnedItem(userId, itemId, db) {
  const item = await db.portfolioItem.findFirst({
    where: { id: parseId(itemId), freelancerId: userId },
    select: { id: true },
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Lucrarea nu a fost găsită.");
  return item;
}

async function updatePortfolioItem(userId, itemId, input, db = prisma) {
  const data = parse(portfolioUpdateSchema, input);
  const item = await findOwnedItem(userId, itemId, db);
  return db.portfolioItem.update({ where: { id: item.id }, data, select: portfolioSelect });
}

async function deletePortfolioItem(userId, itemId, db = prisma) {
  const item = await findOwnedItem(userId, itemId, db);
  await db.portfolioItem.delete({ where: { id: item.id } });
}

module.exports = {
  MAX_PORTFOLIO_ITEMS,
  getMyProfile,
  updateMyProfile,
  getFreelancerById,
  listPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
};