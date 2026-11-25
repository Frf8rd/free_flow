/** Înregistrează procesarea joburilor pe un adapter de coadă. */
function createMatchingWorker({ adapter, matching, logger = console }) {
  if (!adapter || typeof adapter.registerWorker !== 'function') {
    throw new TypeError('Adapterul cozii trebuie să implementeze registerWorker');
  }
  if (!matching) throw new TypeError('Serviciul matching este obligatoriu');

  const unregister = adapter.registerWorker(async (job) => {
    try {
      if (job.type === 'PROJECT') return await matching.matchFreelancersForProject(job.id);
      if (job.type === 'FREELANCER') return await matching.matchProjectsForFreelancer(job.id);
      throw new Error(`Tip de job matching necunoscut: ${job.type}`);
    } catch (error) {
      logger.error?.({ error, job }, 'Procesarea jobului de matching a eșuat');
      throw error;
    }
  });

  return {
    async stop() {
      unregister?.();
    },
    onError(error, job) {
      logger.error?.({ error, job }, 'Job de matching eșuat');
    },
  };
}

module.exports = { createMatchingWorker };
