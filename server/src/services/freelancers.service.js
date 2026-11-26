const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const {
  profileUpdateSchema,
  portfolioCreateSchema,
  portfolioUpdateSchema,
  idSchema,
  parse,
} = require('../validators/freelancers.validator');
const trustService = require('./trust.service');
const { enqueueMatchingJob } = require('./matching/jobs');

const MAX_PORTFOLIO_ITEMS = 20;

const portfolioSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  link: true,
  createdAt: true,
  updatedAt: true,
};

const freelancerSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  role: true,
  isBlocked: true,
  freelancerProfile: {
    select: {
      id: true,
      title: true,
      bio: true,
      level: true,
      hourlyRate: true,
      availability: true,
      languages: true,
      onboarded: true,
      tier: true,
      completedCount: true,
      createdAt: true,
      updatedAt: true,
      skills: { select: { level: true, verified: true, skill: { select: { id: true, name: true, categoryId: true } } } },
      portfolio: {
        select: portfolioSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      },
    },
  },
};

// `id` este id-ul utilizatorului (același cu freelancerId din engagements).
// Un freelancer fără profil salvat primește valorile implicite, nu 404.
function toFreelancerDto(user) {
  const profile = user.freelancerProfile;
  return {
    id: user.id,
    userId: user.id,
    profileId: profile?.id ?? null,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    title: profile?.title ?? '',
    bio: profile?.bio ?? '',
    level: profile?.level ?? 'BEGINNER',
    hourlyRate: profile?.hourlyRate ?? null,
    availability: profile?.availability ?? 'AVAILABLE',
    languages: profile?.languages ?? [],
    onboarded: Boolean(profile?.onboarded),
    tier: profile?.tier ?? 'START',
    completedCount: profile?.completedCount ?? 0,
    skills: (profile?.skills ?? [])
      .map((entry) => ({ ...entry.skill, level: entry.level, verified: entry.verified }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    portfolio: (profile?.portfolio ?? []).map(({ profileId, ...item }) => item),
    createdAt: profile?.createdAt ?? null,
    updatedAt: profile?.updatedAt ?? null,
  };
}

// Nivelul de încredere (KAN-36) se afișează pe profil: doar nivelul și eticheta, fără detalii.
async function withTrustLevel(dto, db) {
  return { ...dto, trustLevel: await trustService.getPublicTrust(dto.id, db) };
}

async function loadFreelancer(userId, db) {
  return db.user.findUnique({ where: { id: userId }, select: freelancerSelect });
}

async function getMyProfile(userId, db = prisma) {
  const user = await loadFreelancer(userId, db);
  if (!user) throw new AppError(404, 'FREELANCER_NOT_FOUND', 'Profilul nu a fost găsit.');
  return withTrustLevel(toFreelancerDto(user), db);
}

async function getFreelancerProfile(id, db = prisma) {
  const freelancerId = parse(idSchema, id);
  const user = await loadFreelancer(freelancerId, db);
  if (!user || user.role !== 'FREELANCER' || user.isBlocked) {
    throw new AppError(404, 'FREELANCER_NOT_FOUND', 'Freelancerul nu a fost găsit.');
  }
  return withTrustLevel(toFreelancerDto(user), db);
}

// Două cereri simultane la prima salvare pot încerca să creeze ambele profilul (P2002) — a doua încercare îl găsește deja creat.
async function retryOnUniqueConflict(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error && error.code === 'P2002') return operation();
    throw error;
  }
}

async function updateMyProfile(userId, input, db = prisma) {
  const { skillIds, ...fields } = parse(profileUpdateSchema, input);

  if (skillIds && skillIds.length) {
    const skills = await db.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true },
    });
    if (skills.length !== skillIds.length) {
      throw new AppError(400, 'INVALID_SKILLS', 'Selectează abilități existente din catalog.');
    }
  }

  const saved = await retryOnUniqueConflict(() => db.$transaction(async (tx) => {
    const profile = await tx.freelancerProfile.upsert({
      where: { userId },
      create: { userId, ...fields, onboarded: false },
      update: fields,
      select: { id: true, title: true, bio: true },
    });

    let skillCount;
    if (skillIds !== undefined) {
      if (skillIds.length) {
        await tx.freelancerSkill.deleteMany({ where: { freelancerId: profile.id, skillId: { notIn: skillIds } } });
        await tx.freelancerSkill.createMany({
          data: skillIds.map((skillId) => ({ freelancerId: profile.id, skillId })),
          skipDuplicates: true,
        });
      } else {
        await tx.freelancerSkill.deleteMany({ where: { freelancerId: profile.id } });
      }
      skillCount = skillIds.length;
    } else {
      skillCount = await tx.freelancerSkill.count({ where: { freelancerId: profile.id } });
    }

    // Tariful este opțional („La cerere”); eligibilitatea se bazează pe profil și competențe.
    const complete = Boolean(profile.title?.trim().length >= 3 && profile.bio?.trim().length >= 30 && skillCount > 0);
    await tx.freelancerProfile.update({ where: { id: profile.id }, data: { onboarded: complete } });
    return profile;
  }));

  if (db === prisma) await enqueueMatchingJob('FREELANCER', userId, db);

  return getMyProfile(userId, db);
}

async function listMyPortfolio(userId, db = prisma) {
  return db.portfolioItem.findMany({
    where: { profile: { userId } },
    select: portfolioSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function createPortfolioItem(userId, input, db = prisma) {
  const data = parse(portfolioCreateSchema, input);

  const profile = await retryOnUniqueConflict(() =>
    db.freelancerProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    }),
  );

  const count = await db.portfolioItem.count({ where: { profileId: profile.id } });
  if (count >= MAX_PORTFOLIO_ITEMS) {
    throw new AppError(
      409,
      'PORTFOLIO_LIMIT_REACHED',
      `Poți avea maximum ${MAX_PORTFOLIO_ITEMS} de lucrări în portofoliu.`,
    );
  }

  const item = await db.portfolioItem.create({
    data: { profileId: profile.id, ...data },
    select: portfolioSelect,
  });
  if (db === prisma) await enqueueMatchingJob('FREELANCER', userId, db);
  return item;
}

// Verificarea proprietății: elementul trebuie să existe și să aparțină profilului utilizatorului curent.
async function findOwnedPortfolioItem(itemId, userId, db) {
  const id = parse(idSchema, itemId);
  const item = await db.portfolioItem.findUnique({
    where: { id },
    select: { id: true, profile: { select: { userId: true } } },
  });
  if (!item) throw new AppError(404, 'PORTFOLIO_ITEM_NOT_FOUND', 'Lucrarea nu a fost găsită.');
  if (item.profile.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Poți modifica doar lucrările din propriul portofoliu.');
  }
  return item;
}

async function updatePortfolioItem(userId, itemId, input, db = prisma) {
  const data = parse(portfolioUpdateSchema, input);
  const item = await findOwnedPortfolioItem(itemId, userId, db);
  const updated = await db.portfolioItem.update({
    where: { id: item.id },
    data,
    select: portfolioSelect,
  });
  if (db === prisma) await enqueueMatchingJob('FREELANCER', userId, db);
  return updated;
}

async function deletePortfolioItem(userId, itemId, db = prisma) {
  const item = await findOwnedPortfolioItem(itemId, userId, db);
  await db.portfolioItem.delete({ where: { id: item.id } });
  if (db === prisma) await enqueueMatchingJob('FREELANCER', userId, db);
}

module.exports = {
  MAX_PORTFOLIO_ITEMS,
  getMyProfile,
  getFreelancerProfile,
  updateMyProfile,
  listMyPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
};
