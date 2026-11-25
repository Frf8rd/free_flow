const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");

async function listConversations(userId, db = prisma) {
  const where = { OR: [{ clientId: userId }, { freelancerId: userId }] };
  const rows = await db.conversation.findMany({
    where,
    include: {
      engagement: { select: { status: true, project: { select: { id: true, title: true } } } },
      client: { select: { id: true, name: true } },
      freelancer: { select: { id: true, name: true } },
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 },
      _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => ({ ...row, lastMessage: row.messages[0] || null, unreadCount: row._count.messages, messages: undefined, _count: undefined }));
}

async function getMessages(userId, conversationId, query = {}, db = prisma) {
  const conversation = await db.conversation.findFirst({ where: { id: conversationId, OR: [{ clientId: userId }, { freelancerId: userId }] }, select: { id: true } });
  if (!conversation) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversația nu a fost găsită.");
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 30 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError(400, "VALIDATION_ERROR", "Paginarea mesajelor nu este validă.");
  }
  const [total, rows] = await Promise.all([
    db.message.count({ where: { conversationId } }),
    db.message.findMany({ where: { conversationId }, include: { sender: { select: { id: true, name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit }),
  ]);
  return { data: rows.reverse(), page, limit, total };
}

async function sendMessage(userId, conversationId, input, db = prisma) {
  const content = typeof input?.content === "string" ? input.content.trim() : "";
  if (!content || content.length > 4000) throw new AppError(400, "VALIDATION_ERROR", "Mesajul trebuie să aibă între 1 și 4000 de caractere.");
  return db.$transaction(async (tx) => {
    const conversation = await tx.conversation.findFirst({
      where: { id: conversationId, OR: [{ clientId: userId }, { freelancerId: userId }] },
      select: { id: true, engagement: { select: { status: true } } },
    });
    if (!conversation) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversația nu a fost găsită.");
    if (!["IN_PROGRESS", "DELIVERED"].includes(conversation.engagement.status)) {
      throw new AppError(409, "CONVERSATION_CLOSED", "Nu mai poți trimite mesaje în această colaborare.");
    }
    const message = await tx.message.create({ data: { conversationId, senderId: userId, content }, include: { sender: { select: { id: true, name: true } } } });
    await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return message;
  });
}

async function markRead(userId, conversationId, db = prisma) {
  const conversation = await db.conversation.findFirst({ where: { id: conversationId, OR: [{ clientId: userId }, { freelancerId: userId }] }, select: { id: true } });
  if (!conversation) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversația nu a fost găsită.");
  const result = await db.message.updateMany({ where: { conversationId, senderId: { not: userId }, readAt: null }, data: { readAt: new Date() } });
  return { updated: result.count };
}

module.exports = { listConversations, getMessages, sendMessage, markRead };
