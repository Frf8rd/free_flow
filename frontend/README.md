# FairMatch: client (React)

Frontend pentru FairMatch, conectat la API-ul din README-ul proiectului. Nicio pagină nu conține date de test: totul trece prin `hooks → services → axios`.

## Pornire

```bash
npm install
cp .env.example .env      # setează VITE_API_URL către backend
npm run dev               # cu backendul real
npm run dev:mock          # fără backend: server simulat în browser (doar dezvoltare)
npm test                  # test de fum: toate rutele, pe toate rolurile + fluxul complet
npm run build
```

Conturi în modul simulat (parola `demo1234`): `client@demo.md`, `freelancer@demo.md`, `admin@demo.md` (+ `maria@demo.md`, `alex@demo.md`…). Datele simulate stau în `localStorage` (`fm-mock-db-v1`); ștergerea lui le resetează. Serverul simulat **nu intră în build-ul de producție**.

## Cum conectezi backendul

1. Pornește API-ul și setează `VITE_API_URL` în `.env`. Butonul Google redirecționează la `VITE_GOOGLE_AUTH_URL` (implicit `VITE_API_URL/auth/google`).
2. Citește `API_CONTRACT.md`: ce e nou față de README (forgot/reset password, `POST /uploads`, `exposure`, `role` în `PATCH /users/me`, `onboarded` în `/auth/me`) și formele de răspuns așteptate.
3. Permite CORS pentru originul frontendului. Pentru refresh token în cookie httpOnly: `VITE_REFRESH_COOKIE=true` și `credentials: true` pe server.
4. Dacă un răspuns diferă de contract, adaptezi în `src/services/<domeniu>.js`, nu în pagini.

## Structură

```
src/
  config.js            variabile de mediu, intervale de polling
  services/            un fișier per domeniu API (auth, projects, matches, …) + api.js (axios, refresh automat, erori)
  hooks/queries.js     toate interogările și mutațiile (React Query), cu invalidări
  store/               authStore (sesiune), themeStore
  lib/                 validators (Zod), useForm, format (monedă, date), image (comprimare), tokens
  components/
    ui/                Kit (carduri, stări, progres…), Fields, Modal, Icon
    forms/             ImageUpload, SkillSelector
    match/             carduri de potrivire, scor explicat, invitație, raportare
    layout/            AppLayout, Sidebar, ProtectedRoute, PublicShell
  pages/               o pagină per rută
  mocks/               server simulat (activ doar cu VITE_USE_MOCK=true)
```

## Decizii de produs implementate

- **Rolul se alege la înregistrare** (client / freelancer) și se schimbă **doar din Setări**. Nu există comutator în bara laterală.
- **Acasă** arată ce ai de făcut acum (nu un feed social): următorul pas, potriviri, atenție, completarea profilului, treapta, expunerea.
- **Brief-first:** descrierea scrisă pe pagina principală se păstrează și apare precompletată în formularul de proiect după înregistrare.
- **Echitate vizibilă:** fără sortare după popularitate în Explorează, „Talent în creștere" marcat clar, scorul poate fi deschis componentă cu componentă.
- Upload de imagini cu validare și comprimare în browser; profil avansat (abilități din catalog, portofoliu, completare măsurată).

## Ce nu e inclus (post-MVP, ca în README)

Plăți/escrow, vouch-uri, editarea/ștergerea recenziilor, notificări pe email (le trimite backendul), traducere interfață (textele sunt în română), pre-randare SEO pentru paginile publice (SPA Vite), analytics (există punctul de conectare `lib/analytics.js`).
