const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");

const router = Router();

router.use(authenticate);
router.get("/client", requireRole("CLIENT"), (req, res) => {
  res.json({ authorized: true, role: req.user.role });
});
router.get("/freelancer", requireRole("FREELANCER"), (req, res) => {
  res.json({ authorized: true, role: req.user.role });
});
router.get("/admin", requireRole("ADMIN"), (req, res) => {
  res.json({ authorized: true, role: req.user.role });
});

module.exports = router;
