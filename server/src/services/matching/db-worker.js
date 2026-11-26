const prisma = require('../../config/prisma');
const { matchFreelancersForProject, matchProjectsForFreelancer } = require('./application');

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_MS = Number(process.env.MATCHING_POLL_MS) || 3000;
let timer = null;
let running = false;

async function processOne(db = prisma) {
  const staleBefore = new Date(Date.now() - LOCK_TIMEOUT_MS);
  const candidates = await db.matchingJob.findMany({
    where: { nextRunAt: { lte: new Date() }, OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }] },
    orderBy: [{ nextRunAt: 'asc' }, { createdAt: 'asc' }],
    take: 10,
  });
  for (const candidate of candidates) {
    const claimed = await db.matchingJob.updateMany({
      where: { id: candidate.id, nextRunAt: { lte: new Date() }, OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }] },
      data: { lockedAt: new Date() },
    });
    if (!claimed.count) continue;
    try {
      if (candidate.type === 'PROJECT') await matchFreelancersForProject(candidate.targetId, db);
      else await matchProjectsForFreelancer(candidate.targetId, db);
      const current = await db.matchingJob.findUnique({ where: { id: candidate.id }, select: { revision: true } });
      if (current && current.revision !== candidate.revision) {
        await db.matchingJob.update({ where: { id: candidate.id }, data: { attempts: 0, nextRunAt: new Date(), lockedAt: null, lastError: null } });
      } else if (current) {
        await db.matchingJob.deleteMany({ where: { id: candidate.id, revision: candidate.revision } });
      }
    } catch (error) {
      const attempts = candidate.attempts + 1;
      const exhausted = attempts >= 5;
      await db.matchingJob.update({
        where: { id: candidate.id },
        data: {
          attempts,
          lockedAt: null,
          lastError: String(error?.message ?? error).slice(0, 240),
          nextRunAt: exhausted ? new Date('9999-12-31T00:00:00.000Z') : new Date(Date.now() + Math.min(60_000, 1000 * (2 ** attempts))),
        },
      });
      console.error('Matching job failed.', { jobId: candidate.id, type: candidate.type, attempts });
    }
    return true;
  }
  return false;
}

async function tick() {
  if (running) return;
  running = true;
  try {
    while (await processOne()) { /* drain ready jobs */ }
  } catch (error) {
    console.error('Matching worker poll failed.', { code: error?.code || 'UNKNOWN' });
  } finally {
    running = false;
  }
}

function startMatchingWorker() {
  if (timer) return;
  timer = setInterval(tick, POLL_MS);
  timer.unref?.();
  void tick();
}

function stopMatchingWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { processOne, startMatchingWorker, stopMatchingWorker };
