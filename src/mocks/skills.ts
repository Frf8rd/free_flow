import type { Category } from "@/types";

export const skillOptions = [
  "React", "TypeScript", "Node.js", "WordPress", "Shopify", "UI/UX", "Figma", "Branding",
  "Ilustrație", "Copywriting", "SEO", "Marketing digital", "Fotografie", "Editare video",
  "Animație", "Python", "Analiză de date", "Aplicații mobile", "Flutter", "Laravel",
  "Traduceri", "Contabilitate", "Social media", "Webflow",
];

export const categories: Category[] = [
  { id: "web", name: "Dezvoltare web" },
  { id: "design", name: "Design și branding" },
  { id: "mobile", name: "Aplicații mobile" },
  { id: "marketing", name: "Marketing și conținut" },
  { id: "video", name: "Foto și video" },
  { id: "data", name: "Date și automatizări" },
];

export const clientDomains = [
  "Comerț", "Servicii locale", "Educație", "Sănătate", "Tehnologie", "HoReCa",
  "Construcții", "Cultură și evenimente", "ONG", "Altul",
];
