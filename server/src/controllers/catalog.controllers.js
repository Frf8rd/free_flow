const catalogService = require("../services/catalog.service");
const { skillsQuerySchema } = require("../validators/catalog.validator");
const { AppError } = require("../utils/errors");

// Express 5 trimite erorile async direct la errorHandler, deci nu e nevoie de try/catch.
async function getCategories(req, res) {
  res.json({ data: await catalogService.listCategories() });
}

async function getSkills(req, res) {
  const parsed = skillsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
  }
  res.json({ data: await catalogService.listSkills(parsed.data) });
}

module.exports = { getCategories, getSkills };