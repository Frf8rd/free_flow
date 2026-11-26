const prisma = require('../../config/prisma');
const { MATCHING_CONFIG } = require('./config');
const { extractProjectDataWithAI } = require('./extract');
const { rankProjectsForFreelancer } = require('./scoring');
const { rankFreelancersWithEmbeddings } = require('./semantic');
const { createPortfolioEmbedder } = require('./semantic');

const ACTIVE_MATCH_STATUSES = ['SUGGESTED', 'FREELANCER_INTERESTED', 'CLIENT_INVITED', 'ACCEPTED'];
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function projectForScoring(project, extracted) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    categoryId: project.categoryId,
    categoryName: project.category?.name,
    budgetMin: extracted?.budgetMin ?? project.budgetMin,
    budgetMax: extracted?.budgetMax ?? project.budgetMax,
    deadline: extracted?.deadline ?? project.deadline,
    requiredLevel: extracted?.requiredLevel ?? 'BEGINNER',
    language: extracted?.language ?? null,
    size: extracted?.size ?? 'MEDIUM',
    estimatedHours: extracted?.estimatedHours ?? null,
    skills: (extracted?.skills ?? project.skills.map(({ skill }) => ({ ...skill, essential: true })))
      .map((skill) => ({ id: skill.id, name: skill.name, essential: skill.essential !== false })),
  };
}

function toScoringFreelancer(profile, review = { count: 0, avg: null }, exposure = {}) {
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    avatarUrl: profile.user.avatarUrl,
    blocked: profile.user.isBlocked,
    level: profile.level,
    hourlyRate: profile.hourlyRate,
    availability: profile.availability,
    languages: profile.languages,
    skills: profile.skills.map(({ level, verified, skill }) => ({ ...skill, level, verified })),
    portfolio: profile.portfolio,
    reviews: review,
    exposure: exposure.exposure ?? 0,
    lastExposureAt: exposure.lastExposureAt ?? null,
    isNewcomer: review.count < MATCHING_CONFIG.fairness.newcomerReviews,
  };
}

async function readExposure(side, ids, db, since) {
  if (!ids.length) return new Map();
  const targetField = side === 'CLIENT' ? 'freelancerId' : 'projectId';
  const grouped = await db.recommendationImpression.groupBy({
    by: [targetField],
    where: { side, [targetField]: { in: ids }, shownAt: { gte: since } },
    _count: { _all: true },
    _max: { shownAt: true },
  });
  return new Map(grouped.map((row) => [row[targetField], {
    exposure: row._count._all,
    lastExposureAt: row._max.shownAt,
  }]));
}

async function readReviews(userIds, db) {
  if (!userIds.length) return new Map();
  const rows = await db.review.groupBy({
    by: ['targetId'],
    where: { targetId: { in: userIds }, engagement: { status: 'COMPLETED' } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.targetId, { count: row._count._all, avg: row._avg.rating }]));
}

async function persistProjectMatches(projectId, ranked, db, side = 'CLIENT') {
  const active = new Set(['FREELANCER_INTERESTED', 'CLIENT_INVITED', 'ACCEPTED', 'DISMISSED']);
  const ids = ranked.map(({ freelancer }) => freelancer.id);
  const existing = ids.length
    ? await db.match.findMany({ where: { projectId, freelancerId: { in: ids } }, select: { id: true, freelancerId: true, status: true } })
    : [];
  const existingByProfile = new Map(existing.map((row) => [row.freelancerId, row]));
  for (const item of ranked) {
    const previous = existingByProfile.get(item.freelancer.id);
    const data = {
      score: item.score,
      reasons: { ...item.reasons, ...(side === 'FREELANCER' ? { reverse: true } : {}) },
      ...(side === 'CLIENT' ? { projectRank: item.rank } : { freelancerRank: item.rank }),
      ...(!previous || !active.has(previous.status) ? { status: 'SUGGESTED' } : {}),
    };
    await db.match.upsert({
      where: { projectId_freelancerId: { projectId, freelancerId: item.freelancer.id } },
      create: { projectId, freelancerId: item.freelancer.id, ...data },
      update: data,
    });
  }
}

async function loadProject(projectId, db) {
  return db.project.findUnique({
    where: { id: projectId },
    include: {
      category: { select: { id: true, name: true } },
      skills: { include: { skill: { select: { id: true, name: true, categoryId: true } } } },
    },
  });
}

async function matchFreelancersForProject(projectId, db = prisma) {
  const project = await loadProject(projectId, db);
  if (!project) throw new Error('Proiectul nu mai există.');
  if (project.status !== 'OPEN') {
    await db.project.update({ where: { id: projectId }, data: { matchingStatus: 'DONE', matchingError: null } });
    return { status: 'SKIPPED', data: [] };
  }
  await db.project.update({ where: { id: projectId }, data: { matchingStatus: 'RUNNING', matchingError: null } });

  try {
    const catalog = await db.skill.findMany({ select: { id: true, name: true, categoryId: true } });
    const explicit = project.skills.map(({ skill }) => skill);
    const extracted = await extractProjectDataWithAI({
      ...project,
      skills: explicit.map((skill) => ({ ...skill, essential: true })),
    }, catalog);
    const projectSkills = new Map(explicit.map((skill) => [skill.id, { ...skill, essential: true }]));
    for (const skill of extracted.skills) {
      if (!projectSkills.has(skill.id)) projectSkills.set(skill.id, { ...skill, essential: skill.essential !== false });
    }
    const skillRows = [...projectSkills.values()];
    const userSelected = new Set(explicit.map((skill) => skill.id));
    await db.$transaction(async (tx) => {
      await tx.projectSkill.deleteMany({ where: { projectId, source: { not: 'USER' } } });
      const inferred = skillRows.filter((skill) => !userSelected.has(skill.id));
      if (inferred.length) {
        await tx.projectSkill.createMany({
          data: inferred.map((skill) => ({ projectId, skillId: skill.id, source: 'AI' })),
          skipDuplicates: true,
        });
      }
      await tx.project.update({
        where: { id: projectId },
        data: {
          extracted: {
            skills: skillRows,
            budgetMin: extracted.budgetMin,
            budgetMax: extracted.budgetMax,
            deadline: extracted.deadline?.toISOString?.() ?? extracted.deadline ?? null,
            requiredLevel: extracted.requiredLevel,
            size: extracted.size,
            estimatedHours: extracted.estimatedHours,
            language: extracted.language,
            clarifyingQuestions: extracted.clarifyingQuestions,
            assumptions: extracted.assumptions,
            needsInfo: extracted.needsInfo,
            source: extracted.source,
          },
        },
      });
    });

    const profiles = await db.freelancerProfile.findMany({
      where: { onboarded: true, user: { role: 'FREELANCER', isBlocked: false } },
      take: MATCHING_CONFIG.limits.candidates,
      orderBy: [{ matchedAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, isBlocked: true } },
        skills: { include: { skill: { select: { id: true, name: true, categoryId: true } } } },
        portfolio: { select: { id: true, title: true, description: true, link: true, imageUrl: true, embedding: true } },
      },
    });
    const userIds = profiles.map((profile) => profile.userId);
    const since = new Date(Date.now() - WINDOW_MS);
    const [reviews, exposures, loads] = await Promise.all([
      readReviews(userIds, db),
      readExposure('CLIENT', profiles.map((profile) => profile.id), db, since),
      userIds.length ? db.engagement.groupBy({
        by: ['freelancerId'], where: { freelancerId: { in: userIds }, status: 'IN_PROGRESS' }, _count: { _all: true },
      }) : Promise.resolve([]),
    ]);
    const loadByUser = new Map(loads.map((row) => [row.freelancerId, row._count._all]));
    const freelancers = profiles.map((profile) => toScoringFreelancer(
      profile,
      reviews.get(profile.userId),
      exposures.get(profile.id),
    )).map((freelancer) => ({ ...freelancer, activeLoad: loadByUser.get(freelancer.userId) ?? 0 }));
    const rankContext = {
      seed: new Date().toISOString().slice(0, 10),
      exposureById: Object.fromEntries(freelancers.map((freelancer) => [freelancer.id, {
        exposure: freelancer.exposure,
        lastExposureAt: freelancer.lastExposureAt,
        activeLoad: freelancer.activeLoad,
      }])),
    };
    const scoringProject = projectForScoring(project, { ...extracted, skills: skillRows });
    const ranked = await rankFreelancersWithEmbeddings(scoringProject, freelancers, { fairnessContext: rankContext });
    await persistProjectMatches(projectId, ranked, db);
    await db.project.update({
      where: { id: projectId },
      data: { matchingStatus: 'DONE', matchingError: null, matchedAt: new Date() },
    });
    return { status: 'DONE', data: ranked.map((item) => ({
      id: item.freelancer.id,
      projectId,
      freelancerId: item.freelancer.id,
      score: item.score,
      reasons: item.reasons,
      createdAt: new Date(),
      projectRank: item.rank,
      project: { id: project.id, title: project.title, description: project.description, budgetMin: project.budgetMin,
        budgetMax: project.budgetMax, deadline: project.deadline, category: project.category, skills: skillRows, client: { name: null } },
      freelancer: item.freelancer,
    })), analysis: { source: extracted.source, needsInfo: extracted.needsInfo, questions: extracted.clarifyingQuestions, assumptions: extracted.assumptions } };
  } catch (error) {
    await db.project.update({
      where: { id: projectId },
      data: { matchingStatus: 'FAILED', matchingError: String(error?.message ?? error).slice(0, 240) },
    }).catch(() => {});
    throw error;
  }
}

async function matchProjectsForFreelancer(userId, db = prisma) {
  const profile = await db.freelancerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, isBlocked: true } },
      skills: { include: { skill: { select: { id: true, name: true, categoryId: true } } } },
      portfolio: { select: { id: true, title: true, description: true, link: true, imageUrl: true, embedding: true } },
    },
  });
  if (!profile || !profile.onboarded || profile.user.isBlocked) return [];
  const projects = await db.project.findMany({
    where: { status: 'OPEN', clientId: { not: userId } },
    take: MATCHING_CONFIG.limits.candidates,
    orderBy: [{ matchedAt: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    include: {
      category: { select: { id: true, name: true } },
      skills: { include: { skill: { select: { id: true, name: true, categoryId: true } } } },
    },
  });
  const scoringFreelancer = toScoringFreelancer(profile);
  const since = new Date(Date.now() - WINDOW_MS);
  const exposures = await readExposure('FREELANCER', projects.map((project) => project.id), db, since);
  const ranked = rankProjectsForFreelancer(scoringFreelancer, projects.map((project) => {
    const extracted = project.extracted;
    return projectForScoring(project, extracted || {
      skills: project.skills.map(({ skill }) => ({ ...skill, essential: true })),
      budgetMin: project.budgetMin, budgetMax: project.budgetMax, deadline: project.deadline,
      requiredLevel: 'BEGINNER', size: 'MEDIUM', language: null, estimatedHours: null,
    });
  }), {
    seed: new Date().toISOString().slice(0, 10),
    exposureById: Object.fromEntries(projects.map((project) => [project.id, exposures.get(project.id) ?? { exposure: 0, lastExposureAt: null }])),
  });
  const projectById = new Map(projects.map((project) => [project.id, project]));
  for (const item of ranked) {
    const project = projectById.get(item.project.id);
    if (!project) continue;
    const previous = await db.match.findUnique({
      where: { projectId_freelancerId: { projectId: project.id, freelancerId: profile.id } },
      select: { status: true },
    });
    await db.match.upsert({
      where: { projectId_freelancerId: { projectId: project.id, freelancerId: profile.id } },
      create: { projectId: project.id, freelancerId: profile.id, score: item.score, reasons: item.reasons, freelancerRank: item.rank },
      update: {
        score: item.score,
        reasons: item.reasons,
        freelancerRank: item.rank,
        ...(!previous || !['FREELANCER_INTERESTED', 'CLIENT_INVITED', 'ACCEPTED', 'DISMISSED'].includes(previous.status) ? { status: 'SUGGESTED' } : {}),
      },
    });
  }
  await db.freelancerProfile.update({ where: { id: profile.id }, data: { matchedAt: new Date() } });
  return ranked;
}

module.exports = { matchFreelancersForProject, matchProjectsForFreelancer, projectForScoring, toScoringFreelancer, ACTIVE_MATCH_STATUSES };
