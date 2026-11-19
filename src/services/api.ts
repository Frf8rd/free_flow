import axios from "axios";

import { API_URL } from "./config";
import { useAuthStore } from "@/store/auth";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalises API errors into a readable Romanian message. */
export function getErrorMessage(error: unknown, fallback = "A apărut o eroare. Încearcă din nou.") {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string } | undefined)?.message;
    return msg ?? fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
