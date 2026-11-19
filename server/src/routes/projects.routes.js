const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const projectsController = require("../controllers/projects.controller");

const router = Router();

router.use(authenticate);
router.post("/", requireRole("CLIENT"), projectsController.create);
router.get("/", projectsController.list);
router.get("/me", requireRole("CLIENT"), projectsController.listMine);
router.patch("/:id", requireRole("CLIENT"), projectsController.update);
router.patch("/:id/close", requireRole("CLIENT"), projectsController.close);
router.patch("/:id/reopen", requireRole("CLIENT"), projectsController.reopen);
router.delete("/:id", requireRole("CLIENT"), projectsController.remove);
router.get("/:id", projectsController.getById);

module.exports = router;