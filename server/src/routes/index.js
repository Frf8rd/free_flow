const router = require('express').Router();

router.use('/', require('./catalog.routes'));

module.exports = router;