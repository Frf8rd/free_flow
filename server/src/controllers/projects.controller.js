const projectsService = require("../services/projects.service");

async function create(req, res) {
  const project = await projectsService.createProject(req.user.id, req.body);
  res.status(201).json({ data: project });
}

async function list(req, res) {
  res.json(await projectsService.listProjects(req.query));
}

async function listMine(req, res) {
  res.json(await projectsService.listProjects(req.query, { clientId: req.user.id }));
}

async function getById(req, res) {
  res.json({ data: await projectsService.getProject(req.params.id) });
}

module.exports = { create, list, listMine, getById };
