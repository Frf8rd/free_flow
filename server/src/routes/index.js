const { Router } = require("express");
const authRoutes = require("./auth.routes");
const accessRoutes = require("./access.routes");

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.use("/auth", authRoutes);
router.use("/access", accessRoutes);

module.exports = router;