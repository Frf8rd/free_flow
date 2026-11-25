const { z } = require("zod");
const { AppError } = require("../utils/errors");

const TARGET_TYPES = ["USER", "PROJECT"];

const createReportSchema = z.strictObject({
  targetType: z.enum(TARGET_TYPES, { error: `Tipul țintei trebuie să fie ${TARGET_TYPES.join(" sau ")}.` }),
  targetId: z
    .string({ error: "Ținta raportului nu este validă." })
    .trim()
    .min(1, "Ținta raportului nu este validă.")
    .max(64, "Ținta raportului nu este validă."),
  reason: z
    .string({ error: "Motivul trebuie să fie text." })
    .trim()
    .min(3, "Motivul trebuie să aibă minimum 3 caractere.")
    .max(120, "Motivul poate avea maximum 120 de caractere."),
  details: z
    .string({ error: "Detaliile trebuie să fie text." })
    .trim()
    .max(1000, "Detaliile pot avea maximum 1000 de caractere.")
    .optional()
    .transform((value) => (value ? value : null)),
});

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const message = issue.code === "unrecognized_keys"
    ? `Câmpuri necunoscute: ${issue.keys.join(", ")}.`
    : issue.message;
  throw new AppError(400, "VALIDATION_ERROR", message);
}

module.exports = { createReportSchema, parse };