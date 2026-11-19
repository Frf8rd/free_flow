import type {
  AdminProject,
  AdminReport,
  AdminUser,
  AppNotification,
  Conversation,
  Engagement,
  EngagementStatus,
  Message,
  PortfolioInput,
  PortfolioItem,
  ReviewInput,
} from "@/types";
import { MOCK_SELF_FREELANCER_ID, clone, getDb, mockDelay, nextId } from "@/mocks";
import { api } from "./api";
import { USE_MOCKS } from "./config";

const mock = async <T>(fn: () => T, ms = 300): Promise<T> => {
  await mockDelay(ms);
  return clone(fn());
};

export const engagementsService = {
  /** GET /engagements/me */
  list: (): Promise<Engagement[]> =>
    USE_MOCKS
      ? mock(() => getDb().engagements)
      : api.get<Engagement[]>("/engagements/me").then((r) => r.data),

  /** PATCH /engagements/:id/status */
  async setStatus(id: string, status: EngagementStatus, aiUsed?: boolean): Promise<void> {
    if (!USE_MOCKS) return void (await api.patch(`/engagements/${id}/status`, { status, aiUsed }));
    await mockDelay();
    const e = getDb().engagements.find((x) => x.id === id);
    if (!e) return;
    e.status = status;
    const now = new Date().toISOString();
    if (status === "DELIVERED") e.deliveredAt = now;
    if (status === "COMPLETED") e.completedAt = now;
    if (aiUsed !== undefined) e.aiUsed = aiUsed;
  },

  /** POST /engagements/:id/reviews */
  async review(id: string, input: ReviewInput): Promise<void> {
    if (!USE_MOCKS) return void (await api.post(`/engagements/${id}/reviews`, input));
    await mockDelay();
    const e = getDb().engagements.find((x) => x.id === id);
    if (e)
      e.review = {
        id: nextId("r"),
        authorName: e.client.name,
        rating: input.rating,
        comment: input.comment,
        projectTitle: e.projectTitle,
        createdAt: new Date().toISOString(),
      };
  },
};

export const messagesService = {
  /** GET /conversations */
  list: (): Promise<Conversation[]> =>
    USE_MOCKS
      ? mock(() => getDb().conversations, 250)
      : api.get<Conversation[]>("/conversations").then((r) => r.data),

  /** GET /conversations/:id/messages (polled every 5 s) */
  messages: (id: string): Promise<Message[]> =>
    USE_MOCKS
      ? mock(() => getDb().messages[id] ?? [], 150)
      : api.get<Message[]>(`/conversations/${id}/messages`).then((r) => r.data),

  /** POST /conversations/:id/messages */
  async send(id: string, body: string): Promise<void> {
    if (!USE_MOCKS) return void (await api.post(`/conversations/${id}/messages`, { body }));
    await mockDelay(150);
    const db = getDb();
    (db.messages[id] ??= []).push({
      id: nextId("msg"),
      conversationId: id,
      authorId: "me",
      body,
      createdAt: new Date().toISOString(),
    });
    const c = db.conversations.find((x) => x.id === id);
    if (c) Object.assign(c, { lastMessage: body, lastMessageAt: new Date().toISOString() });
  },

  /** PATCH /conversations/:id/read */
  async markRead(id: string): Promise<void> {
    if (!USE_MOCKS) return void (await api.patch(`/conversations/${id}/read`));
    const c = getDb().conversations.find((x) => x.id === id);
    if (c) c.unread = 0;
  },
};

export const notificationsService = {
  list: (): Promise<AppNotification[]> =>
    USE_MOCKS
      ? mock(() => getDb().notifications)
      : api.get<AppNotification[]>("/notifications").then((r) => r.data),

  /** PATCH /notifications/read-all */
  async readAll(): Promise<void> {
    if (!USE_MOCKS) return void (await api.patch("/notifications/read-all"));
    getDb().notifications.forEach((n) => (n.read = true));
  },
};

export const portfolioService = {
  /** POST|PATCH|DELETE /freelancers/me/portfolio */
  async list(): Promise<PortfolioItem[]> {
    if (!USE_MOCKS) return (await api.get("/freelancers/me")).data.portfolio;
    return mock(
      () => getDb().freelancers.find((f) => f.id === MOCK_SELF_FREELANCER_ID)?.portfolio ?? [],
    );
  },
  async save(input: PortfolioInput, id?: string): Promise<void> {
    if (!USE_MOCKS)
      return void (id
        ? await api.patch(`/freelancers/me/portfolio/${id}`, input)
        : await api.post("/freelancers/me/portfolio", input));
    await mockDelay();
    const f = getDb().freelancers.find((x) => x.id === MOCK_SELF_FREELANCER_ID);
    if (!f) return;
    if (id) f.portfolio = f.portfolio.map((p) => (p.id === id ? { ...p, ...input } : p));
    else f.portfolio.unshift({ id: nextId("pf"), ...input });
  },
  async remove(id: string): Promise<void> {
    if (!USE_MOCKS) return void (await api.delete(`/freelancers/me/portfolio/${id}`));
    await mockDelay(200);
    const f = getDb().freelancers.find((x) => x.id === MOCK_SELF_FREELANCER_ID);
    if (f) f.portfolio = f.portfolio.filter((p) => p.id !== id);
  },
};

export const adminService = {
  users: (): Promise<AdminUser[]> =>
    USE_MOCKS
      ? mock(() => getDb().adminUsers)
      : api.get<AdminUser[]>("/admin/users").then((r) => r.data),
  projects: (): Promise<AdminProject[]> =>
    USE_MOCKS
      ? mock(() =>
          getDb().projects.map((p) => ({
            id: p.id,
            title: p.title,
            ownerName: p.ownerName,
            status: p.status,
            createdAt: p.createdAt,
          })),
        )
      : api.get<AdminProject[]>("/admin/projects").then((r) => r.data),
  reports: (): Promise<AdminReport[]> =>
    USE_MOCKS
      ? mock(() => getDb().reports)
      : api.get<AdminReport[]>("/admin/reports").then((r) => r.data),

  /** PATCH /admin/users/:id */
  async toggleBlock(id: string): Promise<void> {
    if (!USE_MOCKS) return void (await api.patch(`/admin/users/${id}`, { toggleBlock: true }));
    await mockDelay(200);
    const u = getDb().adminUsers.find((x) => x.id === id);
    if (u) u.status = u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
  },
  /** DELETE /admin/projects/:id */
  async removeProject(id: string): Promise<void> {
    if (!USE_MOCKS) return void (await api.delete(`/admin/projects/${id}`));
    await mockDelay(200);
    const db = getDb();
    db.projects = db.projects.filter((p) => p.id !== id);
  },
  async resolveReport(id: string): Promise<void> {
    if (!USE_MOCKS) return void (await api.patch(`/admin/reports/${id}`, { status: "RESOLVED" }));
    await mockDelay(200);
    const r = getDb().reports.find((x) => x.id === id);
    if (r) r.status = "RESOLVED";
  },
};
