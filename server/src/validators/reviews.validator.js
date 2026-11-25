const { z } = require("zod");
const { AppError } = require("../utils/errors");

const rating = z
  .number("Nota trebuie să fie un număr.")
  .int("Nota trebuie să fie un număr întreg.")
  .min(1, "Nota trebuie să fie între 1 și 5.")
  .max(5, "Nota trebuie să fie între 1 și 5.");

const comment = z.string().trim().max(2000, "Comentariul este prea lung.").nullable();

const reviewCreateSchema = z.object({ rating, comment: comment.optional() }).strict();

const reviewUpdateSchema = z
  .object({ rating: rating.optional(), comment: comment.optional() })
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

module.exports = { reviewCreateSchema, reviewUpdateSchema, parse, parseId };