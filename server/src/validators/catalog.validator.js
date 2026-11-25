const { z } = require("zod");

const skillsQuerySchema = z.object({
  categoryId: z.string().trim().min(1, "Categoria nu este validă.").optional(),
  q: z.string().trim().min(1, "Căutarea nu este validă.").max(100, "Căutarea este prea lungă.").optional(),
});

module.exports = { skillsQuerySchema };