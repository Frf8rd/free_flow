const { Router } = require("express");
const authRoutes = require("./auth.routes");
const accessRoutes = require("./access.routes");
const catalogRoutes = require("./catalog.routes");
const projectsRoutes = require("./projects.routes");
const adminRoutes = require("./admin.routes");
const engagementRoutes = require("./engagements.routes");
const conversationRoutes = require("./conversations.routes");
const freelancersRoutes = require("./freelancers.routes");
const usersRoutes = require("./users.routes");
const clientsRoutes = require("./clients.routes");
const reviewsRoutes = require("./reviews.routes");

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.use("/auth", authRoutes);
router.use("/access", accessRoutes);
router.use("/", catalogRoutes);
router.use("/projects", projectsRoutes);
router.use("/admin", adminRoutes);
router.use("/engagements", engagementRoutes);
router.use("/conversations", conversationRoutes);
router.use("/freelancers", freelancersRoutes);
router.use("/users", usersRoutes);
router.use("/clients", clientsRoutes);
router.use("/reviews", reviewsRoutes);

module.exports = router;