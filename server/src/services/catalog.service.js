const prisma = require('../config/prisma');

async function listCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

async function listSkills({ categoryId, q }) {
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (q) where.name = { contains: q, mode: 'insensitive' };

  return prisma.skill.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
}

module.exports = { listCategories, listSkills };