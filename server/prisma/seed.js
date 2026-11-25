require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Găsește clientul Prisma generat (calea depinde de `output` din schema.prisma)
function loadPrismaClient() {
  const dir = path.join(__dirname, '..', 'src', 'generated', 'prisma');
  const candidates = ['client.ts', 'client.js', 'index.js'];
  for (const file of candidates) {
    const full = path.join(dir, file);
    if (fs.existsSync(full)) return require(full);
  }
  return require('@prisma/client');
}
const { PrismaClient } = loadPrismaClient();
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const catalog = {
  'Web și programare': ['React', 'Node.js', 'PHP', 'JavaScript', 'HTML și CSS', 'WordPress', 'SQL'],
  'Design grafic': ['Logo design', 'Photoshop', 'Illustrator', 'Figma', 'UI/UX design'],
  'Traduceri': ['Engleză', 'Română', 'Rusă', 'Franceză', 'Corectură texte'],
  'Scriere și conținut': ['Copywriting', 'Articole de blog', 'Social media', 'SEO'],
  'Video și foto': ['Montaj video', 'Fotografie', 'Animație'],
};

async function seedCatalog() {
  for (const [categoryName, skills] of Object.entries(catalog)) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    for (const skillName of skills) {
      await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName, categoryId: category.id },
      });
    }
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD lipsesc din .env, sar peste contul de admin.');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: 'Admin', role: 'ADMIN' },
  });
}

async function main() {
  await seedCatalog();
  await seedAdmin();
  console.log('Seed finalizat.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());