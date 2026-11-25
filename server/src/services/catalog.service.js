const prisma = require("../config/prisma");

async function listCategories(db = prisma) {
  return db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// Răspunsul păstrează categoryId (cum îl returna backend) și adaugă category { id, name }.
async function listSkills({ categoryId, q } = {}, db = prisma) {
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (q) where.name = { contains: q, mode: "insensitive" };

  return db.skill.findMany({
    where,
    select: {
      id: true,
      name: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

module.exports = { listCategories, listSkills };