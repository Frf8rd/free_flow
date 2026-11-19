const test = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../utils/errors");
const { createProject, listProjects, getProject } = require("./projects.service");

function expectAppError(promise, status, code) {
  return assert.rejects(promise, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

test("createProject validates budgets and category-specific skills before writing", async () => {
  let created = false;
  const db = {
    category: { findUnique: async () => ({ id: "web" }) },
    skill: { findMany: async () => [{ id: "react" }] },
    project: {
      create: async (args) => {
        created = true;
        return args;
      },
    },
  };
  const input = {
    title: "  Website  ",
    description: " Build a website ",
    categoryId: "web",
    budgetMin: 200,
    budgetMax: 100,
  };

  await expectAppError(createProject("client-1", input, db), 400, "VALIDATION_ERROR");
  assert.equal(created, false);

  input.budgetMax = 300;
  input.skillIds = ["react", "vue"];
  await expectAppError(createProject("client-1", input, db), 400, "INVALID_SKILLS");
  assert.equal(created, false);
});

test("createProject trims input and associates validated skills", async () => {
  const db = {
    category: { findUnique: async () => ({ id: "web" }) },
    skill: { findMany: async () => [{ id: "react" }] },
    project: { create: async (args) => args },
  };
  const result = await createProject("client-1", {
    title: "  Website  ",
    description: " Build a website ",
    categoryId: "web",
    budgetMin: null,
    skillIds: ["react"],
  }, db);

  assert.equal(result.data.title, "Website");
  assert.equal(result.data.description, "Build a website");
  assert.equal(result.data.clientId, "client-1");
  assert.deepEqual(result.data.skills.create, [
    { skill: { connect: { id: "react" } } },
  ]);
});

test("listProjects limits public listing to open projects and applies pagination", async () => {
  let receivedWhere;
  let receivedOptions;
  const db = {
    project: {
      count: async ({ where }) => {
        receivedWhere = where;
        return 2;
      },
      findMany: async (options) => {
        receivedOptions = options;
        return [{ id: "project-1" }];
      },
    },
  };
  const result = await listProjects({ page: "2", limit: "5", q: "design" }, { db });

  assert.equal(receivedWhere.status, "OPEN");
  assert.deepEqual(receivedWhere.OR, [
    { title: { contains: "design", mode: "insensitive" } },
    { description: { contains: "design", mode: "insensitive" } },
  ]);
  assert.equal(receivedOptions.skip, 5);
  assert.equal(receivedOptions.take, 5);
  assert.deepEqual(result, { data: [{ id: "project-1" }], page: 2, limit: 5, total: 2 });
});

test("listProjects scopes a client's own list and rejects invalid pagination", async () => {
  let receivedWhere;
  const db = {
    project: {
      count: async ({ where }) => {
        receivedWhere = where;
        return 0;
      },
      findMany: async () => [],
    },
  };
  await listProjects({}, { clientId: "client-1", db });
  assert.deepEqual(receivedWhere, { clientId: "client-1" });
  await expectAppError(listProjects({ limit: "101" }, { db }), 400, "VALIDATION_ERROR");
});

test("getProject returns a not-found error for unknown projects", async () => {
  const db = { project: { findUnique: async () => null } };
  await expectAppError(getProject("missing", db), 404, "PROJECT_NOT_FOUND");
});
