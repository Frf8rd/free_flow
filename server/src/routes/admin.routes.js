const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const adminController = require("../controllers/admin.controller");

const router = Router();
const adminMutationLimiter = rateLimit({
  name: "admin-mutation",
  windowMs: 15 * 60 * 1000,
  max: 30,
});

router.use(authenticate, requireRole("ADMIN"));
router.get("/users", adminController.users);
router.patch("/users/:id", adminMutationLimiter, adminController.updateUser);
router.get("/projects", adminController.projects);
router.delete("/projects/:id", adminMutationLimiter, adminController.deleteProject);
router.get("/reports", adminController.reports);
router.patch("/reports/:id", adminMutationLimiter, adminController.resolveReport);
router.get("/stats", adminController.stats);

module.exports = router;