const catalogService = require('../services/catalog.service');
const { skillsQuerySchema } = require('../validators/catalog.validator');

async function getCategories(req, res, next) {
  try {
    const data = await catalogService.listCategories();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getSkills(req, res, next) {
  try {
    const parsed = skillsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
      });
    }
    const data = await catalogService.listSkills(parsed.data);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, getSkills };