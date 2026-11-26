const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const emailService = require("./email.service");
const { enqueueMatchingJob } = require("./matching/jobs");

const include = {
  project: { select: { id: true, title: true, status: true, clientId: true } },
  client: { select: { id: true, name: true, email: true } },
  freelancer: { select: { id: true, name: true, email: true } },
  conversation: { select: { id: true } },
};

async function createEngagement(freelancerId, input, db = prisma) {
  const payload = typeof input === "string" ? { projectId: input } : input;
  const { projectId: requestedProjectId, matchId } = payload || {};
  const agreedPrice = payload?.agreedPrice;
  let deadline = null;
  if (agreedPrice !== undefined && (!Number.isSafeInteger(agreedPrice) || agreedPrice < 0)) throw new AppError(400, "VALIDATION_ERROR", "Prețul propus nu este valid.");
  if (payload?.deadline !== undefined && payload.deadline !== null && payload.deadline !== "") {
    if (typeof payload.deadline !== "string" || Number.isNaN(Date.parse(payload.deadline))) throw new AppError(400, "VALIDATION_ERROR", "Termenul propus nu este valid.");
    deadline = new Date(payload.deadline);
  }
  let matched = null;
  if (matchId !== undefined) {
    matched = await db.match.findUnique({ where: { id: matchId }, include: { project: { select: { id: true, clientId: true, status: true } }, freelancer: { select: { userId: true } } } });
    if (!matched || matched.freelancer.userId !== freelancerId) throw new AppError(404, "MATCH_NOT_FOUND", "Potrivirea nu a fost găsită.");
    if (!["FREELANCER_INTERESTED", "CLIENT_INVITED", "ACCEPTED"].includes(matched.status)) throw new AppError(409, "MATCH_REQUIRED", "Este nevoie de o potrivire activă înainte de propunere.");
  }
  const selectedProjectId = matched?.projectId ?? requestedProjectId;
  if (typeof selectedProjectId !== "string" || !selectedProjectId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Proiectul selectat nu este valid.");
  }
  const projectId = selectedProjectId.trim();
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
      data: { status: "PENDING", rejectedAt: null, cancelledAt: null, ...(matched ? { matchId: matched.id } : {}), ...(agreedPrice !== undefined ? { agreedPrice } : {}), ...(deadline !== null ? { deadline } : {}) },
      include,
    });
  }
  try {
    return await db.engagement.create({ data: { projectId, clientId: project.clientId, freelancerId, ...(matched ? { matchId: matched.id } : {}), ...(agreedPrice !== undefined ? { agreedPrice } : {}), ...(deadline !== null ? { deadline } : {}) }, include });
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
    if (["REJECTED", "CANCELLED"].includes(status) && item.matchId) {
      await tx.match.update({ where: { id: item.matchId }, data: { status: "DISMISSED" } });
    }

    if (status === "IN_PROGRESS" && item.status === "PENDING") {
      const projectStarted = await tx.project.updateMany({
        where: { id: item.projectId, status: "OPEN" },
        data: { status: "IN_PROGRESS" },
      });
      if (projectStarted.count !== 1) {
        throw new AppError(409, "PROJECT_NOT_OPEN", "Proiectul nu mai acceptă colaborări.");
      }
      if (item.matchId) await tx.match.update({ where: { id: item.matchId }, data: { status: "ACCEPTED" } });
      const conversation = item.matchId
        ? await tx.conversation.upsert({ where: { matchId: item.matchId }, create: { matchId: item.matchId, engagementId: id, projectId: item.projectId, clientId: item.clientId, freelancerId: item.freelancerId }, update: { engagementId: id }, select: { id: true } })
        : await tx.conversation.create({ data: { engagementId: id, projectId: item.projectId, clientId: item.clientId, freelancerId: item.freelancerId }, select: { id: true } });
      return {
        engagement: { ...engagement, conversation },
        emailRecipient: item.freelancer,
        projectTitle: item.project.title,
        clientName: item.client.name,
      };
    }

    if (status === "COMPLETED" && item.status === "DELIVERED") {
      const profile = await tx.freelancerProfile.findUnique({ where: { userId: item.freelancerId }, select: { id: true, completedCount: true } });
      if (profile) {
        const completedCount = profile.completedCount + 1;
        const tier = completedCount >= 10 ? "EXPERT" : completedCount >= 3 ? "PROVEN" : "VERIFIED";
        await tx.freelancerProfile.update({ where: { id: profile.id }, data: { completedCount, tier } });
      }
      await tx.project.updateMany({ where: { id: item.projectId, status: "IN_PROGRESS" }, data: { status: "COMPLETED" } });
    }

    if (status === "CANCELLED" && ["IN_PROGRESS", "DELIVERED"].includes(item.status) && item.project.status === "IN_PROGRESS") {
      const otherActiveEngagement = await tx.engagement.findFirst({
        where: { id: { not: id }, projectId: item.projectId, status: { in: ["IN_PROGRESS", "DELIVERED"] } },
        select: { id: true },
      });
      if (!otherActiveEngagement) {
        await tx.project.updateMany({ where: { id: item.projectId, status: "IN_PROGRESS" }, data: { status: "OPEN" } });
        if (db === prisma) await enqueueMatchingJob("PROJECT", item.projectId, tx);
      }
    }

    return { engagement };
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

async function discloseAiUse(user, id, usedAi, db = prisma) {
  if (typeof usedAi !== "boolean") throw new AppError(400, "VALIDATION_ERROR", "usedAi trebuie să fie true sau false.");
  const engagement = await db.engagement.findUnique({ where: { id }, select: { id: true, freelancerId: true, status: true } });
  if (!engagement) throw new AppError(404, "ENGAGEMENT_NOT_FOUND", "Colaborarea nu a fost găsită.");
  if (user.role !== "FREELANCER" || engagement.freelancerId !== user.id) throw new AppError(403, "FORBIDDEN", "Doar freelancerul colaborării poate declara folosirea AI.");
  if (!["DELIVERED", "COMPLETED"].includes(engagement.status)) throw new AppError(409, "ENGAGEMENT_NOT_DELIVERED", "Declarația devine disponibilă după predarea lucrării.");
  return db.engagement.update({ where: { id }, data: { usedAi }, include });
}

module.exports = { createEngagement, listEngagements, getEngagement, updateEngagement, discloseAiUse };
