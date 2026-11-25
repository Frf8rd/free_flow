# FairMatch

Platformă de freelancing cu potrivire automată între clienți și freelanceri.

## Structura

Proiectul are două foldere separate, care comunică doar prin API.

**client/** este frontendul: ce vede și folosește utilizatorul (paginile site-ului). Este făcut cu React, Vite și Tailwind.

**server/** este backendul: API-ul, logica aplicației, algoritmul de potrivire și accesul la baza de date. Este făcut cu Node.js, Express și Prisma, cu PostgreSQL pe Neon.

## Rulare

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```
