import type {
  BrowseFilters,
  FreelancerProfile,
  FreelancerProfileInput,
  FreelancerSummary,
  Match,
  MatchRun,
  Paginated,
  Project,
  ProjectMatch,
  Review,
} from "@/types";
import { MOCK_SELF_FREELANCER_ID, clone, getDb, mockDelay } from "@/mocks";
import { api } from "./api";
import { USE_MOCKS } from "./config";
import { createImageFormData, createImageUrls } from "@/lib/image-uploads";

export type MatchAction = "invite" | "interest" | "dismiss";
const nextStatus = { invite: "INVITED", interest: "INTERESTED", dismiss: "DISMISSED" } as const;

/** Mock-only: score a freelancer against a project from skill overlap + rate. */
function buildMatches(project: Project): Match[] {
  const db = getDb();
  return db.freelancers
    .map((f) => {
      const overlap = project.skills.length
        ? project.skills.filter((s) => f.skills.some((x) => x.toLowerCase() === s.toLowerCase()))
            .length / project.skills.length
        : 0.6;
      const skills = Math.round(45 + overlap * 55);
      const price = Math.max(
        35,
        Math.min(100, Math.round(100 - Math.max(0, f.hourlyRate * 40 - project.budget) / 20)),
      );
      const availability =
        f.availability === "UNAVAILABLE" ? 20 : f.availability === "FULL_TIME" ? 92 : 78;
      const deadline = 70 + ((f.id.charCodeAt(2) * 7) % 26);
      // Fairness: reviews are never part of the score; rising talent gets a small exploration bonus.
      const score = Math.min(
        99,
        Math.round(skills * 0.5 + price * 0.2 + availability * 0.15 + deadline * 0.15) +
          (f.risingTalent ? 3 : 0),
      );
      const reasons = [
        overlap > 0.5 ? "abilități comune cu proiectul" : "abilități apropiate de cerință",
        price >= 70 ? "tarif în limita bugetului" : "tarif peste buget",
        availability >= 78 ? "disponibil în termen" : "disponibilitate limitată",
      ];
      return {
        id: `m-${project.id}-${f.id}`,
        projectId: project.id,
        freelancer: f,
        score,
        breakdown: { skills, price, availability, deadline },
        reasons,
        status: "NEW" as const,
        seen: false,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export const matchesService = {
  /** GET /matches/me — client-side list (first project with matches). */
  async list(): Promise<Match[]> {
    if (USE_MOCKS) {
      await mockDelay();
      return clone(getDb().matches["p-1"] ?? []);
    }
    const { data } = await api.get<Match[]>("/matches/me");
    return data;
  },

  /** GET /matches/me (freelancer) — recommended projects. */
  async listForFreelancer(): Promise<ProjectMatch[]> {
    if (USE_MOCKS) {
      await mockDelay();
      return clone(getDb().projectMatches);
    }
    const { data } = await api.get<ProjectMatch[]>("/matches/me");
    return data;
  },

  /** GET /projects/:id/matches — polled while status is PENDING / RUNNING. */
  async getRun(projectId: string): Promise<MatchRun> {
    if (USE_MOCKS) {
      await mockDelay(250);
      const db = getDb();
      const project = db.projects.find((p) => p.id === projectId);
      if (!project) throw new Error("Proiectul nu există.");
      const run = db.runs[projectId] ?? { startedAt: 0, failed: false };
      const elapsed = Date.now() - run.startedAt;
      const status = run.failed
        ? "FAILED"
        : elapsed < 1500
          ? "PENDING"
          : elapsed < 3500
            ? "RUNNING"
            : "DONE";
      if (status === "DONE" && !db.matches[projectId])
        db.matches[projectId] = buildMatches(project);
      const matches = status === "DONE" ? (db.matches[projectId] ?? []) : [];
      return clone({
        status,
        project,
        matches,
        clarification: db.clarifications[projectId]
          ? { question: db.clarifications[projectId]! }
          : null,
      });
    }
    const { data } = await api.get<MatchRun>(`/projects/${projectId}/matches`);
    return data;
  },

  /** POST /matches/:id/(invite|interest|dismiss) */
  async act(id: string, action: MatchAction): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(300);
      const db = getDb();
      const all = [...Object.values(db.matches).flat(), ...db.projectMatches];
      const m = all.find((x) => x.id === id);
      if (m) m.status = nextStatus[action];
      return;
    }
    await api.post(`/matches/${id}/${action}`);
  },

  /** POST /matches/impressions — fire-and-forget, cards ≥ 50% visible. */
  async reportImpressions(ids: string[]): Promise<void> {
    if (USE_MOCKS) {
      getDb().impressions.push(...ids);
      return;
    }
    await api.post("/matches/impressions", { ids });
  },

  /** POST /matches/refresh */
  async refresh(projectId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(200);
      const db = getDb();
      delete db.matches[projectId];
      db.runs[projectId] = { startedAt: Date.now(), failed: false };
      return;
    }
    await api.post("/matches/refresh", { projectId });
  },

  /** GET /freelancers */
  async listFreelancers(): Promise<FreelancerSummary[]> {
    if (USE_MOCKS) {
      await mockDelay();
      return clone(getDb().freelancers);
    }
    const { data } = await api.get<FreelancerSummary[]>("/freelancers");
    return data;
  },

  /** GET /freelancers with filters + pagination (manual search). */
  async browse(filters: BrowseFilters): Promise<Paginated<FreelancerSummary>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 6;
    if (USE_MOCKS) {
      await mockDelay(300);
      const q = filters.q?.trim().toLowerCase();
      const list = getDb().freelancers.filter(
        (f) =>
          (!q || `${f.name} ${f.headline} ${f.skills.join(" ")}`.toLowerCase().includes(q)) &&
          (!filters.categoryId || f.categoryId === filters.categoryId) &&
          (!filters.availability || f.availability === filters.availability) &&
          (filters.maxRate === undefined || f.hourlyRate <= filters.maxRate) &&
          (filters.minRate === undefined || f.hourlyRate >= filters.minRate) &&
          (!filters.skills?.length || filters.skills.some((s) => f.skills.includes(s))),
      );
      return clone({
        items: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize,
      });
    }
    const { data } = await api.get<Paginated<FreelancerSummary>>("/freelancers", {
      params: filters,
    });
    return data;
  },

  /** GET /freelancers/:id */
  async getFreelancer(id: string): Promise<FreelancerProfile | null> {
    if (USE_MOCKS) {
      await mockDelay();
      const f = getDb().freelancers.find((x) => x.id === id);
      return f ? clone(f) : null;
    }
    const { data } = await api.get<FreelancerProfile>(`/freelancers/${id}`);
    return data;
  },

  /** GET /freelancers/me */
  async getMyProfile(): Promise<FreelancerProfile> {
    if (USE_MOCKS) {
      await mockDelay();
      const profile = getDb().freelancers.find(
        (freelancer) => freelancer.id === MOCK_SELF_FREELANCER_ID,
      );
      if (!profile) throw new Error("Profilul freelancerului nu a fost găsit.");
      return clone(profile);
    }
    const { data } = await api.get<FreelancerProfile>("/freelancers/me");
    return data;
  },

  /** PATCH /freelancers/me */
  async updateMyProfile(input: FreelancerProfileInput): Promise<FreelancerProfile> {
    const { avatar, ...fields } = input;
    if (!USE_MOCKS) {
      if (avatar) {
        const formData = createImageFormData(fields, [avatar], "avatar");
        const { data } = await api.patch<FreelancerProfile>("/freelancers/me", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
      }
      const { data } = await api.patch<FreelancerProfile>("/freelancers/me", fields);
      return data;
    }
    await mockDelay(350);
    const profile = getDb().freelancers.find(
      (freelancer) => freelancer.id === MOCK_SELF_FREELANCER_ID,
    );
    if (!profile) throw new Error("Profilul freelancerului nu a fost găsit.");
    const { removeAvatar, ...profileFields } = fields;
    Object.assign(profile, profileFields);
    if (avatar) profile.avatarUrl = createImageUrls([avatar])[0];
    else if (removeAvatar) delete profile.avatarUrl;
    return clone(profile);
  },

  /** GET /freelancers/:id/reviews */
  async getReviews(id: string): Promise<Review[]> {
    if (USE_MOCKS) {
      await mockDelay(250);
      return clone(getDb().reviews[id] ?? []);
    }
    const { data } = await api.get<Review[]>(`/freelancers/${id}/reviews`);
    return data;
  },
};
