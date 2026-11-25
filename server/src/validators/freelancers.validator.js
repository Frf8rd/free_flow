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
  }, "Linkul trebuie să fie o adresă https validă.");

const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "Numele este prea scurt.").max(100, "Numele este prea lung.").optional(),
    avatarUrl: httpsUrl.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Trimite cel puțin un câmp de modificat.");

const portfolioCreateSchema = z
  .object({
    title: z.string().trim().min(2, "Titlul este prea scurt.").max(120, "Titlul este prea lung."),
    description: z.string().trim().max(2000, "Descrierea este prea lungă.").nullable().optional(),
    url: httpsUrl.nullable().optional(),
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