import { z } from 'zod';
import { config } from '../config.js';

// Aceleași reguli ca în backend (README 4.5): schemele Zod se pot sincroniza 1:1
const email = z.string().trim().min(1, 'Introdu emailul.').email('Email invalid.');
const optionalInt = z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ invalid_type_error: 'Introdu un număr.' }).int('Introdu un număr întreg.').min(0, 'Valoarea nu poate fi negativă.').optional());

export const loginSchema = z.object({ email, password: z.string().min(1, 'Introdu parola.') });

export const passwordRule = z.string().min(12, 'Minim 12 caractere.').max(72, 'Maxim 72 de caractere.');
export const registerSchema = z.object({
  role: z.enum(['CLIENT', 'FREELANCER'], { errorMap: () => ({ message: 'Alege cum vei folosi FairMatch.' }) }),
  name: z.string().trim().min(2, 'Introdu numele tău.').max(80),
  email,
  password: passwordRule,
  terms: z.literal(true, { errorMap: () => ({ message: 'Acceptă termenii ca să continui.' }) }),
});
export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ password: passwordRule, confirm: z.string() }).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Parolele nu coincid.' });
export const changePasswordSchema = z.object({ oldPassword: z.string().min(1, 'Introdu parola curentă.'), newPassword: passwordRule, confirm: z.string() })
  .refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'Parolele nu coincid.' })
  .refine((d) => d.newPassword !== d.oldPassword, { path: ['newPassword'], message: 'Parola nouă trebuie să fie diferită.' });

export const confirmPasswordSchema = z.object({ password: z.string().min(1, 'Introdu parola.') });
export const accountSchema = z.object({ name: z.string().trim().min(2, 'Introdu numele tău.').max(80), email });

export const freelancerProfileSchema = z.object({
  title: z.string().trim().min(3, 'Scrie un titlu de cel puțin 3 caractere.').max(80, 'Maxim 80 de caractere.'),
  bio: z.string().trim().min(30, 'Descrie-te în cel puțin 30 de caractere.').max(1500),
  level: z.enum(['BEGINNER', 'JUNIOR', 'MID', 'SENIOR']),
  hourlyRate: optionalInt,
  availability: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']),
  languages: z.array(z.string()).min(1, 'Alege cel puțin o limbă.'),
  skillIds: z.array(z.string()).min(1, 'Alege cel puțin o abilitate.').max(30, 'Maxim 30 de abilități.'),
});

export const clientProfileSchema = z.object({
  type: z.enum(['PERSON', 'COMPANY']),
  companyName: z.string().trim().max(120).optional().or(z.literal('')),
  description: z.string().trim().max(600).optional().or(z.literal('')),
  industry: z.string().trim().max(80).optional().or(z.literal('')),
}).refine((d) => d.type !== 'COMPANY' || d.companyName, { path: ['companyName'], message: 'Introdu numele firmei.' });

export const portfolioSchema = z.object({
  title: z.string().trim().min(3, 'Scrie un titlu de cel puțin 3 caractere.').max(100),
  description: z.string().trim().max(600).optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  link: z.string().trim().url('Introdu un link valid (cu https://).').optional().or(z.literal('')),
});

export const projectSchema = z.object({
  title: z.string().trim().max(120, 'Maxim 120 de caractere.').optional().or(z.literal('')),
  description: z.string().trim().min(config.minDescription, `Descrie proiectul în cel puțin ${config.minDescription} de caractere.`).max(config.maxDescription),
  categoryId: z.string({ required_error: 'Alege o categorie.' }).min(1, 'Alege o categorie.'),
  budgetMin: optionalInt,
  budgetMax: optionalInt,
  deadline: z.string().optional().or(z.literal('')),
  skillIds: z.array(z.string()).optional(),
}).refine((d) => d.budgetMin == null || d.budgetMax == null || d.budgetMin <= d.budgetMax, { path: ['budgetMin'], message: 'Bugetul minim nu poate depăși maximul.' })
  .refine((d) => !d.deadline || new Date(d.deadline) >= new Date(new Date().toDateString()), { path: ['deadline'], message: 'Termenul nu poate fi în trecut.' });

export const engagementSchema = z.object({
  agreedPrice: z.preprocess((v) => Number(v), z.number({ invalid_type_error: 'Introdu prețul.' }).int('Introdu un număr întreg.').min(1, 'Prețul trebuie să fie pozitiv.')),
  deadline: z.string().optional().or(z.literal('')),
});

export const reviewSchema = z.object({ rating: z.number().int().min(1, 'Alege o notă.').max(5), comment: z.string().trim().max(1000).optional().or(z.literal('')) });
export const reportSchema = z.object({ reason: z.string().trim().min(10, 'Descrie problema în cel puțin 10 caractere.').max(1000) });

// Rulează schema și întoarce { data } sau { errors: { camp: mesaj } }
export function validate(schema, values) {
  const r = schema.safeParse(values);
  if (r.success) return { data: r.data, errors: {} };
  const errors = {};
  for (const i of r.error.issues) { const k = i.path.join('.') || '_'; if (!errors[k]) errors[k] = i.message; }
  return { errors };
}
