import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { config } from '../config.js';
import { useAuth } from '../store/authStore.js';
import * as catalog from '../services/catalog.js';
import * as freelancers from '../services/freelancers.js';
import * as clients from '../services/clients.js';
import * as projects from '../services/projects.js';
import * as matches from '../services/matches.js';
import * as engagements from '../services/engagements.js';
import * as conversations from '../services/conversations.js';
import * as notifications from '../services/notifications.js';
import * as reports from '../services/reports.js';
import * as admin from '../services/admin.js';
import * as auth from '../services/auth.js';
import * as users from '../services/users.js';

const day = 24 * 60 * 60 * 1000;
const optional = { retry: false, staleTime: 5 * 60_000 }; // endpoint-uri „planificate": lipsa lor nu e eroare pentru utilizator

/* ---------- catalog ---------- */
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: catalog.categories, staleTime: day });
export const useSkills = (params = {}, enabled = true) => useQuery({ queryKey: ['skills', params], queryFn: () => catalog.skills(params), staleTime: day, enabled, placeholderData: keepPreviousData });

/* ---------- profile ---------- */
export const useMyFreelancer = (enabled = true) => useQuery({ queryKey: ['freelancer-me'], queryFn: freelancers.mine, enabled, retry: (c, e) => e?.status !== 404 && c < 1 });
export const useMyClient = (enabled = true) => useQuery({ queryKey: ['client-me'], queryFn: clients.mine, enabled, retry: (c, e) => e?.status !== 404 && c < 1 });
export const useFreelancer = (id) => useQuery({ queryKey: ['freelancer', id], queryFn: () => freelancers.byId(id), enabled: !!id });
export const useFreelancerReviews = (id, page = 1) => useQuery({ queryKey: ['freelancer-reviews', id, page], queryFn: () => freelancers.reviews(id, { page, limit: 10 }), enabled: !!id, placeholderData: keepPreviousData });
export const useTier = (enabled = true) => useQuery({ queryKey: ['tier'], queryFn: freelancers.tier, enabled, ...optional });
export const useExposure = (enabled = true) => useQuery({ queryKey: ['exposure'], queryFn: freelancers.exposure, enabled, ...optional });

function useInvalidating(fn, keys, onSuccess) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => { keys.forEach((k) => qc.invalidateQueries({ queryKey: k })); onSuccess?.(data, vars, qc); },
  });
}
export const useSaveFreelancer = () => useInvalidating(freelancers.saveMine, [['freelancer-me'], ['freelancers'], ['matches-me'], ['tier']], () => useAuth.getState().reload());
export const useSaveClient = () => useInvalidating(clients.saveMine, [['client-me']], () => useAuth.getState().reload());
export const useAddPortfolio = () => useInvalidating(freelancers.addPortfolio, [['freelancer-me']]);
export const useUpdatePortfolio = () => useInvalidating(({ id, ...body }) => freelancers.updatePortfolio(id, body), [['freelancer-me']]);
export const useRemovePortfolio = () => useInvalidating(freelancers.removePortfolio, [['freelancer-me']]);

/* ---------- explorare ---------- */
export const useFreelancerSearch = ({ _on = true, ...params }) => useQuery({ queryKey: ['freelancers', params], queryFn: () => freelancers.list(params), enabled: _on, placeholderData: keepPreviousData });
export const useProjectSearch = ({ _on = true, ...params }) => useQuery({ queryKey: ['projects', params], queryFn: () => projects.list(params), enabled: _on, placeholderData: keepPreviousData });

/* ---------- proiecte ---------- */
export const useMyProjects = (enabled = true) => useQuery({ queryKey: ['projects-me'], queryFn: projects.mine, enabled });
export const useProject = (id) => useQuery({ queryKey: ['project', id], queryFn: () => projects.byId(id), enabled: !!id });
export const useCreateProject = () => useInvalidating(projects.create, [['projects-me'], ['projects']]);
export const useUpdateProject = () => useInvalidating(({ id, ...body }) => projects.update(id, body), [['projects-me'], ['projects'], ['project'], ['project-matches']]);
export const useDeleteProject = () => useInvalidating(projects.remove, [['projects-me'], ['projects']]);

// Potrivirile unui proiect: se reinterogă la câteva secunde cât timp calculul nu s-a terminat (README 4.3)
export const useProjectMatches = (id, enabled = true) => useQuery({
  queryKey: ['project-matches', id],
  queryFn: () => projects.matches(id),
  enabled: !!id && enabled,
  refetchInterval: (q) => (['PENDING', 'RUNNING'].includes(q.state.data?.status) ? config.pollMatchingMs : false),
});

/* ---------- potriviri ---------- */
export const useMyMatches = (params, enabled = true) => useQuery({ queryKey: ['matches-me', params], queryFn: () => matches.mine(params), enabled, placeholderData: keepPreviousData });
const matchKeys = [['matches-me'], ['project-matches'], ['counts'], ['conversations'], ['notifications']];
export const useInterest = () => useInvalidating(matches.interest, matchKeys);
export const useInvite = () => useInvalidating(matches.invite, matchKeys);
export const useInviteManual = () => useInvalidating(matches.inviteManual, matchKeys);
export const useDismiss = () => useInvalidating(({ id, reason }) => matches.dismiss(id, reason), matchKeys);
export const useRefreshMatches = () => useInvalidating(matches.refresh, [['project-matches'], ['matches-me'], ['projects-me']]);

/* ---------- colaborări ---------- */
export const useEngagements = (enabled = true) => useQuery({ queryKey: ['engagements'], queryFn: () => engagements.mine(), enabled });
export const useEngagement = (id) => useQuery({ queryKey: ['engagement', id], queryFn: () => engagements.byId(id), enabled: !!id });
const engKeys = [['engagements'], ['engagement'], ['conversations'], ['tier'], ['projects-me'], ['notifications']];
export const useCreateEngagement = () => useInvalidating(engagements.create, engKeys);
export const useEngagementStatus = () => useInvalidating(({ id, status }) => engagements.setStatus(id, status), engKeys);
export const useAiDisclosure = () => useInvalidating(({ id, usedAi }) => engagements.setAiDisclosure(id, usedAi), [['engagement']]);
export const useReview = () => useInvalidating(({ id, ...body }) => engagements.review(id, body), [['engagement'], ['freelancer'], ['freelancer-reviews']]);

/* ---------- chat ---------- */
export const useConversations = (enabled = true) => useQuery({
  queryKey: ['conversations'],
  queryFn: conversations.list,
  enabled,
  refetchInterval: (query) => enabled && document.visibilityState === 'visible' ? Math.max(config.pollChatMs * 6, 30_000) : false,
});
export const useMessages = (id) => useQuery({ queryKey: ['messages', id], queryFn: () => conversations.messages(id, { limit: 100 }), enabled: !!id, refetchInterval: config.pollChatMs });
export const useSendMessage = (id) => {
  const qc = useQueryClient();
  const me = useAuth((s) => s.user);
  return useMutation({
    mutationFn: (content) => conversations.send(id, content),
    // mesajul apare imediat (optimist); la eroare revine și utilizatorul poate reîncerca
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: ['messages', id] });
      const prev = qc.getQueryData(['messages', id]);
      qc.setQueryData(['messages', id], [...(prev || []), { id: `tmp-${Date.now()}`, conversationId: id, senderId: me.id, content, createdAt: new Date().toISOString(), pending: true }]);
      return { prev };
    },
    onError: (_e, _c, ctx) => qc.setQueryData(['messages', id], ctx?.prev),
    onSettled: () => { qc.invalidateQueries({ queryKey: ['messages', id] }); qc.invalidateQueries({ queryKey: ['conversations'] }); },
  });
};
export const useMarkRead = () => useInvalidating(conversations.markRead, [['conversations'], ['counts']]);

/* ---------- notificări + contoare pentru navigație ---------- */
export const useNotifications = (params) => useQuery({ queryKey: ['notifications', params], queryFn: () => notifications.list(params), placeholderData: keepPreviousData, refetchInterval: config.pollCountsMs });
export const useReadNotification = () => useInvalidating(notifications.read, [['notifications'], ['counts']]);
export const useReadAllNotifications = () => useInvalidating(notifications.readAll, [['notifications'], ['counts']]);

// Numerele din bară (notificări, mesaje, potriviri noi): o interogare ușoară, reînnoită periodic
export function useCounts() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const enabled = !!user && user.role !== 'ADMIN' && user.onboarded !== false;
  return useQuery({
    queryKey: ['counts', user?.id],
    enabled,
    refetchInterval: config.pollCountsMs,
    staleTime: 15_000,
    queryFn: async () => {
      const [n, m] = await Promise.all([
        notifications.list({ unread: true, limit: 1 }).catch(() => null),
        user.role === 'ADMIN' ? null : matches.mine({ status: 'new', limit: 1 }).catch(() => null),
      ]);
      // ChatProvider already refreshes this shared query. Read its cache instead
      // of issuing a second conversations request on every count refresh.
      const c = qc.getQueryData(['conversations']) || [];
      return { notifications: n?.total ?? 0, messages: c.reduce((s, x) => s + (x.unreadCount || 0), 0), matches: m?.total ?? 0 };
    },
    placeholderData: { notifications: 0, messages: 0, matches: 0 },
  });
}

/* ---------- raportări ---------- */
export const useReport = () => useMutation({ mutationFn: reports.create });

/* ---------- cont ---------- */
export const useUpdateAccount = () => useMutation({ mutationFn: auth.updateAccount, onSuccess: () => useAuth.getState().reload() });
export const useChangePassword = () => useMutation({ mutationFn: auth.changePassword });
export const useDeleteAccount = () => {
  const mutation = useMutation({ mutationFn: users.deleteMe });
  return { ...mutation, deleteAccount: async (proof) => {
    await mutation.mutateAsync(proof);
    const userId = useAuth.getState().user?.id;
    try { if (userId) localStorage.removeItem(`fm-user-details:${userId}`); } catch { /* ignoră */ }
    useAuth.getState().clear();
  } };
};

/* ---------- admin ---------- */
export const useAdminStats = () => useQuery({ queryKey: ['admin-stats'], queryFn: admin.stats });
export const useAdminUsers = (p) => useQuery({ queryKey: ['admin-users', p], queryFn: () => admin.users(p), placeholderData: keepPreviousData });
export const useAdminProjects = (p) => useQuery({ queryKey: ['admin-projects', p], queryFn: () => admin.projects(p), placeholderData: keepPreviousData });
export const useAdminReports = (p) => useQuery({ queryKey: ['admin-reports', p], queryFn: () => admin.reports(p), placeholderData: keepPreviousData });
export const useAdminUpdateUser = () => useInvalidating(({ id, ...b }) => admin.updateUser(id, b), [['admin-users'], ['admin-stats']]);
export const useAdminUpdateProject = () => useInvalidating(({ id, ...b }) => admin.updateProject(id, b), [['admin-projects'], ['admin-stats'], ['projects'], ['project']]);
export const useAdminRemoveProject = () => useInvalidating(admin.removeProject, [['admin-projects'], ['admin-stats']]);
export const useAdminResolveReport = () => useInvalidating(({ id, ...b }) => admin.resolveReport(id, b), [['admin-reports'], ['admin-stats']]);
