import { queryOptions, useQuery } from "@tanstack/react-query";
import type { BrowseFilters } from "@/types";
import {
  adminService,
  engagementsService,
  matchesService,
  messagesService,
  metaService,
  notificationsService,
  portfolioService,
  projectsService,
} from "@/services";

export const sidebarCountsQuery = () =>
  queryOptions({
    queryKey: ["me", "counts"],
    queryFn: () => metaService.getSidebarCounts(),
    staleTime: 30_000,
  });
export const notificationsQuery = () =>
  queryOptions({ queryKey: ["me", "notifications"], queryFn: () => notificationsService.list() });
export const skillsQuery = () =>
  queryOptions({
    queryKey: ["skills"],
    queryFn: () => metaService.getSkills(),
    staleTime: Infinity,
  });
export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => metaService.getCategories(),
    staleTime: Infinity,
  });
export const domainsQuery = () =>
  queryOptions({
    queryKey: ["domains"],
    queryFn: () => metaService.getClientDomains(),
    staleTime: Infinity,
  });

export const freelancersQuery = () =>
  queryOptions({ queryKey: ["freelancers"], queryFn: () => matchesService.listFreelancers() });
export const browseQuery = (f: BrowseFilters) =>
  queryOptions({ queryKey: ["freelancers", "browse", f], queryFn: () => matchesService.browse(f) });
export const freelancerQuery = (id: string) =>
  queryOptions({ queryKey: ["freelancers", id], queryFn: () => matchesService.getFreelancer(id) });
export const myFreelancerProfileQuery = () =>
  queryOptions({ queryKey: ["freelancers", "me"], queryFn: () => matchesService.getMyProfile() });
export const reviewsQuery = (id: string) =>
  queryOptions({
    queryKey: ["freelancers", id, "reviews"],
    queryFn: () => matchesService.getReviews(id),
  });

export const matchesQuery = () =>
  queryOptions({ queryKey: ["matches"], queryFn: () => matchesService.list() });
export const projectMatchesQuery = () =>
  queryOptions({
    queryKey: ["matches", "projects"],
    queryFn: () => matchesService.listForFreelancer(),
  });
/** Polls every 1.5 s while the run is PENDING / RUNNING. */
export const matchRunQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["matches", "run", projectId],
    queryFn: () => matchesService.getRun(projectId),
    refetchInterval: (q) =>
      q.state.data && (q.state.data.status === "PENDING" || q.state.data.status === "RUNNING")
        ? 1500
        : false,
  });

export const myProjectsQuery = () =>
  queryOptions({ queryKey: ["projects", "mine"], queryFn: () => projectsService.listMine() });
export const engagementsQuery = () =>
  queryOptions({ queryKey: ["engagements"], queryFn: () => engagementsService.list() });
export const conversationsQuery = () =>
  queryOptions({
    queryKey: ["conversations"],
    queryFn: () => messagesService.list(),
    refetchInterval: 10_000,
  });
export const messagesQuery = (id: string) =>
  queryOptions({
    queryKey: ["conversations", id, "messages"],
    queryFn: () => messagesService.messages(id),
    refetchInterval: 5_000,
  });
export const portfolioQuery = () =>
  queryOptions({ queryKey: ["portfolio"], queryFn: () => portfolioService.list() });

export const adminUsersQuery = () =>
  queryOptions({ queryKey: ["admin", "users"], queryFn: () => adminService.users() });
export const adminProjectsQuery = () =>
  queryOptions({ queryKey: ["admin", "projects"], queryFn: () => adminService.projects() });
export const adminReportsQuery = () =>
  queryOptions({ queryKey: ["admin", "reports"], queryFn: () => adminService.reports() });

/** Client-side only (needs the session) — used inside the logged-in shell. */
export const useSidebarCounts = (enabled = true) => useQuery({ ...sidebarCountsQuery(), enabled });
