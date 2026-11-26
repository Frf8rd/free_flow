const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const { rateLimit } = require('../middlewares/rateLimit');
const controller = require('../controllers/matches.controller');

const router = Router();
const limiter = rateLimit({ name: 'match-mutation', windowMs: 60 * 1000, max: 20 });
router.use(authenticate);
router.get('/me', controller.mine);
router.post('/impressions', limiter, controller.impressions);
router.post('/refresh', limiter, controller.refresh);
router.post('/invite', requireRole('CLIENT'), limiter, controller.invite);
router.post('/:id/interest', requireRole('FREELANCER'), limiter, controller.interest);
router.post('/:id/invite', requireRole('CLIENT'), limiter, controller.invite);
router.post('/:id/dismiss', limiter, controller.dismiss);

module.exports = router;
