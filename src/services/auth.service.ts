import type { AuthSession, LoginInput, RegisterInput, Role } from "@/types";
import {
  MOCK_ADMIN_EMAIL,
  MOCK_ADMIN_PASSWORD,
  MOCK_WRONG_PASSWORD,
  mockDelay,
  mockUsers,
} from "@/mocks";
import { api } from "./api";
import { USE_MOCKS } from "./config";

export const authService = {
  demoAdminCredentials:
    USE_MOCKS && import.meta.env.DEV
      ? { email: MOCK_ADMIN_EMAIL, password: MOCK_ADMIN_PASSWORD }
      : null,

  async login(input: LoginInput): Promise<AuthSession> {
    if (USE_MOCKS) {
      await mockDelay(700);
      const role: Role = input.email.startsWith("client")
        ? "CLIENT"
        : input.email.startsWith("admin")
          ? "ADMIN"
          : "FREELANCER";
      if (
        input.password === MOCK_WRONG_PASSWORD ||
        (role === "ADMIN" &&
          (!import.meta.env.DEV ||
            input.email !== MOCK_ADMIN_EMAIL ||
            input.password !== MOCK_ADMIN_PASSWORD))
      ) {
        throw new Error("Email sau parolă greșită.");
      }
      return { user: { ...mockUsers[role], email: input.email }, token: `mock-${role}` };
    }
    const { data } = await api.post<AuthSession>("/auth/login", input);
    return data;
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    if (USE_MOCKS) {
      await mockDelay(800);
      const base = mockUsers[input.role];
      return {
        user: {
          ...base,
          id: `u-${Date.now()}`,
          name: input.name,
          email: input.email,
          profileComplete: false,
        },
        token: `mock-${input.role}`,
      };
    }
    const { data } = await api.post<AuthSession>("/auth/register", input);
    return data;
  },

  async logout(): Promise<void> {
    if (USE_MOCKS) return;
    await api.post("/auth/logout");
  },
};
