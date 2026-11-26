
require("dotenv").config();

const app = require("./app");
const http = require("node:http");
const { Server } = require("socket.io");
const prisma = require("./config/prisma");
const { verifyAccessToken } = require("./utils/jwt");
const { setIo } = require("./realtime");
const { startMatchingWorker, stopMatchingWorker } = require("./services/matching/db-worker");
const port = Number(process.env.PORT) || 4000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured before starting the server.");
}
const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
  throw new Error("JWT_SECRET must be configured and contain at least 32 bytes.");
}

const httpServer = http.createServer(app);
const allowedOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
const io = new Server(httpServer, {
  cors: { origin: allowedOrigin, credentials: true },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const claims = verifyAccessToken(token);
    if (!claims) return next(new Error("UNAUTHENTICATED"));
    const user = await prisma.user.findUnique({
      where: { id: claims.userId },
      select: { id: true, isBlocked: true, tokenVersion: true, role: true },
    });
    if (!user || user.isBlocked || user.tokenVersion !== claims.tokenVersion || !["CLIENT", "FREELANCER"].includes(user.role)) {
      return next(new Error("UNAUTHENTICATED"));
    }
    socket.data.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.data.userId}`);
  socket.join("projects:browse");
  const token = socket.handshake.auth?.token;
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  const expiresInMs = Math.max(0, payload.exp * 1000 - Date.now());
  const expiryTimer = setTimeout(() => socket.disconnect(true), expiresInMs);
  expiryTimer.unref?.();

  socket.on("conversation:join", async (conversationId, acknowledge = () => {}) => {
    if (typeof conversationId !== "string" || !conversationId) {
      acknowledge({ ok: false, error: "CONVERSATION_NOT_FOUND" });
      return;
    }
    try {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, OR: [{ clientId: socket.data.userId }, { freelancerId: socket.data.userId }] },
        select: { id: true },
      });
      if (!conversation) {
        acknowledge({ ok: false, error: "CONVERSATION_NOT_FOUND" });
        return;
      }
      if (socket.data.conversationId) await socket.leave(`conversation:${socket.data.conversationId}`);
      socket.data.conversationId = conversation.id;
      await socket.join(`conversation:${conversation.id}`);
      acknowledge({ ok: true });
    } catch {
      acknowledge({ ok: false, error: "JOIN_FAILED" });
    }
  });

  socket.on("disconnect", () => clearTimeout(expiryTimer));
});

setIo(io);
startMatchingWorker();

httpServer.listen(port, () => {
  console.log(`FairMatch API listening on http://localhost:${port}`);
});

let shuttingDown = false;
function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Shutting down FairMatch API (${signal}).`);
  stopMatchingWorker();
  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref?.();
  httpServer.close(async () => {
    io.close();
    try {
      await prisma.$disconnect();
      clearTimeout(timeout);
      process.exit(exitCode);
    } catch (error) {
      console.error("Database disconnect failed during shutdown.", { code: error?.code || "UNKNOWN" });
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection.", { message: String(reason?.message || reason).slice(0, 240) });
  shutdown("unhandledRejection", 1);
});
