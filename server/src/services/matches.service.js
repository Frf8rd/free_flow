const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { enqueueMatchingJob } = require('./matching/jobs');
const notifications = require('./notifications.service');

const matchInclude = {
  project: { include: { category: { select: { id: true, name: true } }, skills: { include: { skill: true } }, client: { select: { id: true, name: true, avatarUrl: true } } } },
  freelancer: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, skills: { include: { skill: true } }, portfolio: true } },
};

async function listMine(user, query = {}, db = prisma) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const statusMap = { new: 'SUGGESTED', interested: 'FREELANCER_INTERESTED', invited: 'CLIENT_INVITED', accepted: 'ACCEPTED' };
  const status = query.status ? statusMap[query.status] ?? query.status : null;
  if (status && !['SUGGESTED', 'FREELANCER_INTERESTED', 'CLIENT_INVITED', 'ACCEPTED', 'DISMISSED'].includes(status)) throw new AppError(400, 'VALIDATION_ERROR', 'Filtrul status nu este valid.');
  const where = user.role === 'CLIENT'
    ? { project: { clientId: user.id, status: 'OPEN' }, ...(query.projectId ? { projectId: query.projectId } : {}) }
    : { freelancer: { userId: user.id }, project: { status: 'OPEN' } };
  if (status) where.status = status;
  const [total, data] = await Promise.all([
    db.match.count({ where }),
    db.match.findMany({ where, include: matchInclude, orderBy: user.role === 'CLIENT' ? [{ projectRank: 'asc' }, { score: 'desc' }] : [{ freelancerRank: 'asc' }, { score: 'desc' }], skip: (page - 1) * limit, take: limit }),
  ]);
  return { data: data.map((match) => ({ ...match, freelancer: { ...match.freelancer, ...match.freelancer.user, user: undefined } })), page, limit, total };
}

async function listForProject(user, projectId, db = prisma) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true, matchingStatus: true, matchingError: true, extracted: true },
  });
  if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proiectul nu a fost găsit.');
  if (project.clientId !== user.id) throw new AppError(403, 'FORBIDDEN', 'Poți vedea potrivirile doar pentru proiectele tale.');
  const data = await db.match.findMany({ where: { projectId }, include: matchInclude, orderBy: [{ projectRank: 'asc' }, { score: 'desc' }] });
  const extracted = project.extracted && typeof project.extracted === 'object' ? project.extracted : {};
  return {
    status: project.matchingStatus || 'PENDING',
    error: project.matchingError || null,
    data,
    analysis: {
      source: extracted.source || null,
      needsInfo: Boolean(extracted.needsInfo),
      questions: Array.isArray(extracted.clarifyingQuestions) ? extracted.clarifyingQuestions : [],
      assumptions: Array.isArray(extracted.assumptions) ? extracted.assumptions : [],
    },
  };
}

async function getOwnedMatch(user, id, db) {
  const match = await db.match.findUnique({ where: { id }, include: matchInclude });
  if (!match) throw new AppError(404, 'MATCH_NOT_FOUND', 'Potrivirea nu a fost găsită.');
  const allowed = user.role === 'CLIENT' ? match.project.clientId === user.id : match.freelancer.userId === user.id;
  if (!allowed) throw new AppError(403, 'FORBIDDEN', 'Nu ai acces la această potrivire.');
  return match;
}

async function createConversation(match, db) {
  const existing = await db.conversation.findUnique({ where: { matchId: match.id } });
  if (existing) return existing;
  return db.conversation.create({ data: { matchId: match.id, projectId: match.projectId, clientId: match.project.clientId, freelancerId: match.freelancer.userId } });
}

async function interest(user, id, db = prisma) {
  const match = await getOwnedMatch(user, id, db);
  if (user.role !== 'FREELANCER') throw new AppError(403, 'FORBIDDEN', 'Doar freelancerul poate confirma interesul.');
  if (match.status === 'DISMISSED') throw new AppError(409, 'MATCH_DISMISSED', 'Potrivirea a fost ascunsă.');
  if (match.status === 'ACCEPTED') return { match, conversation: await createConversation(match, db) };
  if (match.status === 'FREELANCER_INTERESTED') return { match, conversation: await createConversation(match, db) };
  const nextStatus = match.status === 'CLIENT_INVITED' ? 'ACCEPTED' : 'FREELANCER_INTERESTED';
  const updated = await db.match.update({ where: { id }, data: { status: nextStatus }, include: matchInclude });
  const conversation = await createConversation(updated, db);
  void notifications.createNotification({ userId: updated.project.clientId, type: 'MATCH_INTEREST', title: 'Freelancer interesat', body: `${updated.freelancer.user.name} și-a arătat interesul pentru „${updated.project.title}”.`, data: { projectId: updated.projectId, matchId: id, conversationId: conversation.id } }, db).catch(() => {});
  return { match: updated, conversation };
}

async function invite(user, id, db = prisma) {
  const match = await getOwnedMatch(user, id, db);
  if (user.role !== 'CLIENT') throw new AppError(403, 'FORBIDDEN', 'Doar clientul poate invita freelancerul.');
  if (match.project.status !== 'OPEN') throw new AppError(409, 'PROJECT_NOT_OPEN', 'Proiectul nu mai acceptă invitații.');
  if (match.status === 'DISMISSED') throw new AppError(409, 'MATCH_DISMISSED', 'Potrivirea a fost ascunsă.');
  if (match.status === 'ACCEPTED') return { match, conversation: await createConversation(match, db) };
  if (match.status === 'CLIENT_INVITED') return { match, conversation: await createConversation(match, db) };
  const nextStatus = match.status === 'FREELANCER_INTERESTED' ? 'ACCEPTED' : 'CLIENT_INVITED';
  const updated = await db.match.update({ where: { id }, data: { status: nextStatus }, include: matchInclude });
  const conversation = await createConversation(updated, db);
  void notifications.createNotification({ userId: updated.freelancer.userId, type: 'MATCH_INVITE', title: 'Invitație la proiect', body: `Ai fost invitat la „${updated.project.title}”.`, data: { projectId: updated.projectId, matchId: id, conversationId: conversation.id } }, db).catch(() => {});
  return { match: updated, conversation };
}

async function inviteFreelancer(user, projectId, freelancerId, db = prisma) {
  const project = await db.project.findFirst({ where: { id: projectId, clientId: user.id, status: 'OPEN' }, select: { id: true } });
  if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proiectul deschis nu a fost găsit.');
  const profile = await db.freelancerProfile.findFirst({ where: { userId: freelancerId, onboarded: true, user: { isBlocked: false } }, select: { id: true } });
  if (!profile) throw new AppError(404, 'FREELANCER_NOT_FOUND', 'Freelancerul nu a fost găsit.');
  const match = await db.match.upsert({
    where: { projectId_freelancerId: { projectId, freelancerId: profile.id } },
    create: { projectId, freelancerId: profile.id, score: 0, reasons: { source: 'manual_invite' }, status: 'CLIENT_INVITED' },
    update: { status: 'CLIENT_INVITED' },
    include: matchInclude,
  });
  const conversation = await createConversation(match, db);
  void notifications.createNotification({ userId: freelancerId, type: 'MATCH_INVITE', title: 'Invitație la proiect', body: `Ai fost invitat la „${match.project.title}”.`, data: { projectId, matchId: match.id, conversationId: conversation.id } }, db).catch(() => {});
  return { match, conversation };
}

async function dismiss(user, id, reason, db = prisma) {
  const match = await getOwnedMatch(user, id, db);
  if (match.status !== 'SUGGESTED') throw new AppError(409, 'MATCH_NOT_DISMISSABLE', 'Doar o recomandare nouă poate fi ascunsă.');
  return db.match.update({ where: { id }, data: { status: 'DISMISSED', dismissReason: typeof reason === 'string' ? reason.slice(0, 240) : null } });
}

async function recordImpressions(user, matchIds, db = prisma) {
  if (!Array.isArray(matchIds) || !matchIds.length || matchIds.length > 50 || matchIds.some((id) => typeof id !== 'string') || new Set(matchIds).size !== matchIds.length) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Trimite între 1 și 50 de identificatori unici de potriviri.');
  }
  const matches = await db.match.findMany({ where: { id: { in: matchIds } }, select: { id: true, projectId: true, freelancerId: true, projectRank: true, freelancerRank: true, project: { select: { clientId: true } }, freelancer: { select: { userId: true } } } });
  if (matches.length !== matchIds.length || matches.some((m) => user.role === 'CLIENT' ? m.project.clientId !== user.id : m.freelancer.userId !== user.id)) {
    throw new AppError(403, 'FORBIDDEN', 'Poți înregistra doar potrivirile pe care le vezi.');
  }
  const side = user.role;
  const day = new Date(); day.setUTCHours(0, 0, 0, 0);
  await db.recommendationImpression.createMany({ data: matches.map((m, index) => ({ projectId: m.projectId, freelancerId: m.freelancerId, viewerUserId: user.id, side, rank: (side === 'CLIENT' ? m.projectRank : m.freelancerRank) ?? index + 1, day })), skipDuplicates: true });
  return { recorded: matches.length };
}

async function refresh(user, projectId, db = prisma) {
  if (user.role === 'CLIENT') {
    if (!projectId) throw new AppError(400, 'VALIDATION_ERROR', 'projectId este obligatoriu pentru client.');
    const project = await db.project.findFirst({ where: { id: projectId, clientId: user.id }, select: { id: true, matchedAt: true } });
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proiectul nu a fost găsit.');
    const job = await db.matchingJob.findUnique({ where: { type_targetId: { type: 'PROJECT', targetId: project.id } }, select: { updatedAt: true } });
    const lastRefresh = [project.matchedAt, job?.updatedAt].filter(Boolean).sort((a, b) => b.getTime() - a.getTime())[0];
    if (lastRefresh && Date.now() - lastRefresh.getTime() < 120000) throw new AppError(429, 'MATCH_REFRESH_COOLDOWN', 'Așteaptă două minute înainte de o nouă actualizare.');
    await enqueueMatchingJob('PROJECT', project.id, db);
    return { queued: true, projectId: project.id };
  }
  const profile = await db.freelancerProfile.findUnique({ where: { userId: user.id }, select: { id: true, matchedAt: true } });
  const job = await db.matchingJob.findUnique({ where: { type_targetId: { type: 'FREELANCER', targetId: user.id } }, select: { updatedAt: true } });
  const lastRefresh = [profile?.matchedAt, job?.updatedAt].filter(Boolean).sort((a, b) => b.getTime() - a.getTime())[0];
  if (lastRefresh && Date.now() - lastRefresh.getTime() < 120000) throw new AppError(429, 'MATCH_REFRESH_COOLDOWN', 'Așteaptă două minute înainte de o nouă actualizare.');
  await enqueueMatchingJob('FREELANCER', user.id, db);
  return { queued: true };
}

module.exports = { listMine, listForProject, interest, invite, inviteFreelancer, dismiss, recordImpressions, refresh };
