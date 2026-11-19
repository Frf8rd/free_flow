import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { AuthSession, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (session: AuthSession) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: ({ user, token }) => set({ user, token }),
      updateUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "fairmatch-auth",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
