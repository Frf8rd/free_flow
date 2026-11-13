const { z } = require('zod');

const skillsQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

module.exports = { skillsQuerySchema };