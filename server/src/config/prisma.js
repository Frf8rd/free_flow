const { PrismaClient } = require('@prisma/client');

// O singură instanță PrismaClient pentru tot serverul
const prisma = new PrismaClient();

module.exports = prisma;