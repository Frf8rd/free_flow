import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { AuthSession, Role, User } from "@/types";
import { mockUsers } from "@/mocks/users";

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (session: AuthSession) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  /** Dev-only: preview another role with a mock user. */
  switchRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: ({ user, token }) => set({ user, token }),
      updateUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
      switchRole: (role) => set({ user: mockUsers[role], token: `mock-${role}` }),
    }),
    {
      name: "fairmatch-auth",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
