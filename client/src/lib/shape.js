// Răspunsurile de listă pot veni ca [...] sau ca { data: [...], page, limit, total } (README 5.2). Le uniformizăm.
export const asList = (d) => (Array.isArray(d) ? d : d?.data ?? []);
const matchSkills = (rows) => (rows ?? []).map((row) => row.skill ?? row).filter((skill) => skill?.name);
export const asProject = (project) => ({
  ...project,
  skills: matchSkills(project.skills),
  matchesCount: project.matchesCount ?? project._count?.matches,
});
export function asMatch(match) {
  const { freelancer, project } = match;
  return {
    ...match,
    conversationId: match.conversationId ?? match.conversation?.id,
    freelancer: freelancer && {
      ...freelancer,
      id: freelancer.user?.id ?? freelancer.userId ?? freelancer.id,
      name: freelancer.user?.name ?? freelancer.name,
      avatarUrl: freelancer.user?.avatarUrl ?? freelancer.avatarUrl,
      skills: matchSkills(freelancer.skills),
    },
    project: project && asProject(project),
  };
}
export const asPage = (d) => (Array.isArray(d) ? { data: d, page: 1, limit: d.length, total: d.length } : { data: d?.data ?? [], page: d?.page ?? 1, limit: d?.limit ?? 20, total: d?.total ?? d?.data?.length ?? 0 });
// Elimină câmpurile goale din parametri, ca să nu trimitem ?q=&minRate=
export const clean = (o = {}) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length)).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]));
