const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const emailService = require("./email.service");

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

  const existing = await db.engagement.findUnique({
    where: { projectId_freelancerId: { projectId, freelancerId } },
    include: { conversation: { select: { id: true } } },
  });
  const canReapply = existing && ["REJECTED", "CANCELLED"].includes(existing.status) && !existing.conversation;
  if (existing && !canReapply) {
    throw new AppError(409, "ENGAGEMENT_EXISTS", "Ai deja o cerere sau o colaborare pentru acest proiect.");
  }
  if (existing) {
    return db.engagement.update({
      where: { id: existing.id },
      data: { status: "PENDING", rejectedAt: null, cancelledAt: null },
      include,
    });
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

async function getEngagement(user, id, db = prisma) {
  const where = {
    id,
    ...(user.role === "CLIENT" ? { clientId: user.id } : { freelancerId: user.id }),
  };
  const engagement = await db.engagement.findFirst({ where, include });
  if (!engagement) throw new AppError(404, "ENGAGEMENT_NOT_FOUND", "Colaborarea nu a fost găsită.");
  return engagement;
}

async function updateEngagement(actor, id, status, db = prisma) {
  const actions = new Set(["IN_PROGRESS", "DELIVERED", "COMPLETED", "REJECTED", "CANCELLED"]);
  if (!id || !actions.has(status)) {
    throw new AppError(400, "VALIDATION_ERROR", "Starea solicitată pentru colaborare nu este validă.");
  }

  const result = await db.$transaction(async (tx) => {
    const item = await tx.engagement.findUnique({ where: { id }, include: {
      project: { select: { status: true, title: true } },
      client: { select: { name: true } },
      freelancer: { select: { id: true, name: true, email: true, emailVerifiedAt: true } },
      conversation: { select: { id: true } },
    } });
    if (!item) throw new AppError(404, "ENGAGEMENT_NOT_FOUND", "Colaborarea nu a fost găsită.");
    const isClient = actor.id === item.clientId && actor.role === "CLIENT";
    const isFreelancer = actor.id === item.freelancerId && actor.role === "FREELANCER";
    if (!isClient && !isFreelancer) {
      throw new AppError(403, "FORBIDDEN", "Doar participanții la colaborare o pot actualiza.");
    }

    const canTransition =
      (item.status === "PENDING" && isClient && ["IN_PROGRESS", "REJECTED"].includes(status)) ||
      (item.status === "PENDING" && isFreelancer && status === "CANCELLED") ||
      (item.status === "IN_PROGRESS" && isFreelancer && status === "DELIVERED") ||
      (["IN_PROGRESS", "DELIVERED"].includes(item.status) && status === "CANCELLED") ||
      (item.status === "DELIVERED" && isClient && status === "COMPLETED");
    if (!canTransition) {
      throw new AppError(409, "INVALID_ENGAGEMENT_TRANSITION", "Schimbarea nu este permisă în etapa curentă a colaborării.");
    }
    if (status === "IN_PROGRESS" && item.project.status !== "OPEN") {
      throw new AppError(409, "PROJECT_NOT_OPEN", "Proiectul trebuie să fie deschis pentru a accepta cererea.");
    }

    const now = new Date();
    const data = {
      status,
      ...(status === "DELIVERED" ? { deliveredAt: now } : {}),
      ...(status === "COMPLETED" ? { completedAt: now } : {}),
      ...(status === "REJECTED" ? { rejectedAt: now } : {}),
      ...(status === "CANCELLED" ? { cancelledAt: now } : {}),
    };
    const engagement = await tx.engagement.update({ where: { id }, data, include });
    if (status !== "IN_PROGRESS" || item.status !== "PENDING") return { engagement };

    const conversation = await tx.conversation.create({
      data: { engagementId: id, clientId: item.clientId, freelancerId: item.freelancerId },
      select: { id: true },
    });
    return {
      engagement: { ...engagement, conversation },
      emailRecipient: item.freelancer,
      projectTitle: item.project.title,
      clientName: item.client.name,
    };
  });

  if (status === "IN_PROGRESS" && result.emailRecipient) {
    const recipient = result.emailRecipient;
    const hasValidVerifiedEmail = recipient.emailVerifiedAt && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email);
    if (hasValidVerifiedEmail) {
      try {
        await emailService.sendEmail({
          to: recipient.email,
          subject: "Colaborarea ta a început",
          text: "Salut " + recipient.name + ",\n\n" + result.clientName +
            " ți-a acceptat cererea pentru proiectul „" + result.projectTitle +
            "”. Colaborarea și conversația sunt disponibile în pagina Colaborări din FairMatch.\n\nEchipa FairMatch",
        });
      } catch (error) {
        console.error("Engagement acceptance email failed.", {
          code: error && typeof error.code === "string" ? error.code : "UNKNOWN",
        });
      }
    }
  }

  return result.engagement;
}

module.exports = { createEngagement, listEngagements, getEngagement, updateEngagement };
