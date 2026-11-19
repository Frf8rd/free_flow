import type { Role, User } from "@/types";

export const MOCK_ADMIN_EMAIL = "admin@exemplu.ro";
export const MOCK_ADMIN_PASSWORD = "fairmatch-demo";

export const mockUsers: Record<Role, User> = {
  CLIENT: {
    id: "u-client-1",
    name: "Nume Prenume",
    email: "client@exemplu.ro",
    role: "CLIENT",
    profileComplete: true,
  },
  FREELANCER: {
    id: "u-freelancer-1",
    name: "Nume Prenume",
    email: "freelancer@exemplu.ro",
    role: "FREELANCER",
    profileComplete: true,
    tierProgress: {
      tier: "START",
      nextTier: "VERIFICAT",
      projectsToNext: 3,
      completedTowardsNext: 1,
      requiredForNext: 4,
      percent: 25,
    },
  },
  ADMIN: {
    id: "u-admin-1",
    name: "Nume Prenume",
    email: MOCK_ADMIN_EMAIL,
    role: "ADMIN",
    profileComplete: true,
  },
};

/** Password that makes the mock login fail, so the error state can be previewed. */
export const MOCK_WRONG_PASSWORD = "gresit123";

/** The mock freelancer user owns this public profile. */
export const MOCK_SELF_FREELANCER_ID = "f-1";
