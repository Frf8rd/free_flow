const test = require('node:test');
const assert = require('node:assert/strict');
const { listForProject } = require('./matches.service');

test('project matches endpoint returns processing state for client polling', async () => {
  const project = {
    id: 'project-1', clientId: 'client-1', matchingStatus: 'RUNNING', matchingError: null,
    extracted: { source: 'rules', needsInfo: true, clarifyingQuestions: ['Ce trebuie livrat?'], assumptions: [] },
  };
  const matches = [{ id: 'match-1', score: 82 }];
  const db = {
    project: { findUnique: async () => project },
    match: { findMany: async () => matches },
  };

  assert.deepEqual(await listForProject({ id: 'client-1' }, 'project-1', db), {
    status: 'RUNNING', error: null, data: matches,
    analysis: { source: 'rules', needsInfo: true, questions: ['Ce trebuie livrat?'], assumptions: [] },
  });
});
