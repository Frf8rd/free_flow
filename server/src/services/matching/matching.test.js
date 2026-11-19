const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MATCHING_CONFIG,
  extractProjectData,
  extractProjectDataWithAI,
  scoreFreelancerForProject,
  rankFreelancers,
  rankProjectsForFreelancer,
  filterFreelancers,
  applyFairness,
  buildReasons,
} = require('./index');
const { cosineSimilarity, rankFreelancersWithEmbeddings } = require('./semantic');
const { createInMemoryQueueAdapter, createMatchingQueue } = require('./queue');
const { createMatchingWorker } = require('./worker');

const fixedNow = new Date('2026-11-20T12:00:00.000Z');
const sampleProject = {
  id: 'project-1',
  title: 'Interfață website pentru un magazin',
  description: 'Avem nevoie de React și design UI, proiect junior în 10 zile.',
  categoryId: 'web',
  categoryName: 'Dezvoltare web',
  size: 'SMALL',
  requiredLevel: 'JUNIOR',
  language: 'ro',
  budgetMin: 300,
  budgetMax: 1000,
  deadline: new Date('2026-12-20T12:00:00.000Z'),
  estimatedHours: 10,
  skills: [
    { id: 'react', name: 'React', essential: true },
    { id: 'ui', name: 'UI design', essential: false },
  ],
};

function makeFreelancer(overrides = {}) {
  return {
    id: 'freelancer-1',
    userId: 'user-1',
    level: 'JUNIOR',
    hourlyRate: 30,
    availability: 'AVAILABLE',
    languages: ['Română', 'English'],
    blocked: false,
    skills: [
      { id: 'react', name: 'React', level: 'JUNIOR', verified: true, categoryId: 'web' },
      { id: 'ui', name: 'UI design', level: 'JUNIOR', verified: false, categoryId: 'web' },
    ],
    portfolio: [{ title: 'Interfață magazin online', description: 'Website React pentru retail.' }],
    reviews: { count: 0, avg: null },
    ...overrides,
  };
}

/** Date sintetice folosite și de testele de echitate din acest fișier. */
function createSyntheticFairnessData(freelancerCount = 40, projectCount = 30) {
  const freelancers = Array.from({ length: freelancerCount }, (_, index) => ({
    id: `synthetic-${index + 1}`,
    score: index < 5 ? 96 : 78 + ((index * 7) % 13),
    isNewcomer: index >= 5,
  }));
  return { freelancers, projectIds: Array.from({ length: projectCount }, (_, index) => `synthetic-project-${index + 1}`) };
}

function gini(values) {
  const sorted = values.map((value) => Math.max(0, value)).sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

function simulateFairExposure(dataset = createSyntheticFairnessData()) {
  const counts = new Map(dataset.freelancers.map((freelancer) => [freelancer.id, 0]));
  for (const projectId of dataset.projectIds) {
    const items = dataset.freelancers.map((freelancer) => ({
      key: freelancer.id,
      score: freelancer.score,
      isNewcomer: freelancer.isNewcomer,
      exposure: counts.get(freelancer.id),
      activeLoad: counts.get(freelancer.id),
    }));
    const ranked = applyFairness(items, {
      topK: 5,
      explorationSlots: 2,
      explorationMinScore: 50,
      explorationBand: 20,
      mainBand: 5,
      lowExposure: 2,
      maxActive: 15,
      seed: projectId,
    });
    for (const item of ranked.slice(0, 5)) counts.set(item.key, counts.get(item.key) + 1);
  }
  return { counts, gini: gini([...counts.values()]) };
}

test('rule extraction finds catalog skills, budget, deadline and level', () => {
  const project = {
    title: 'Site pentru magazin',
    description: 'Căutăm React, buget între 300 și 900 lei, livrare în 10 zile pentru nivel junior.',
  };
  const extracted = extractProjectData(project, [{ id: 'react', name: 'React' }], { now: fixedNow });
  assert.equal(extracted.source, 'rules');
  assert.deepEqual(extracted.skills.map((skill) => skill.id), ['react']);
  assert.equal(extracted.budgetMin, 300);
  assert.equal(extracted.budgetMax, 900);
  assert.equal(extracted.requiredLevel, 'JUNIOR');
  assert.equal(extracted.deadline.toISOString(), '2026-11-30T12:00:00.000Z');
});

test('AI extraction is validated and falls back to deterministic rules on failure', async () => {
  const project = { title: 'React site', description: 'Site React, buget 500 lei' };
  const catalog = [{ id: 'react', name: 'React' }];
  const fallback = await extractProjectDataWithAI(project, catalog, {
    now: fixedNow,
    analyzer: { analyze: async () => { throw new Error('provider offline'); } },
  });
  assert.equal(fallback.source, 'rules');
  assert.match(fallback.aiError, /provider offline/);

  const analyzed = await extractProjectDataWithAI(project, catalog, {
    now: fixedNow,
    analyzer: { analyze: async () => ({
      skills: [{ name: 'React', essential: true }, { name: 'unlisted skill', essential: true }],
      size: 'SMALL', estimatedHours: 12, requiredLevel: 'JUNIOR', language: 'ro',
      clarifyingQuestions: [], assumptions: ['Aplicație web simplă'],
    }) },
  });
  assert.equal(analyzed.source, 'ai');
  assert.deepEqual(analyzed.skills.map((skill) => skill.id), ['react']);
  assert.equal(analyzed.estimatedHours, 12);
});

test('full score returns weighted components and explanation facts', () => {
  const freelancer = makeFreelancer();
  const result = scoreFreelancerForProject(sampleProject, freelancer, MATCHING_CONFIG, fixedNow);
  assert.equal(result.eligible, true);
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.deepEqual(Object.keys(result.components), ['skills', 'evidence', 'budget', 'availability', 'level', 'trust', 'other']);
  assert.equal(Object.values(MATCHING_CONFIG.weights).reduce((sum, weight) => sum + weight, 0), 1);
  const reasons = buildReasons(result, sampleProject, freelancer);
  assert.ok(reasons.forClient.some((reason) => reason.code === 'SKILLS'));
  assert.ok(reasons.forFreelancer.some((reason) => reason.code === 'BUDGET'));
});

test('hard filters reject blocked, over-budget and under-skilled freelancers', () => {
  const candidates = [
    makeFreelancer({ id: 'blocked', blocked: true }),
    makeFreelancer({ id: 'expensive', hourlyRate: 500 }),
    makeFreelancer({ id: 'missing', skills: [{ id: 'other', name: 'Other', level: 'JUNIOR' }] }),
    makeFreelancer({ id: 'eligible' }),
  ];
  const result = filterFreelancers(sampleProject, candidates, MATCHING_CONFIG, fixedNow);
  assert.deepEqual(result.eligible.map((item) => item.freelancer.id), ['eligible']);
  assert.deepEqual(result.rejected.map((item) => item.reasons[0]), [
    'ACCOUNT_BLOCKED', 'PRICE_TOO_HIGH', 'MISSING_ESSENTIAL_SKILLS',
  ]);
});

test('reverse matching ranks suitable projects for a freelancer', () => {
  const freelancer = makeFreelancer();
  const projects = [
    sampleProject,
    { ...sampleProject, id: 'project-2', skills: [{ id: 'python', name: 'Python', essential: true }] },
  ];
  const ranked = rankProjectsForFreelancer(freelancer, projects, MATCHING_CONFIG, { now: fixedNow });
  assert.deepEqual(ranked.map((item) => item.project.id), ['project-1']);
  assert.equal(ranked[0].rank, 1);
  assert.ok(ranked[0].reasons.forFreelancer.length > 0);
});

test('semantic portfolio similarity can surface a lexically different related work', async () => {
  const project = {
    ...sampleProject,
    title: 'Logo pentru patiserie',
    categoryName: 'Design',
    skills: [{ id: 'design', name: 'Graphic design', essential: true }],
  };
  const freelancer = makeFreelancer({
    skills: [{ id: 'design', name: 'Graphic design', level: 'JUNIOR', verified: false, categoryId: 'design' }],
    portfolio: [{ title: 'Bakery brand identity', description: 'Visual identity for a local bakery.' }],
  });
  const embedder = { embed: async (texts) => texts.map((_, index) => index === 0 ? [1, 0] : [0.9, 0.1]) };
  const ranked = await rankFreelancersWithEmbeddings(project, [freelancer], {
    config: MATCHING_CONFIG,
    fairnessContext: { now: fixedNow },
    embedder,
  });
  assert.equal(ranked.length, 1);
  assert.ok(ranked[0].details.semanticPortfolio > 0);
  assert.ok(ranked[0].reasons.forClient.some((reason) => reason.code === 'PORTFOLIO_SEMANTIC'));
  assert.equal(cosineSimilarity([1, 0], [0.9, 0.1]) > 0.9, true);
});

test('fairness simulation gives newcomers exposure without extreme concentration', () => {
  const dataset = createSyntheticFairnessData();
  const simulation = simulateFairExposure(dataset);
  const newcomers = dataset.freelancers.filter((freelancer) => freelancer.isNewcomer);
  const exposedNewcomers = newcomers.filter((freelancer) => simulation.counts.get(freelancer.id) > 0);
  assert.ok(exposedNewcomers.length / newcomers.length >= 0.8);
  assert.ok(simulation.gini < 0.5);
});

test('queue coalesces quick updates and worker routes jobs to both matching directions', async () => {
  const adapter = createInMemoryQueueAdapter({ concurrency: 1, retryDelayMs: 1 });
  const calls = [];
  const matching = {
    async matchFreelancersForProject(id) { calls.push(`project:${id}`); },
    async matchProjectsForFreelancer(id) { calls.push(`freelancer:${id}`); },
  };
  createMatchingWorker({ adapter, matching, logger: { error() {} } });
  const queue = createMatchingQueue({ adapter, projectDebounceMs: 5, freelancerDebounceMs: 5 });
  const first = queue.enqueueProject('p-1');
  const second = queue.enqueueProject('p-1');
  assert.equal((await first).status, 'coalesced');
  await second;
  await queue.enqueueFreelancer('f-1');
  await new Promise((resolve) => setTimeout(resolve, 20));
  await queue.stop();
  assert.deepEqual(calls, ['project:p-1', 'freelancer:f-1']);
});
