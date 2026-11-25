const { z } = require("zod");
const { AppError } = require("../utils/errors");

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Linkul avatarului trebuie să fie o adresă https validă.");

const name = z.string().trim().min(2, "Numele este prea scurt.").max(100, "Numele este prea lung.");

// PATCH /users/me: nume, avatar, email. Pentru schimbarea emailului e nevoie de reautentificare.
const userPatchSchema = z
  .object({
    name: name.optional(),
    avatarUrl: httpsUrl.nullable().optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, "Adresa de email este prea lungă.")
      .pipe(z.email("Adresa de email nu este validă."))
      .optional(),
    // dovada de reautentificare (parolă, sau credential + nonce pentru conturi Google)
    password: z.string().max(256).optional(),
    credential: z.string().max(12000).optional(),
    nonce: z.string().max(64).optional(),
  })
  .strict()
  .refine(
    (value) => ["name", "avatarUrl", "email"].some((field) => value[field] !== undefined),
    "Trimite cel puțin un câmp de modificat."
  );

// PUT /clients/me: doar datele de profil. Emailul se schimbă prin PATCH /users/me.
const clientProfileSchema = z
  .object({
    name: name.optional(),
    avatarUrl: httpsUrl.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Trimite cel puțin un câmp de modificat.");

function parse(schema, input) {
  const result = schema.safeParse(input ?? {});
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", result.error.issues[0].message);
  }
  return result.data;
}

module.exports = { userPatchSchema, clientProfileSchema, parse };