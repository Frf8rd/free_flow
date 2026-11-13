const router = require('express').Router();
const catalog = require('../controllers/catalog.controller');

// Rute publice (fără autentificare)
router.get('/categories', catalog.getCategories);
router.get('/skills', catalog.getSkills);

module.exports = router;