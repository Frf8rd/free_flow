const { Router } = require("express");
const catalog = require("../controllers/catalog.controllers");

const router = Router();

// Rute publice (fără autentificare)
router.get("/categories", catalog.getCategories);
router.get("/skills", catalog.getSkills);

module.exports = router;