import type { AppNotification, Category, SidebarCounts } from "@/types";
import { categories, clientDomains, clone, getDb, mockDelay, skillOptions } from "@/mocks";
import { api } from "./api";
import { USE_MOCKS } from "./config";

export const metaService = {
  async getSidebarCounts(): Promise<SidebarCounts> {
    if (USE_MOCKS) {
      await mockDelay(250);
      const db = getDb();
      return {
        unseenMatches: Object.values(db.matches).flat().filter((m) => !m.seen).length,
        unreadMessages: db.conversations.reduce((sum, c) => sum + c.unread, 0),
        unreadNotifications: db.notifications.filter((n) => !n.read).length,
        activeEngagements: db.engagements.filter((e) => e.status !== "COMPLETED").length,
      };
    }
    const { data } = await api.get<SidebarCounts>("/me/counts");
    return data;
  },

  /** GET /notifications */
  async getNotifications(): Promise<AppNotification[]> {
    if (USE_MOCKS) {
      await mockDelay(300);
      return clone(getDb().notifications);
    }
    const { data } = await api.get<AppNotification[]>("/notifications");
    return data;
  },

  /** GET /skills */
  async getSkills(): Promise<string[]> {
    if (USE_MOCKS) {
      await mockDelay(200);
      return skillOptions;
    }
    const { data } = await api.get<string[]>("/skills");
    return data;
  },

  /** GET /categories */
  async getCategories(): Promise<Category[]> {
    if (USE_MOCKS) return categories;
    const { data } = await api.get<Category[]>("/categories");
    return data;
  },

  async getClientDomains(): Promise<string[]> {
    if (USE_MOCKS) return clientDomains;
    const { data } = await api.get<string[]>("/domains");
    return data;
  },
};
