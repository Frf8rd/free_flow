import type { Project, ProjectInput } from "@/types";
import { clone, getDb, mockDelay, nextId } from "@/mocks";
import { categories } from "@/mocks";
import { useAuthStore } from "@/store/auth";
import { api } from "./api";
import { USE_MOCKS } from "./config";

export const projectsService = {
  /** GET /projects/me */
  async listMine(): Promise<Project[]> {
    if (USE_MOCKS) {
      await mockDelay();
      const user = useAuthStore.getState().user;
      const all = getDb().projects;
      return clone(user?.role === "ADMIN" ? all : all.filter((p) => p.ownerId === user?.id));
    }
    const { data } = await api.get<Project[]>("/projects/me");
    return data;
  },

  /** POST /projects — the matching run starts asynchronously on the server. */
  async create(input: ProjectInput): Promise<Project> {
    if (USE_MOCKS) {
      await mockDelay(700);
      const db = getDb();
      const user = useAuthStore.getState().user;
      const project: Project = {
        id: nextId("p"),
        title: input.title?.trim() || input.description.trim().split(/[.\n]/)[0]!.slice(0, 60),
        description: input.description,
        categoryId: input.categoryId,
        categoryName: categories.find((c) => c.id === input.categoryId)?.name ?? "Altele",
        budget: input.budget,
        deadline: input.deadline,
        skills: input.skills,
        clientType: "FIRMA",
        ownerId: user?.id ?? "u-client-1",
        ownerName: user?.name ?? "Client",
        status: "OPEN",
        createdAt: new Date().toISOString(),
        matchesCount: 0,
      };
      db.projects.unshift(project);
      db.runs[project.id] = { startedAt: Date.now(), failed: false };
      db.clarifications[project.id] =
        input.description.trim().length < 80
          ? "Poți detalia ce rezultat final aștepți (pagini, funcții, stil)?"
          : null;
      return clone(project);
    }
    const { data } = await api.post<Project>("/projects", input);
    return data;
  },

  /** PATCH /projects/:id */
  async setStatus(id: string, status: Project["status"]): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(300);
      const p = getDb().projects.find((x) => x.id === id);
      if (p) p.status = status;
      return;
    }
    await api.patch(`/projects/${id}`, { status });
  },

  /** DELETE /projects/:id */
  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(300);
      const db = getDb();
      db.projects = db.projects.filter((p) => p.id !== id);
      return;
    }
    await api.delete(`/projects/${id}`);
  },
};
