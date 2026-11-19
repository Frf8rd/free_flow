import type { Locale } from "@/i18n";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export const roleLabel = { CLIENT: "Client", FREELANCER: "Freelancer", ADMIN: "Admin" } as const;

export const formatRate = (eur: number) => `${eur} €/h`;

/** "acum 25 de minute", "ieri"… */
export function timeAgo(iso: string, locale: Locale = "ro") {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, s] of steps)
    if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), unit);
  return "acum";
}
export const formatDate = (iso: string, locale: Locale = "ro") =>
  new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : locale === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
export const formatBudget = (eur: number, locale: Locale = "ro") =>
  `${eur.toLocaleString(locale === "ro" ? "ro-RO" : locale === "ru" ? "ru-RU" : "en-GB")} €`;
export const availabilityLabel = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  WEEKENDS: "Weekenduri",
  UNAVAILABLE: "Indisponibil",
} as const;
export const statusLabel = {
  OPEN: "Deschis",
  IN_PROGRESS: "În lucru",
  COMPLETED: "Finalizat",
  CANCELLED: "Anulat",
  DELIVERED: "Livrat",
} as const;
