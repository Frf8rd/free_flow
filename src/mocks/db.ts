/**
 * In-memory mock database. Built lazily on first use (dates are relative to "now"),
 * and mutated by the mock services so create/edit/delete flows feel real during a session.
 */
import type {
  AdminReport,
  AdminUser,
  AppNotification,
  Conversation,
  Engagement,
  FreelancerProfile,
  Match,
  Message,
  Project,
  ProjectMatch,
  Review,
} from "@/types";

const DAY = 86_400_000;
const HOUR = 3_600_000;

export interface MockDb {
  freelancers: FreelancerProfile[];
  reviews: Record<string, Review[]>;
  projects: Project[];
  /** Client-side matches keyed by project id. */
  matches: Record<string, Match[]>;
  /** Freelancer-side recommended projects. */
  projectMatches: ProjectMatch[];
  /** Match-run start time per project (drives PENDING → RUNNING → DONE). */
  runs: Record<string, { startedAt: number; failed: boolean }>;
  clarifications: Record<string, string | null>;
  engagements: Engagement[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  notifications: AppNotification[];
  adminUsers: AdminUser[];
  reports: AdminReport[];
  impressions: string[];
  seq: number;
}

let db: MockDb | null = null;

export function getDb(): MockDb {
  if (db) return db;
  const now = Date.now();
  const iso = (offset: number) => new Date(now + offset).toISOString();

  const freelancers: FreelancerProfile[] = [
    {
      id: "f-1",
      name: "Nume Prenume",
      location: "București, România",
      experienceYears: 2,
      website: "https://portofoliu.exemplu.ro",
      headline: "Frontend developer",
      skills: ["React", "TypeScript", "Figma", "WordPress"],
      hourlyRate: 15,
      tier: "START",
      risingTalent: true,
      completedProjects: 1,
      availability: "FULL_TIME",
      categoryId: "web",
      rating: null,
      reviewsCount: 0,
      about:
        "Construiesc site-uri rapide și ușor de administrat pentru afaceri mici. Pun accent pe claritate, viteză și pe un design care se adaptează pe telefon.",
      languages: ["Română", "Engleză"],
      portfolio: [
        {
          id: "pf-1",
          title: "Site pentru un atelier de croitorie",
          description: "Site de prezentare cu galerie și formular de programare.",
          tags: ["WordPress", "UI/UX"],
        },
        {
          id: "pf-2",
          title: "Pagină de lansare pentru o aplicație",
          description: "Landing page cu animații discrete și formular de înscriere.",
          tags: ["React", "TypeScript"],
        },
      ],
    },
    {
      id: "f-2",
      name: "Nume Prenume",
      location: "Iași, România",
      experienceYears: 5,
      website: "https://design.exemplu.ro",
      headline: "Designer UI și branding",
      skills: ["Figma", "Branding", "UI/UX", "Webflow"],
      hourlyRate: 25,
      tier: "VERIFICAT",
      risingTalent: false,
      completedProjects: 6,
      availability: "PART_TIME",
      categoryId: "design",
      rating: 4.5,
      reviewsCount: 2,
      about:
        "Creez identități vizuale și interfețe care se înțeleg din prima. Lucrez bine cu afaceri locale și startup-uri la început de drum.",
      languages: ["Română", "Engleză", "Franceză"],
      portfolio: [
        {
          id: "pf-3",
          title: "Identitate vizuală pentru o brutărie",
          description: "Logo, paletă de culori și ambalaje.",
          tags: ["Branding"],
        },
        {
          id: "pf-4",
          title: "Redesign aplicație de rezervări",
          description: "Flux de rezervare simplificat de la 6 la 3 pași.",
          tags: ["UI/UX", "Figma"],
        },
        {
          id: "pf-5",
          title: "Site de portofoliu în Webflow",
          description: "Site pentru un fotograf, cu galerie pe categorii.",
          tags: ["Webflow"],
        },
      ],
    },
    {
      id: "f-3",
      name: "Nume Prenume",
      location: "Cluj-Napoca, România",
      experienceYears: 8,
      website: "https://dev.exemplu.ro",
      headline: "Full-stack developer",
      skills: ["React", "Node.js", "TypeScript", "Shopify"],
      hourlyRate: 40,
      tier: "EXPERT",
      risingTalent: false,
      completedProjects: 31,
      availability: "WEEKENDS",
      categoryId: "web",
      rating: 5,
      reviewsCount: 3,
      about:
        "Dezvolt magazine online și aplicații web complete, de la arhitectură la lansare și mentenanță.",
      languages: ["Română", "Engleză", "Germană"],
      portfolio: [
        {
          id: "pf-6",
          title: "Magazin online pentru produse eco",
          description: "Shopify cu integrare de curierat și facturare.",
          tags: ["Shopify", "Node.js"],
        },
      ],
    },
  ];

  const reviews: Record<string, Review[]> = {
    "f-1": [],
    "f-2": [
      {
        id: "r-1",
        authorName: "Nume Prenume",
        rating: 5,
        comment: "Comunicare foarte bună și livrare la timp.",
        projectTitle: "Logo pentru cafenea",
        createdAt: iso(-20 * DAY),
      },
      {
        id: "r-2",
        authorName: "Nume Prenume",
        rating: 4,
        comment: "Rezultat frumos, am avut nevoie de o rundă în plus de modificări.",
        projectTitle: "Carte de vizită",
        createdAt: iso(-45 * DAY),
      },
    ],
    "f-3": [
      {
        id: "r-3",
        authorName: "Nume Prenume",
        rating: 5,
        comment: "Foarte organizat, a explicat fiecare decizie tehnică.",
        projectTitle: "Magazin online",
        createdAt: iso(-10 * DAY),
      },
      {
        id: "r-4",
        authorName: "Nume Prenume",
        rating: 5,
        comment: "A rezolvat rapid o problemă veche a site-ului.",
        projectTitle: "Optimizare viteză",
        createdAt: iso(-60 * DAY),
      },
      {
        id: "r-5",
        authorName: "Nume Prenume",
        rating: 5,
        comment: "Recomand fără rezerve.",
        projectTitle: "Integrare plăți",
        createdAt: iso(-90 * DAY),
      },
    ],
  };

  const projects: Project[] = [
    {
      id: "p-1",
      title: "Site de prezentare pentru frizerie",
      description: "Vreau un site pentru frizeria mea, buget mic, în două săptămâni.",
      categoryId: "web",
      categoryName: "Dezvoltare web",
      budget: 600,
      deadline: iso(14 * DAY),
      skills: ["WordPress", "UI/UX"],
      clientType: "PERSOANA",
      ownerId: "u-client-1",
      ownerName: "Nume Prenume",
      status: "OPEN",
      createdAt: iso(-1 * DAY),
      matchesCount: 3,
    },
    {
      id: "p-2",
      title: "Magazin online pentru produse handmade",
      description:
        "Am nevoie de un magazin online cu plată cu cardul și livrare prin curier pentru produse lucrate manual.",
      categoryId: "web",
      categoryName: "Dezvoltare web",
      budget: 2500,
      deadline: iso(40 * DAY),
      skills: ["Shopify", "UI/UX"],
      clientType: "FIRMA",
      ownerId: "u-client-1",
      ownerName: "Nume Prenume",
      status: "IN_PROGRESS",
      createdAt: iso(-12 * DAY),
      matchesCount: 5,
    },
    {
      id: "p-3",
      title: "Identitate vizuală pentru cafenea",
      description: "Logo, culori și meniu pentru o cafenea de cartier.",
      categoryId: "design",
      categoryName: "Design și branding",
      budget: 800,
      deadline: iso(-5 * DAY),
      skills: ["Branding", "Ilustrație"],
      clientType: "FIRMA",
      ownerId: "u-client-1",
      ownerName: "Nume Prenume",
      status: "COMPLETED",
      createdAt: iso(-50 * DAY),
      matchesCount: 4,
    },
    {
      id: "p-4",
      title: "Aplicație de programări pentru salon",
      description:
        "Aplicație web în care clientele își aleg serviciul, stilistul și ora. Cu notificări prin SMS.",
      categoryId: "web",
      categoryName: "Dezvoltare web",
      budget: 4000,
      deadline: iso(60 * DAY),
      skills: ["React", "Node.js", "TypeScript"],
      clientType: "FIRMA",
      ownerId: "u-client-2",
      ownerName: "Nume Prenume",
      status: "OPEN",
      createdAt: iso(-2 * DAY),
      matchesCount: 4,
    },
  ];

  const [f1, f2, f3] = freelancers as [FreelancerProfile, FreelancerProfile, FreelancerProfile];
  const [p1, , , p4] = projects as [Project, Project, Project, Project];

  const matches: Record<string, Match[]> = {
    "p-1": [
      {
        id: "m-1",
        projectId: "p-1",
        freelancer: f1,
        score: 92,
        breakdown: { skills: 95, price: 98, availability: 90, deadline: 85 },
        reasons: ["abilități comune", "preț în buget", "disponibil în termen"],
        status: "NEW",
        seen: false,
      },
      {
        id: "m-2",
        projectId: "p-1",
        freelancer: f2,
        score: 85,
        breakdown: { skills: 88, price: 80, availability: 82, deadline: 90 },
        reasons: ["experiență în design pentru afaceri locale", "termen realist"],
        status: "NEW",
        seen: false,
      },
      {
        id: "m-3",
        projectId: "p-1",
        freelancer: f3,
        score: 78,
        breakdown: { skills: 90, price: 55, availability: 70, deadline: 95 },
        reasons: ["abilități tehnice puternice", "tarif peste buget"],
        status: "NEW",
        seen: true,
      },
    ],
  };

  const projectMatches: ProjectMatch[] = [
    {
      id: "pm-1",
      project: p1,
      score: 92,
      breakdown: { skills: 95, price: 98, availability: 90, deadline: 85 },
      reasons: ["abilități comune", "buget potrivit tarifului tău", "termen compatibil"],
      status: "NEW",
      seen: false,
    },
    {
      id: "pm-2",
      project: p4,
      score: 81,
      breakdown: { skills: 85, price: 90, availability: 75, deadline: 72 },
      reasons: ["React și TypeScript", "proiect potrivit pentru treapta ta"],
      status: "NEW",
      seen: false,
    },
  ];

  const engagements: Engagement[] = [
    {
      id: "e-1",
      projectId: "p-2",
      projectTitle: "Magazin online pentru produse handmade",
      client: { id: "u-client-1", name: "Nume Prenume" },
      freelancer: { id: "f-2", name: "Nume Prenume" },
      status: "IN_PROGRESS",
      budget: 2500,
      startedAt: iso(-8 * DAY),
      deliveredAt: null,
      completedAt: null,
      aiUsed: false,
      review: null,
    },
    {
      id: "e-2",
      projectId: "p-3",
      projectTitle: "Identitate vizuală pentru cafenea",
      client: { id: "u-client-1", name: "Nume Prenume" },
      freelancer: { id: "f-1", name: "Nume Prenume" },
      status: "COMPLETED",
      budget: 800,
      startedAt: iso(-40 * DAY),
      deliveredAt: iso(-9 * DAY),
      completedAt: iso(-5 * DAY),
      aiUsed: false,
      review: null,
    },
  ];

  const conversations: Conversation[] = [
    {
      id: "c-1",
      participant: { id: "f-2", name: "Nume Prenume" },
      projectTitle: "Magazin online pentru produse handmade",
      engagementStatus: "IN_PROGRESS",
      lastMessage: "Am terminat prima variantă a paginii de produs, ți-o trimit diseară.",
      lastMessageAt: iso(-25 * 60_000),
      unread: 2,
    },
    {
      id: "c-2",
      participant: { id: "f-1", name: "Nume Prenume" },
      projectTitle: "Site de prezentare pentru frizerie",
      engagementStatus: null,
      lastMessage: "Mulțumesc pentru invitație! Ai deja un logo?",
      lastMessageAt: iso(-1 * DAY),
      unread: 0,
    },
  ];

  const messages: Record<string, Message[]> = {
    "c-1": [
      {
        id: "msg-1",
        conversationId: "c-1",
        authorId: "me",
        body: "Bună! Cum merge lucrul la magazin?",
        createdAt: iso(-3 * HOUR),
      },
      {
        id: "msg-2",
        conversationId: "c-1",
        authorId: "f-2",
        body: "Bună! Merge bine, am structurat categoriile.",
        createdAt: iso(-2 * HOUR),
      },
      {
        id: "msg-3",
        conversationId: "c-1",
        authorId: "f-2",
        body: "Am terminat prima variantă a paginii de produs, ți-o trimit diseară.",
        createdAt: iso(-25 * 60_000),
      },
    ],
    "c-2": [
      {
        id: "msg-4",
        conversationId: "c-2",
        authorId: "me",
        body: "Salut! Te-am invitat la proiectul pentru frizerie.",
        createdAt: iso(-1 * DAY - HOUR),
      },
      {
        id: "msg-5",
        conversationId: "c-2",
        authorId: "f-1",
        body: "Mulțumesc pentru invitație! Ai deja un logo?",
        createdAt: iso(-1 * DAY),
      },
    ],
  };

  const notifications: AppNotification[] = [
    {
      id: "n-1",
      type: "MATCH",
      title: "Potriviri noi",
      body: "Am găsit 3 freelanceri pentru „Site de prezentare pentru frizerie”.",
      createdAt: iso(-10 * 60_000),
      read: false,
    },
    {
      id: "n-2",
      type: "MESSAGE",
      title: "Mesaj nou",
      body: "Nume Prenume ți-a trimis un mesaj.",
      createdAt: iso(-25 * 60_000),
      read: false,
    },
    {
      id: "n-3",
      type: "ENGAGEMENT",
      title: "Colaborare începută",
      body: "Colaborarea pentru „Magazin online” a început.",
      createdAt: iso(-2 * HOUR),
      read: true,
    },
    {
      id: "n-4",
      type: "REVIEW",
      title: "Lasă o recenzie",
      body: "Colaborarea pentru „Identitate vizuală pentru cafenea” s-a încheiat.",
      createdAt: iso(-3 * DAY),
      read: false,
    },
    {
      id: "n-5",
      type: "SYSTEM",
      title: "Profil",
      body: "Completează portofoliul ca să apari în mai multe potriviri.",
      createdAt: iso(-6 * DAY),
      read: true,
    },
  ];

  const adminUsers: AdminUser[] = [
    {
      id: "u-client-1",
      name: "Nume Prenume",
      email: "client@exemplu.ro",
      role: "CLIENT",
      status: "ACTIVE",
      createdAt: iso(-60 * DAY),
    },
    {
      id: "u-client-2",
      name: "Nume Prenume",
      email: "client2@exemplu.ro",
      role: "CLIENT",
      status: "ACTIVE",
      createdAt: iso(-30 * DAY),
    },
    {
      id: "u-freelancer-1",
      name: "Nume Prenume",
      email: "freelancer@exemplu.ro",
      role: "FREELANCER",
      status: "ACTIVE",
      createdAt: iso(-20 * DAY),
    },
    {
      id: "u-freelancer-2",
      name: "Nume Prenume",
      email: "designer@exemplu.ro",
      role: "FREELANCER",
      status: "ACTIVE",
      createdAt: iso(-90 * DAY),
    },
    {
      id: "u-freelancer-3",
      name: "Nume Prenume",
      email: "fullstack@exemplu.ro",
      role: "FREELANCER",
      status: "BLOCKED",
      createdAt: iso(-120 * DAY),
    },
    {
      id: "u-admin-1",
      name: "Nume Prenume",
      email: "admin@exemplu.ro",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: iso(-200 * DAY),
    },
  ];

  const reports: AdminReport[] = [
    {
      id: "rep-1",
      reason: "Mesaje nesolicitate",
      targetType: "USER",
      targetName: "Nume Prenume",
      reporterName: "Nume Prenume",
      status: "OPEN",
      createdAt: iso(-1 * DAY),
    },
    {
      id: "rep-2",
      reason: "Descriere înșelătoare",
      targetType: "PROJECT",
      targetName: "Aplicație de programări pentru salon",
      reporterName: "Nume Prenume",
      status: "OPEN",
      createdAt: iso(-3 * DAY),
    },
    {
      id: "rep-3",
      reason: "Limbaj nepotrivit",
      targetType: "MESSAGE",
      targetName: "Conversație #c-9",
      reporterName: "Nume Prenume",
      status: "RESOLVED",
      createdAt: iso(-12 * DAY),
    },
  ];

  db = {
    freelancers,
    reviews,
    projects,
    matches,
    projectMatches,
    runs: { "p-1": { startedAt: 0, failed: false } },
    clarifications: { "p-1": "Ai deja un logo sau culori de brand?" },
    engagements,
    conversations,
    messages,
    notifications,
    adminUsers,
    reports,
    impressions: [],
    seq: 100,
  };
  return db;
}

export const nextId = (prefix: string) => `${prefix}-${++getDb().seq}`;

/** Simulated network latency for mock responses. */
export const mockDelay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

/** Deep-ish copy so React Query never holds references the mock mutates in place. */
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
