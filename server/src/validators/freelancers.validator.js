const { z } = require("zod");
const { AppError } = require("../utils/errors");

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
    } catch {
      return false;
    }
  }, "Linkul trebuie să fie o adresă https validă.");

const profileUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(120).optional(),
    bio: z.string().trim().max(4000).optional(),
    level: z.enum(["BEGINNER", "JUNIOR", "MID", "SENIOR"]).optional(),
    hourlyRate: z.number().int().min(0).max(1_000_000).nullable().optional(),
    availability: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]).optional(),
    languages: z.array(z.string().trim().min(2).max(20)).max(10).optional(),
    skillIds: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Trimite cel puțin un câmp de modificat.");

const portfolioCreateSchema = z
  .object({
    title: z.string().trim().min(2, "Titlul este prea scurt.").max(120, "Titlul este prea lung."),
    description: z.string().trim().max(2000, "Descrierea este prea lungă.").nullable().optional(),
    link: httpsUrl.nullable().optional(),
    imageUrl: httpsUrl.nullable().optional(),
  })
  .strict();

const portfolioUpdateSchema = portfolioCreateSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Trimite cel puțin un câmp de modificat.");

const idSchema = z.string().trim().min(1).max(64);

function parse(schema, input) {
  const result = schema.safeParse(input ?? {});
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", result.error.issues[0].message);
  }
  return result.data;
}

function parseId(value) {
  return parse(idSchema, value);
}

module.exports = { profileUpdateSchema, portfolioCreateSchema, portfolioUpdateSchema, parse, parseId };
