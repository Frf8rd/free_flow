const { Router } = require("express");
const authRoutes = require("./auth.routes");
const accessRoutes = require("./access.routes");
const catalogRoutes = require("./catalog.routes");
const projectsRoutes = require("./projects.routes");
const adminRoutes = require("./admin.routes");

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.use("/auth", authRoutes);
router.use("/access", accessRoutes);
router.use("/", catalogRoutes);
router.use("/projects", projectsRoutes);
router.use("/admin", adminRoutes);

module.exports = router;