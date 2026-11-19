import { z } from "zod";

export const emailSchema = z
  .string({ required_error: "Introdu adresa de email." })
  .trim()
  .min(1, "Introdu adresa de email.")
  .email("Adresa de email nu este validă.")
  .max(255, "Adresa de email este prea lungă.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Introdu parola."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  role: z.enum(["CLIENT", "FREELANCER"], { required_error: "Alege tipul de cont." }),
  name: z
    .string()
    .trim()
    .min(2, "Numele trebuie să aibă cel puțin 2 caractere.")
    .max(80, "Numele este prea lung."),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Parola trebuie să aibă cel puțin 8 caractere.")
    .max(72, "Parola este prea lungă.")
    .regex(/[A-Za-z]/, "Parola trebuie să conțină cel puțin o literă.")
    .regex(/\d/, "Parola trebuie să conțină cel puțin o cifră."),
});
export type RegisterValues = z.infer<typeof registerSchema>;

/** 0–4 password strength with a Romanian label. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const s = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Foarte slabă", "Slabă", "Acceptabilă", "Bună", "Puternică"];
  return { score: s, label: labels[s] ?? "" };
}

export const freelancerOnboardingSchema = z.object({
  skills: z.array(z.string()).min(1, "Alege cel puțin o abilitate.").max(12, "Poți alege maximum 12 abilități."),
  hourlyRate: z.coerce
    .number({ invalid_type_error: "Introdu un tarif valid." })
    .int("Folosește un număr întreg.")
    .min(20, "Tariful minim este 20 lei/oră.")
    .max(2000, "Tariful maxim este 2000 lei/oră."),
  availability: z.enum(["FULL_TIME", "PART_TIME", "WEEKENDS", "UNAVAILABLE"], {
    required_error: "Alege disponibilitatea.",
  }),
  bio: z
    .string()
    .trim()
    .min(30, "Scrie cel puțin 30 de caractere.")
    .max(400, "Maximum 400 de caractere."),
});
export type FreelancerOnboardingValues = z.infer<typeof freelancerOnboardingSchema>;

export const clientOnboardingSchema = z.object({
  clientType: z.enum(["PERSOANA", "FIRMA"], { required_error: "Alege tipul de client." }),
  domain: z.string().min(1, "Alege domeniul."),
  description: z
    .string()
    .trim()
    .min(20, "Scrie cel puțin 20 de caractere.")
    .max(400, "Maximum 400 de caractere."),
});
export type ClientOnboardingValues = z.infer<typeof clientOnboardingSchema>;
