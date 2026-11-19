const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");

const include = {
  project: { select: { id: true, title: true, status: true, clientId: true } },
  client: { select: { id: true, name: true, email: true } },
  freelancer: { select: { id: true, name: true, email: true } },
  conversation: { select: { id: true } },
};

async function createEngagement(freelancerId, projectId, db = prisma) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Proiectul selectat nu este valid.");
  }
  projectId = projectId.trim();
  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, clientId: true, status: true } });
  if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  if (project.clientId === freelancerId) throw new AppError(400, "OWN_PROJECT", "Nu poți solicita colaborarea la propriul proiect.");
  if (project.status !== "OPEN") throw new AppError(409, "PROJECT_NOT_OPEN", "Proiectul nu mai acceptă cereri de colaborare.");

  const existing = await db.engagement.findUnique({ where: { projectId_freelancerId: { projectId, freelancerId } } });
  if (existing && existing.status !== "REJECTED") {
    throw new AppError(409, "ENGAGEMENT_EXISTS", "Ai deja o cerere sau o colaborare pentru acest proiect.");
  }
  if (existing) {
    return db.engagement.update({ where: { id: existing.id }, data: { status: "PENDING" }, include });
  }
  try {
    return await db.engagement.create({ data: { projectId, clientId: project.clientId, freelancerId }, include });
  } catch (error) {
    if (error?.code === "P2002") throw new AppError(409, "ENGAGEMENT_EXISTS", "Ai deja o cerere sau o colaborare pentru acest proiect.");
    throw error;
  }
}

async function listEngagements(user, db = prisma) {
  const where = user.role === "CLIENT" ? { clientId: user.id } : { freelancerId: user.id };
  return db.engagement.findMany({ where, include, orderBy: { updatedAt: "desc" } });
}

async function updateEngagement(clientId, id, status, db = prisma) {
  if (!id || !["ACCEPTED", "REJECTED"].includes(status)) {
    throw new AppError(400, "VALIDATION_ERROR", "Acțiunea trebuie să fie ACCEPTED sau REJECTED.");
  }
  return db.$transaction(async (tx) => {
    const item = await tx.engagement.findUnique({ where: { id }, include: { project: { select: { status: true } } } });
    if (!item) throw new AppError(404, "ENGAGEMENT_NOT_FOUND", "Cererea de colaborare nu a fost găsită.");
    if (item.clientId !== clientId) throw new AppError(403, "FORBIDDEN", "Doar clientul proiectului poate răspunde cererii.");
    if (item.status !== "PENDING") throw new AppError(409, "ENGAGEMENT_ALREADY_HANDLED", "Această cerere a fost deja soluționată.");
    if (status === "ACCEPTED" && item.project.status !== "OPEN") {
      throw new AppError(409, "PROJECT_NOT_OPEN", "Proiectul trebuie să fie deschis pentru a accepta cererea.");
    }

    const updated = await tx.engagement.update({ where: { id }, data: { status }, include });
    if (status === "ACCEPTED") {
      const conversation = await tx.conversation.create({
        data: { engagementId: id, clientId: item.clientId, freelancerId: item.freelancerId },
        select: { id: true },
      });
      return { ...updated, conversation };
    }
    return updated;
  });
}

module.exports = { createEngagement, listEngagements, updateEngagement };
