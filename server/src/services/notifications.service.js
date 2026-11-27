const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { getIo } = require("../realtime");
const { listQuerySchema, idSchema, parse } = require("../validators/notifications.validator");

const DAY_MS = 24 * 60 * 60 * 1000;

// Plafon: câte notificări poate primi un utilizator în ultimele 24 de ore. Peste plafon, cele noi sunt ignorate.
function dailyLimit() {
  const configured = Number(process.env.NOTIFICATIONS_DAILY_LIMIT);
  return Number.isInteger(configured) && configured > 0 ? configured : 50;
}

const TYPES = {
  ENGAGEMENT_REQUESTED: "ENGAGEMENT_REQUESTED",
  ENGAGEMENT_ACCEPTED: "ENGAGEMENT_ACCEPTED",
  ENGAGEMENT_REJECTED: "ENGAGEMENT_REJECTED",
  ENGAGEMENT_DELIVERED: "ENGAGEMENT_DELIVERED",
  ENGAGEMENT_COMPLETED: "ENGAGEMENT_COMPLETED",
  ENGAGEMENT_CANCELLED: "ENGAGEMENT_CANCELLED",
  NEW_MESSAGE: "NEW_MESSAGE",
};

const GROUPS = {
  matches: ["NEW_MATCH", "MATCH_INVITE", "MATCH_INTEREST", "INVITED", "FREELANCER_INTERESTED"],
  messages: [TYPES.NEW_MESSAGE],
  engagements: ["ENGAGEMENT_STARTED", "REVIEW_RECEIVED", ...Object.values(TYPES).filter((type) => type.startsWith("ENGAGEMENT_"))],
};

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  data: true,
  readAt: true,
  createdAt: true,
};

/**
 * Creează o notificare, respectând deduplicarea și plafonul zilnic.
 * Returnează notificarea creată sau null dacă a fost omisă.
 */
async function createNotification({ userId, type, title, body = "", data = null, dedupeKey = null }, db = prisma) {
  if (dedupeKey) {
    const existing = await db.notification.findFirst({
      where: { userId, dedupeKey, readAt: null },
      select: { id: true },
    });
    if (existing) return null;
  }

  const recent = await db.notification.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
  });
  if (recent >= dailyLimit()) return null;

  const notification = await db.notification.create({
    data: { userId, type, title, body, ...(data ? { data } : {}), dedupeKey },
    select: notificationSelect,
  });

  const io = getIo();
  if (io) io.to(`user:${userId}`).emit("notification:new", notification);
  return notification;
}

async function listNotifications(userId, query = {}, db = prisma) {
  const { kind, unread, page = 1, limit = 20 } = parse(listQuerySchema, query);
  const where = { userId, ...(unread === "true" ? { readAt: null } : {}), ...(kind ? { type: { in: GROUPS[kind] } } : {}) };

  const [total, unreadCount, data] = await Promise.all([
    db.notification.count({ where }),
    db.notification.count({ where: { userId, readAt: null } }),
    db.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { data, page, limit, total, unreadCount };
}

async function markRead(userId, notificationId, db = prisma) {
  const id = parse(idSchema, notificationId);
  const notification = await db.notification.findUnique({
    where: { id },
    select: { ...notificationSelect, userId: true },
  });
  if (!notification) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notificarea nu a fost găsită.");
  if (notification.userId !== userId) {
    throw new AppError(403, "FORBIDDEN", "Poți modifica doar propriile notificări.");
  }

  const { userId: _owner, ...result } = notification;
  if (notification.readAt) return result;
  return db.notification.update({ where: { id }, data: { readAt: new Date() }, select: notificationSelect });
}

async function markAllRead(userId, db = prisma) {
  const result = await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}

// Când utilizatorul își marchează mesajele ca citite, notificarea "mesaj nou" a conversației nu mai are rost.
function markConversationRead(userId, conversationId, db = prisma) {
  return safely("conversation.read", () =>
    db.notification.updateMany({
      where: { userId, dedupeKey: `message:${conversationId}`, readAt: null },
      data: { readAt: new Date() },
    }));
}

// --- Evenimente din aplicație -------------------------------------------------
// Notificările sunt secundare: o eroare aici nu trebuie să strice acțiunea principală.

async function safely(label, operation) {
  try {
    return await operation();
  } catch (error) {
    console.error(`Notification failed (${label}).`, {
      code: error && typeof error.code === "string" ? error.code : "UNKNOWN",
    });
    return null;
  }
}

function engagementData(engagement) {
  return {
    engagementId: engagement.id,
    projectId: engagement.projectId,
    conversationId: engagement.conversation?.id ?? null,
  };
}

// `engagement` e rezultatul din engagements.service (include project, client, freelancer).
function notifyEngagementRequested(engagement, db = prisma) {
  return safely("engagement.requested", () =>
    createNotification({
      userId: engagement.clientId,
      type: TYPES.ENGAGEMENT_REQUESTED,
      title: "Cerere nouă de colaborare",
      body: `${engagement.freelancer.name} vrea să lucreze la „${engagement.project.title}”.`,
      data: engagementData(engagement),
    }, db));
}

function notifyEngagementUpdated(engagement, actorId, db = prisma) {
  const project = engagement.project.title;
  const byClient = actorId === engagement.clientId;
  const other = byClient ? engagement.freelancerId : engagement.clientId;

  const messages = {
    IN_PROGRESS: [engagement.freelancerId, TYPES.ENGAGEMENT_ACCEPTED, "Cerere acceptată",
      `${engagement.client.name} ți-a acceptat cererea pentru „${project}”.`],
    REJECTED: [engagement.freelancerId, TYPES.ENGAGEMENT_REJECTED, "Cerere respinsă",
      `${engagement.client.name} nu a putut accepta cererea ta pentru „${project}”.`],
    DELIVERED: [engagement.clientId, TYPES.ENGAGEMENT_DELIVERED, "Lucrare predată",
      `${engagement.freelancer.name} a marcat „${project}” ca predat.`],
    COMPLETED: [engagement.freelancerId, TYPES.ENGAGEMENT_COMPLETED, "Colaborare finalizată",
      `${engagement.client.name} a finalizat colaborarea pentru „${project}”.`],
    CANCELLED: [other, TYPES.ENGAGEMENT_CANCELLED, "Colaborare anulată",
      `${byClient ? engagement.client.name : engagement.freelancer.name} a anulat colaborarea pentru „${project}”.`],
  };
  const entry = messages[engagement.status];
  if (!entry) return Promise.resolve(null);

  const [userId, type, title, body] = entry;
  return safely(`engagement.${engagement.status}`, () =>
    createNotification({ userId, type, title, body, data: engagementData(engagement) }, db));
}

// Un singur "mesaj nou" necitit per conversație (dedupeKey), fără conținutul mesajului.
function notifyNewMessage({ conversationId, senderId, senderName }, db = prisma) {
  return safely("message.new", async () => {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: {
        clientId: true,
        freelancerId: true,
        project: { select: { id: true, title: true } },
        engagement: { select: { id: true, projectId: true, project: { select: { title: true } } } },
      },
    });
    if (!conversation) return null;
    const userId = senderId === conversation.clientId ? conversation.freelancerId : conversation.clientId;
    return createNotification({
      userId,
      type: TYPES.NEW_MESSAGE,
      title: "Mesaj nou",
    body: `${senderName} ți-a scris în „${conversation.project?.title ?? conversation.engagement?.project?.title ?? 'proiect'}”.`,
      data: {
        ...(conversation.engagementId || conversation.engagement?.id ? { engagementId: conversation.engagementId ?? conversation.engagement.id } : {}),
        projectId: conversation.project?.id ?? conversation.engagement?.projectId,
        conversationId,
      },
      dedupeKey: `message:${conversationId}`,
    }, db);
  });
}

module.exports = {
  TYPES,
  createNotification,
  listNotifications,
  markRead,
  markAllRead,
  markConversationRead,
  notifyEngagementRequested,
  notifyEngagementUpdated,
  notifyNewMessage,
};
