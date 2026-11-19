function createInMemoryQueueAdapter({ concurrency = 2, maxAttempts = 3, retryDelayMs = 500, onFailed = () => {} } = {}) {
  const jobs = [];
  let handler = null;
  let active = 0;
  let closed = false;
  let delayedRetries = 0;

  function pump() {
    while (!closed && handler && active < concurrency && jobs.length) {
      const job = jobs.shift();
      active += 1;
      Promise.resolve()
        .then(() => handler(job))
        .catch((error) => {
          if (job.attempt < maxAttempts) {
            const retry = { ...job, attempt: job.attempt + 1 };
            delayedRetries += 1;
            setTimeout(() => {
              delayedRetries -= 1;
              jobs.push(retry);
              pump();
            }, retryDelayMs * job.attempt);
          } else {
            onFailed(error, job);
          }
        })
        .finally(() => {
          active -= 1;
          pump();
        });
    }
  }

  return {
    enqueue(job) {
      if (closed) throw new Error('Coada de matching este oprită');
      jobs.push({ ...job, attempt: 1 });
      pump();
    },
    registerWorker(worker) {
      handler = worker;
      pump();
      return () => { handler = null; };
    },
    async close() {
      while (active > 0 || jobs.length > 0 || delayedRetries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      closed = true;
    },
  };
}

/**
 * Coalescește actualizările rapide pentru același proiect sau profil.
 * Adapterul implicit este pentru dezvoltare; backendul poate injecta un adapter persistent.
 */
function createMatchingQueue({
  adapter = createInMemoryQueueAdapter(),
  projectDebounceMs = 15000,
  freelancerDebounceMs = 60000,
} = {}) {
  const timers = new Map();
  let stopped = false;

  function enqueue(type, id) {
    if (stopped) return Promise.reject(new Error('Coada de matching este oprită'));
    if (id === null || id === undefined || id === '') return Promise.reject(new TypeError('ID-ul pentru matching este obligatoriu'));
    const key = `${type}:${id}`;
    const previous = timers.get(key);
    if (previous) {
      clearTimeout(previous.timer);
      previous.resolve({ status: 'coalesced', type, id });
    }
    const delay = type === 'PROJECT' ? projectDebounceMs : freelancerDebounceMs;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        timers.delete(key);
        try {
          adapter.enqueue({ type, id });
          resolve({ status: 'queued', type, id });
        } catch (error) {
          reject(error);
        }
      }, delay);
      timers.set(key, { timer, resolve });
    });
  }

  return {
    enqueueProject: (projectId) => enqueue('PROJECT', projectId),
    enqueueFreelancer: (freelancerId) => enqueue('FREELANCER', freelancerId),
    async stop() {
      stopped = true;
      for (const [key, pending] of timers) {
        clearTimeout(pending.timer);
        pending.resolve({ status: 'cancelled', key });
      }
      timers.clear();
      await adapter.close?.();
    },
  };
}

module.exports = { createMatchingQueue, createInMemoryQueueAdapter };
