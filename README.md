# FairMatch

FairMatch este o platformă web pentru potrivirea freelancerilor cu proiecte și clienți.
Aplicația pune accent pe relevanță, transparență și echitate: utilizatorii pot căuta
freelanceri, crea proiecte, vedea potriviri explicabile, administra colaborări și
comunica în cadrul proiectelor.

## Funcționalități

- autentificare pentru clienți și freelanceri;
- explorarea profilurilor de freelanceri;
- creare și gestionarea proiectelor;
- potriviri bazate pe abilități, buget și disponibilitate;
- scoruri și explicații pentru fiecare recomandare;
- dashboard, portofoliu, mesaje și colaborări;
- roluri pentru utilizatori și administratori;
- interfață disponibilă în română, rusă și engleză;
- teme light și dark;
- stări de încărcare, eroare și conținut gol.

## Tehnologii

- React 19;
- TanStack Start și TanStack Router;
- TanStack Query;
- Zustand;
- Tailwind CSS;
- Radix UI;
- Vite;
- TypeScript;
- Vitest și Testing Library.

## Structura proiectului

```text
src/
├── components/       componente UI și componente reutilizabile
├── pages/            conținutul paginilor aplicației
├── routes/           rutele și layout-urile TanStack Router
├── services/         accesul la date și integrarea API
├── mocks/            date demonstrative pentru dezvoltare
├── store/            stări persistente Zustand
├── hooks/            hook-uri reutilizabile
├── i18n.tsx          traducerile aplicației
└── styles.css        stilurile globale și tema
```

## Pornire locală

Este necesară o versiune actuală de Node.js.

```sh
npm install
npm run dev
```

Aplicația poate fi deschisă apoi la adresa afișată în terminal, în mod obișnuit
`http://localhost:3000`.

## Comenzi

```sh
npm run dev       # pornește serverul de dezvoltare
npm run build     # creează build-ul de producție
npm run preview   # previzualizează build-ul de producție
npm run lint      # rulează ESLint
npm run test      # rulează testele o singură dată
npm run test:watch
                  # rulează testele în modul watch
```

## API și date demonstrative

Accesul aplicației la date se realizează prin `src/services/*`. În prezent,
`USE_MOCKS` este activ în `src/services/config.ts`, iar datele demonstrative sunt
preluate din `src/mocks`.

Pentru conectarea unui backend real, setează `VITE_API_URL` și dezactivează
`USE_MOCKS` în fișierul de configurare a serviciilor. Componentele nu au nevoie
de modificări deoarece păstrează aceeași interfață de servicii.

## Configurare

Variabilele de mediu pot fi definite într-un fișier `.env.local`:

```dotenv
VITE_API_URL=https://api.example.com
```
