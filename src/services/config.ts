/**
 * Flip to false once the Express + Prisma API is reachable.
 * Components never import mocks directly, so nothing else needs to change.
 */
export const USE_MOCKS = true;

export const API_URL: string = import.meta.env["VITE_API_URL"] || "/api";
