import type { Tier, TierId } from "@/types";

export const tiers: Tier[] = [
  { id: "START", name: "Start", description: "Proiecte mici, ca să-ți construiești istoricul pe platformă." },
  { id: "VERIFICAT", name: "Verificat", description: "Identitate confirmată și primele proiecte livrate." },
  { id: "INCERCAT", name: "Încercat", description: "Colaborări repetate încheiate cu bine, proiecte mai mari." },
  { id: "EXPERT", name: "Expert", description: "Istoric solid, fără limită de mărime a proiectului." },
];

export const tierName = (id: TierId) => tiers.find((t) => t.id === id)?.name ?? id;
