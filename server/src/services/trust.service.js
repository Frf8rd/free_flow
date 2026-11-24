const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");

const DAY_MS = 24 * 60 * 60 * 1000;

// Nivelurile, în ordine crescătoare.
const LEVELS = [
  { level: "NEW", label: "Nou" },
  { level: "VERIFIED", label: "Verificat" },
  { level: "TRUSTED", label: "De încredere" },
  { level: "TOP", label: "Excelent" },
];

// CRITERIILE — singurul loc de modificat pentru a schimba regulile.
// Pentru TRUSTED și TOP trebuie îndeplinite toate: email verificat, vechime, colaborări finalizate
// și nicio raportare confirmată (Report cu status RESOLVED pe contul utilizatorului).
// Dacă există o raportare confirmată, nivelul maxim este VERIFIED.
const CRITERIA = {
  TRUSTED: { minAccountDays: 30, minCompletedEngagements: 3 },
  TOP: { minAccountDays: 90, minCompletedEngagements: 10 },
};

function toPublic(trust) {
  return { level: trust.level, label: trust.label };
}

/**
 * Calcul pur (fără bază de date) al nivelului de încredere.
 * @param {{createdAt: Date, emailVerifiedAt: Date|null, completedEngagements: number, upheldReports: number}} facts
 */
function computeTrust(facts, now = new Date()) {
  const accountDays = Math.max(0, Math.floor((now.getTime() - new Date(facts.createdAt).getTime()) / DAY_MS));
  const verified = Boolean(facts.emailVerifiedAt);
  const clean = facts.upheldReports === 0;
  const completed = facts.completedEngagements;

  const meets = (criteria) =>
    verified && clean && accountDays >= criteria.minAccountDays && completed >= criteria.minCompletedEngagements;

  let index = 0;
  if (verified) index = 1;
  if (meets(CRITERIA.TRUSTED)) index = 2;
  if (meets(CRITERIA.TOP)) index = 3;

  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;

  let requirements = [];
  if (next && next.level === "VERIFIED") {
    requirements = [{ key: "emailVerified", label: "Adresa de email verificată", met: verified }];
  } else if (next) {
    const criteria = CRITERIA[next.level];
    requirements = [
      { key: "emailVerified", label: "Adresa de email verificată", met: verified },
      {
        key: "accountAge",
        label: `Cont mai vechi de ${criteria.minAccountDays} de zile`,
        met: accountDays >= criteria.minAccountDays,
        current: accountDays,
        target: criteria.minAccountDays,
      },
      {
        key: "completedEngagements",
        label: `Cel puțin ${criteria.minCompletedEngagements} colaborări finalizate`,
        met: completed >= criteria.minCompletedEngagements,
        current: completed,
        target: criteria.minCompletedEngagements,
      },
      { key: "noUpheldReports", label: "Fără raportări confirmate", met: clean },
    ];
  }

  return {
    level: current.level,
    label: current.label,
    nextLevel: next ? { level: next.level, label: next.label } : null,
    requirements,
  };
}

/** Încarcă datele necesare pentru mai mulți utilizatori deodată și întoarce Map(userId -> trust). */
async function getTrustSummaries(userIds, db = prisma, now = new Date()) {
  const ids = [...new Set(userIds)];
  const result = new Map();
  if (!ids.length) return result;

  const [users, asClient, asFreelancer, reports] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids } }, select: { id: true, createdAt: true, emailVerifiedAt: true } }),
    db.engagement.groupBy({
      by: ["clientId"],
      where: { status: "COMPLETED", clientId: { in: ids } },
      _count: { _all: true },
    }),
    db.engagement.groupBy({
      by: ["freelancerId"],
      where: { status: "COMPLETED", freelancerId: { in: ids } },
      _count: { _all: true },
    }),
    db.report.groupBy({
      by: ["targetId"],
      where: { targetType: "USER", status: "RESOLVED", targetId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const completed = new Map();
  for (const row of asClient) completed.set(row.clientId, (completed.get(row.clientId) || 0) + row._count._all);
  for (const row of asFreelancer) completed.set(row.freelancerId, (completed.get(row.freelancerId) || 0) + row._count._all);
  const upheld = new Map(reports.map((row) => [row.targetId, row._count._all]));

  for (const user of users) {
    result.set(user.id, computeTrust({
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
      completedEngagements: completed.get(user.id) || 0,
      upheldReports: upheld.get(user.id) || 0,
    }, now));
  }
  return result;
}

// Detaliile complete (cu cerințele pentru nivelul următor) — doar pentru utilizatorul însuși.
async function getMyTrust(userId, db = prisma) {
  const trust = (await getTrustSummaries([userId], db)).get(userId);
  if (!trust) throw new AppError(404, "USER_NOT_FOUND", "Utilizatorul nu a fost găsit.");
  return trust;
}

// Vizibil pentru ceilalți: doar nivelul și eticheta (fără detalii despre raportări sau colaborări).
async function getPublicTrust(userId, db = prisma) {
  const trust = (await getTrustSummaries([userId], db)).get(userId);
  if (!trust) throw new AppError(404, "USER_NOT_FOUND", "Utilizatorul nu a fost găsit.");
  return toPublic(trust);
}

module.exports = {
  LEVELS,
  CRITERIA,
  computeTrust,
  getTrustSummaries,
  getMyTrust,
  getPublicTrust,
  toPublic,
};