const prisma = require('../../config/prisma');
const MAX_MATCHING_ATTEMPTS = 5;

async function enqueueMatchingJob(type, targetId, db = prisma) {
  if (!['PROJECT', 'FREELANCER'].includes(type) || typeof targetId !== 'string' || !targetId.trim()) {
    throw new TypeError('Un tip și un identificator de matching valide sunt obligatorii.');
  }
  const now = new Date();
  return db.matchingJob.upsert({
    where: { type_targetId: { type, targetId: targetId.trim() } },
    create: { type, targetId: targetId.trim(), nextRunAt: now },
    update: { attempts: 0, nextRunAt: now, revision: { increment: 1 }, lastError: null },
  });
}

module.exports = { enqueueMatchingJob, MAX_MATCHING_ATTEMPTS };
