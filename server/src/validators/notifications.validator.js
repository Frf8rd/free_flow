const { z } = require("zod");
const { AppError } = require("../utils/errors");

// Parametrii necunoscuți din query sunt ignorați (ex. un cache-buster adăugat de frontend).
const listQuerySchema = z.object({
  kind: z.enum(["matches", "messages", "engagements"]).optional(),
  unread: z
    .enum(["true", "false"], { error: "Parametrul unread trebuie să fie true sau false." })
    .optional(),
  page: z.coerce
    .number({ error: "Parametrul page trebuie să fie un număr pozitiv." })
    .int("Parametrul page trebuie să fie un număr pozitiv.")
    .min(1, "Parametrul page trebuie să fie un număr pozitiv.")
    .optional(),
  limit: z.coerce
    .number({ error: "Parametrul limit trebuie să fie între 1 și 100." })
    .int("Parametrul limit trebuie să fie între 1 și 100.")
    .min(1, "Parametrul limit trebuie să fie între 1 și 100.")
    .max(100, "Parametrul limit trebuie să fie între 1 și 100.")
    .optional(),
});

const idSchema = z
  .string({ error: "Identificatorul notificării nu este valid." })
  .trim()
  .min(1, "Identificatorul notificării nu este valid.")
  .max(64, "Identificatorul notificării nu este valid.");

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new AppError(400, "VALIDATION_ERROR", result.error.issues[0].message);
}

module.exports = { listQuerySchema, idSchema, parse };
