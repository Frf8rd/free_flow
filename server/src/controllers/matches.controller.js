const service = require('../services/matches.service');

async function mine(req, res) { res.json(await service.listMine(req.user, req.query)); }
async function project(req, res) { res.json({ data: await service.listForProject(req.user, req.params.id) }); }
async function interest(req, res) { res.json({ data: await service.interest(req.user, req.params.id) }); }
async function invite(req, res) {
  const data = req.params.id
    ? await service.invite(req.user, req.params.id)
    : await service.inviteFreelancer(req.user, req.body?.projectId, req.body?.freelancerId);
  res.status(201).json({ data });
}
async function dismiss(req, res) { res.json({ data: await service.dismiss(req.user, req.params.id, req.body?.reason) }); }
async function impressions(req, res) { res.json({ data: await service.recordImpressions(req.user, req.body?.matchIds) }); }
async function refresh(req, res) { res.status(202).json({ data: await service.refresh(req.user, req.body?.projectId) }); }

module.exports = { mine, project, interest, invite, dismiss, impressions, refresh };
