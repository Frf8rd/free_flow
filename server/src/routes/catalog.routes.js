const { Router } = require("express");
const prisma = require("../config/prisma");

const router = Router();

router.get("/categories", async (req, res) => {
  const data = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  res.json({ data });
});

router.get("/skills", async (req, res) => {
  const where = {};
  if (req.query.categoryId !== undefined) {
    if (typeof req.query.categoryId !== "string" || !req.query.categoryId.trim()) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Categoria nu este validă." },
      });
    }
    where.categoryId = req.query.categoryId.trim();
  }
  const data = await prisma.skill.findMany({
    where,
    select: { id: true, name: true, categoryId: true },
    orderBy: { name: "asc" },
  });
  res.json({ data });
});

module.exports = router;