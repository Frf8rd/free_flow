export type Role = "CLIENT" | "FREELANCER" | "ADMIN";

export type TierId = "START" | "VERIFICAT" | "INCERCAT" | "EXPERT";

export interface Tier {
  id: TierId;
  name: string;
  description: string;
}

export interface TierProgress {
  tier: TierId;
  nextTier: TierId | null;
  /** Projects still needed for the next tier. */
  projectsToNext: number;
  /** Projects completed towards the next tier. */
  completedTowardsNext: number;
  /** Total projects required by the next tier. */
  requiredForNext: number;
  /** 0–100 */
  percent: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileComplete: boolean;
  tierProgress?: TierProgress | undefined;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "ADMIN">;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export type Availability = "FULL_TIME" | "PART_TIME" | "WEEKENDS" | "UNAVAILABLE";

export interface FreelancerOnboardingInput {
  kind: "FREELANCER";
  skills: string[];
  hourlyRate: number;
  availability: Availability;
  bio: string;
}

export interface ClientOnboardingInput {
  kind: "CLIENT";
  clientType: ClientType;
  domain: string;
  description: string;
}

export type OnboardingInput = FreelancerOnboardingInput | ClientOnboardingInput;

export type ClientType = "PERSOANA" | "FIRMA";

export interface Category {
  id: string;
  name: string;
}

/* ---------- Freelancers ---------- */

export interface FreelancerSummary {
  id: string;
  name: string;
  /** e.g. "Frontend developer" */
  headline: string;
  skills: string[];
  /** EUR per hour */
  hourlyRate: number;
  tier: TierId;
  risingTalent: boolean;
  completedProjects: number;
  availability: Availability;
  categoryId: string;
  rating: number | null;
  reviewsCount: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrls?: string[];
}

export interface PortfolioInput {
  title: string;
  description: string;
  tags: string[];
  images?: File[];
}

export interface FreelancerProfile extends FreelancerSummary {
  about: string;
  languages: string[];
  portfolio: PortfolioItem[];
}

export interface FreelancerProfileInput {
  name: string;
  headline: string;
  about: string;
  skills: string[];
  hourlyRate: number;
  availability: Availability;
  languages: string[];
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  projectTitle: string;
  createdAt: string;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}

/* ---------- Projects ---------- */

export type ProjectStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Project {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  /** EUR */
  budget: number;
  /** ISO date */
  deadline: string;
  skills: string[];
  clientType: ClientType;
  ownerId: string;
  ownerName: string;
  status: ProjectStatus;
  createdAt: string;
  matchesCount: number;
  imageUrls?: string[];
}

export interface ProjectInput {
  description: string;
  categoryId: string;
  budget: number;
  deadline: string;
  skills: string[];
  title?: string | undefined;
  images?: File[];
}

/* ---------- Matches ---------- */

export interface MatchBreakdown {
  /** Abilități 0–100 */
  skills: number;
  /** Preț 0–100 */
  price: number;
  /** Disponibilitate 0–100 */
  availability: number;
  /** Termen 0–100 */
  deadline: number;
}

export type MatchStatus = "NEW" | "INVITED" | "INTERESTED" | "DISMISSED";

/** Client view: a freelancer recommended for a project. */
export interface Match {
  id: string;
  projectId: string;
  freelancer: FreelancerSummary;
  score: number;
  breakdown: MatchBreakdown;
  reasons: string[];
  status: MatchStatus;
  seen: boolean;
}

/** Freelancer view: a project recommended to the freelancer. */
export interface ProjectMatch {
  id: string;
  project: Project;
  score: number;
  breakdown: MatchBreakdown;
  reasons: string[];
  status: MatchStatus;
  seen: boolean;
}

export type MatchRunStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

export interface MatchRun {
  status: MatchRunStatus;
  project: Project;
  matches: Match[];
  /** Present only when the analysis finds the brief vague. */
  clarification: { question: string } | null;
}

/* ---------- Engagements ---------- */

export type EngagementStatus = "IN_PROGRESS" | "DELIVERED" | "COMPLETED";

export interface Engagement {
  id: string;
  projectId: string;
  projectTitle: string;
  client: { id: string; name: string };
  freelancer: { id: string; name: string };
  status: EngagementStatus;
  budget: number;
  startedAt: string;
  deliveredAt: string | null;
  completedAt: string | null;
  aiUsed: boolean;
  review: Review | null;
}

/* ---------- Messaging ---------- */

export interface Conversation {
  id: string;
  participant: { id: string; name: string };
  projectTitle: string;
  engagementStatus: EngagementStatus | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  createdAt: string;
  imageUrls?: string[];
}

/* ---------- Notifications ---------- */

export type NotificationType = "MATCH" | "MESSAGE" | "ENGAGEMENT" | "REVIEW" | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO date */
  createdAt: string;
  read: boolean;
}

export interface SidebarCounts {
  unseenMatches: number;
  unreadMessages: number;
  unreadNotifications: number;
  activeEngagements: number;
}

/* ---------- Browse ---------- */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BrowseFilters {
  q?: string | undefined;
  categoryId?: string | undefined;
  skills?: string[] | undefined;
  minRate?: number | undefined;
  maxRate?: number | undefined;
  availability?: Availability | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

/* ---------- Admin ---------- */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "BLOCKED";
  createdAt: string;
}

export interface AdminProject {
  id: string;
  title: string;
  ownerName: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reason: string;
  targetType: "USER" | "PROJECT" | "MESSAGE";
  targetName: string;
  reporterName: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
}
