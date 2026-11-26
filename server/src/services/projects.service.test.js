const test = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../utils/errors");
const {
  createProject,
  updateProject,
  closeProject,
  reopenProject,
  deleteProject,
  listProjects,
  getProject,
} = require("./projects.service");

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
  assert.deepEqual(result, { data: [{ id: "project-1", matchesCount: 0, interestedCount: 0 }], page: 2, limit: 5, total: 2 });
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

test("updateProject only changes supplied fields and clears old skills when category changes", async () => {
  let updateArgs;
  const db = {
    project: {
      findUnique: async () => ({
        id: "project-1",
        clientId: "client-1",
        status: "OPEN",
        categoryId: "web",
        budgetMin: 100,
        budgetMax: 300,
      }),
      update: async (args) => {
        updateArgs = args;
        return args;
      },
    },
    category: { findUnique: async () => ({ id: "design" }) },
  };

  await updateProject("project-1", "client-1", { categoryId: "design" }, db);
  assert.equal(updateArgs.data.categoryId, "design");
  assert.deepEqual(updateArgs.data.skills, { deleteMany: {} });
  assert.equal(updateArgs.data.title, undefined);
});

test("updateProject rejects changes by non-owners and invalid budget ranges", async () => {
  let updated = false;
  const db = {
    project: {
      findUnique: async () => ({
        id: "project-1",
        clientId: "other-client",
        status: "OPEN",
        categoryId: "web",
        budgetMin: 100,
        budgetMax: 300,
      }),
      update: async () => {
        updated = true;
      },
    },
  };
  await expectAppError(updateProject("project-1", "client-1", { title: "New title" }, db), 403, "FORBIDDEN");
  assert.equal(updated, false);

  db.project.findUnique = async () => ({
    id: "project-1",
    clientId: "client-1",
    status: "OPEN",
    categoryId: "web",
    budgetMin: 100,
    budgetMax: 300,
  });
  await expectAppError(
    updateProject("project-1", "client-1", { budgetMin: 400 }, db),
    400,
    "VALIDATION_ERROR",
  );
  assert.equal(updated, false);
});

test("closeProject changes status to CLOSED and rejects non-owners", async () => {
  let updateArgs;
  const db = {
    project: {
      findUnique: async () => ({
        id: "project-1",
        clientId: "client-1",
        status: "OPEN",
        categoryId: "web",
        budgetMin: null,
        budgetMax: null,
      }),
      update: async (args) => {
        updateArgs = args;
        return args;
      },
    },
  };
  await closeProject("project-1", "client-1", db);
  assert.deepEqual(updateArgs.data, { status: "CLOSED" });

  await expectAppError(closeProject("project-1", "other-client", db), 403, "FORBIDDEN");
});

test("reopenProject changes CLOSED to OPEN only for its owner", async () => {
  let updateArgs;
  const db = {
    project: {
      findUnique: async () => ({
        id: "project-1",
        clientId: "client-1",
        status: "CLOSED",
        categoryId: "web",
        budgetMin: null,
        budgetMax: null,
      }),
      update: async (args) => {
        updateArgs = args;
        return args;
      },
    },
  };
  await reopenProject("project-1", "client-1", db);
  assert.deepEqual(updateArgs.data, { status: "OPEN" });

  db.project.findUnique = async () => ({
    id: "project-1",
    clientId: "other-client",
    status: "CLOSED",
    categoryId: "web",
    budgetMin: null,
    budgetMax: null,
  });
  await expectAppError(reopenProject("project-1", "client-1", db), 403, "FORBIDDEN");

  db.project.findUnique = async () => ({
    id: "project-1",
    clientId: "client-1",
    status: "OPEN",
    categoryId: "web",
    budgetMin: null,
    budgetMax: null,
  });
  await expectAppError(reopenProject("project-1", "client-1", db), 409, "PROJECT_NOT_CLOSED");
});

test("deleteProject permanently deletes only a project owned by the client", async () => {
  let deleted;
  const db = {
    project: {
      findUnique: async () => ({
        id: "project-1",
        clientId: "client-1",
        status: "OPEN",
        categoryId: "web",
        budgetMin: null,
        budgetMax: null,
      }),
      delete: async (args) => {
        deleted = args;
      },
    },
  };
  await deleteProject("project-1", "client-1", db);
  assert.deepEqual(deleted, { where: { id: "project-1" } });

  deleted = undefined;
  await expectAppError(deleteProject("project-1", "other-client", db), 403, "FORBIDDEN");
  assert.equal(deleted, undefined);
});
