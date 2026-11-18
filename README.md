# 🤝 FairMatch — Freelancing cu șanse egale

> **Nu cel mai cunoscut. Cel mai potrivit.**

Platformă web de freelancing în care un sistem de potrivire (matching) face căutarea în locul oamenilor. Clientul descrie ce are nevoie, iar platforma îi propune automat freelancerii cei mai potriviți pentru proiectul lui, **indiferent de câte recenzii sau câtă experiență au**. Același lucru funcționează și invers: freelancerul primește proiecte potrivite lui, fără să le caute printre mii de anunțuri.

> ⚠️ **Numele „FairMatch" este provizoriu.** Verifică disponibilitatea domeniului și a mărcii înainte de a-l fixa.

- **Client (frontend):** React + Tailwind CSS
- **Server (backend):** Node.js + Express.js
- **Bază de date:** PostgreSQL pe **Neon** (online), accesat prin **Prisma** din cod
- **AI / algoritm de potrivire:** definit în secțiunea 9; tehnologia se alege mai târziu
- **Platformă:** doar **website** (la început; aplicația mobilă poate veni după)

---

## Cuprins

1. [Ideea, descrierea, obiectivele, publicul și scopul](#1-ideea-descrierea-obiectivele-publicul-și-scopul)
2. [Tehnologii (frontend, backend, bază de date)](#2-tehnologii-frontend-backend-bază-de-date)
3. [Funcționalitățile website-ului](#3-funcționalitățile-website-ului)
4. [FRONTEND — structură, pagini și apelurile API ale fiecăreia](#4-frontend--structură-pagini-și-apelurile-api-ale-fiecăreia)
5. [BACKEND — structură, rute și CRUD](#5-backend--structură-rute-și-crud)
6. [BACKEND — Baza de date (Neon + Prisma)](#6-backend--baza-de-date-neon--prisma)
7. [Cum se unesc frontendul și backendul](#7-cum-se-unesc-frontendul-și-backendul)
8. [Reguli de lucru în echipă](#8-reguli-de-lucru-în-echipă)
9. [Algoritmul de potrivire și AI](#9-algoritmul-de-potrivire-și-ai)
10. [Plan de lucru pe faze](#10-plan-de-lucru-pe-faze)
11. [Marketing](#11-marketing)
12. [Monetizare](#12-monetizare)
13. [Riscuri și decizii deschise](#13-riscuri-și-decizii-deschise)

---

## 1. Ideea, descrierea, obiectivele, publicul și scopul

### 1.1. Problema

Pe platformele de freelancing existente (Fiverr, Upwork etc.) apar două probleme mari:

1. **Clientul se pierde în oferte.** Trebuie să caute singur printre mii de profiluri, să compare prețuri și portofolii, să scrie multor oameni și să aleagă la întâmplare. De obicei alege pe cine vede primul sau pe cine are multe recenzii.
2. **Începătorii nu sunt văzuți.** Cine nu are recenzii nu apare sus în rezultate, deci nu primește comenzi, deci nu poate face recenzii. E un cerc vicios. Mulți oameni cu talent real renunță înainte să primească prima șansă.

### 1.2. Ideea

Un **algoritm de potrivire în ambele sensuri**:

- **Client → Freelancer:** clientul scrie liber ce are nevoie („vreau un site pentru frizeria mea, buget mic, în două săptămâni"). Platforma înțelege cererea și îi arată direct **câțiva freelanceri potriviți**, cu explicația „de ce se potrivește".
- **Freelancer → Client:** freelancerul își completează profilul (ce știe, ce a făcut, ce preț și disponibilitate are) și platforma îi trimite **proiecte potrivite** lui. Nu mai stă să fie „descoperit".

Potrivirea se face pe baza **cât de bine se potrivește persoana cu proiectul** (abilități, portofoliu, preț, disponibilitate, termen), nu pe baza numărului de recenzii acumulate.

### 1.3. Descrierea produsului

FairMatch este un website cu două tipuri de utilizatori (client și freelancer). Ambii creează cont și își completează profilul. Clientul postează un proiect, iar sistemul calculează un **scor de potrivire** cu freelancerii disponibili și îi propune pe cei mai buni. Freelancerii potriviți sunt notificați și pot arăta interes. Clientul și freelancerul vorbesc pe chat, se înțeleg, lucrează, iar la final se lasă recenzii. Recenziile contează, dar **nu domină** potrivirea (vezi secțiunea 9).

### 1.4. Obiective

**Obiective de produs**
- Clientul găsește un freelancer potrivit în **sub 5 minute** de la postarea proiectului.
- Un freelancer începător primește **primele propuneri în prima săptămână** de la completarea profilului.
- Fiecare recomandare vine cu o **explicație clară** (de ce a fost aleasă persoana).
- Procesul e simplu: fără formulare lungi și fără căutare manuală obligatorie.

**Obiective de echitate**
- Experiența (recenzii, număr de proiecte) să nu fie singurul criteriu de selecție.
- Fiecare freelancer activ să primească **expunere minimă garantată** (nu doar cei de top).
- Competența să fie dovedită prin **portofoliu și mini-teste**, nu doar prin istoric.

**Obiective tehnice**
- Cod curat, împărțit pe module, ușor de lucrat în echipă.
- API clar documentat, identic între frontend și backend (acest README e sursa de adevăr).
- Algoritm de potrivire testabil și explicabil.

### 1.5. Pentru cine este

| Public | Nevoie |
|---|---|
| **Freelanceri începători** (studenți, elevi, autodidacți, oameni care se reprofilează) | Prima șansă reală și primele recenzii |
| **Freelanceri cu experiență** | Proiecte potrivite fără să piardă timp căutând |
| **Afaceri mici** (frizerii, restaurante, magazine, saloane) | Un freelancer bun, repede, fără să știe cum să-l caute |
| **Studenți și persoane private** | Ajutor punctual (design, traduceri, programare, grafică) la preț accesibil |
| **Start-up-uri mici** | Talente noi la costuri mici |

### 1.6. Scopul

Să schimbe regula „cine are recenzii, câștigă" în **„cine se potrivește, câștigă"**, și să dea fiecărui om care știe să facă o treabă o șansă corectă de a fi ales.

### 1.7. Ce ne diferențiază

1. **Matching automat în ambele sensuri** (nu doar căutare cu filtre).
2. **Echitate prin design:** scor care nu depinde doar de recenzii, plus expunere garantată pentru începători.
3. **Explicații pentru fiecare recomandare** („se potrivește pentru că…").
4. **Verificarea competenței** prin portofoliu și mini-teste, ca începătorii să poată dovedi ce știu.
5. **Descriere liberă a proiectului** de către client, fără formulare complicate.

---

## 2. Tehnologii (frontend, backend, bază de date)

### 2.1. Frontend
| Tehnologie | Rol |
|---|---|
| **React** (cu **Vite**) | Interfața |
| **Tailwind CSS** | Stilizare |
| **React Router** | Navigare între pagini |
| **Axios** | Apeluri către API |
| **TanStack Query (React Query)** | Date de la server: cache, loading, erori, refetch |
| **React Hook Form** + **Zod** | Formulare și validare |
| **Zustand** (sau Context API) | Starea mică locală (utilizatorul logat) |

### 2.2. Backend
| Tehnologie | Rol |
|---|---|
| **Node.js** + **Express.js** | Serverul API REST |
| **Prisma** (ORM) | Acces la baza de date din cod, migrări, tipuri |
| **JWT** (`jsonwebtoken`) | Autentificare (access + refresh token) |
| **bcrypt** | Hash de parole |
| **Zod** | Validarea datelor primite |
| **cors**, **helmet**, **express-rate-limit** | Securitate de bază |
| **dotenv** | Variabile de mediu |
| **multer** (+ serviciu de stocare, vezi decizii deschise) | Încărcarea imaginilor de portofoliu |

### 2.3. Bază de date
| Tehnologie | Rol |
|---|---|
| **PostgreSQL** pe **Neon** (serverless, online) | Baza de date principală |
| **Prisma** | Schema, migrările și interogările din cod |

### 2.4. AI / algoritm
**Nu este ales încă.** Specificația cerințelor este în secțiunea 9. Tehnologia (reguli, model de limbaj, embeddings etc.) se decide ulterior.

---

## 3. Funcționalitățile website-ului

### 3.1. Esențiale (MVP)

| # | Funcție | Descriere |
|---|---|---|
| 1 | **Cont și autentificare** | Înregistrare ca Client sau Freelancer, login, logout, ștergere cont |
| 2 | **Profil freelancer** | Titlu, descriere, abilități, nivel, preț orar/pe proiect, disponibilitate, limbi, portofoliu |
| 3 | **Profil client** | Nume, tip (persoană / firmă), descriere scurtă, domeniu |
| 4 | **Postare proiect** | Descriere liberă + categorie, buget, termen, abilități (opțional, cele neclare le deduce sistemul) |
| 5 | **Recomandări pentru client** | După postarea proiectului, lista cu top freelanceri potriviți + scor + „de ce" |
| 6 | **Recomandări pentru freelancer** | Lista cu proiecte potrivite + scor + „de ce" |
| 7 | **Interes și invitație** | Freelancerul își arată interesul pentru un proiect; clientul poate invita direct un freelancer |
| 8 | **Chat** | Mesaje între client și freelancer după interes/invitație |
| 9 | **Colaborare (engagement)** | Acceptare, stare: în lucru → livrat → finalizat |
| 10 | **Recenzii** | După finalizare, ambele părți se evaluează |
| 11 | **Căutare manuală cu filtre** | Alternativă la recomandări (categorie, preț, abilități) |
| 12 | **Notificări** | În site: „ai o potrivire nouă", „ai primit un mesaj" |
| 13 | **Panou admin** | Moderare utilizatori, proiecte, raportări |

### 3.2. După MVP

| # | Funcție | Descriere |
|---|---|---|
| 14 | **Mini-teste de competență** | Teste scurte pe abilități, pentru începători, ca să-și dovedească nivelul |
| 15 | **Plăți și escrow** | Banii se rețin și se eliberează după livrare |
| 16 | **Notificări pe email** | Potriviri noi, mesaje, reamintiri |
| 17 | **Insigne („Rising Talent", „Verificat")** | Evidențierea începătorilor buni |
| 18 | **Proiecte mici „de start"** | Proiecte cu risc mic pentru primele comenzi ale începătorilor |
| 19 | **Statistici** | Pentru freelancer: vizualizări, propuneri, rată de succes |
| 20 | **Aplicație mobilă** | După ce website-ul e stabil |

---

## 4. FRONTEND — structură, pagini și apelurile API ale fiecăreia

### 4.1. Structura folderelor

```
client/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env                         # VITE_API_URL=http://localhost:4000/api
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx                  # definirea rutelor
    ├── pages/                   # câte un fișier per pagină
    │   ├── Landing.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Onboarding.jsx
    │   ├── Dashboard.jsx
    │   ├── ProjectNew.jsx
    │   ├── ProjectDetail.jsx
    │   ├── MyProjects.jsx
    │   ├── Recommendations.jsx
    │   ├── Browse.jsx
    │   ├── FreelancerProfile.jsx
    │   ├── ProfileEdit.jsx
    │   ├── Engagements.jsx
    │   ├── EngagementDetail.jsx
    │   ├── Messages.jsx
    │   ├── Notifications.jsx
    │   ├── Settings.jsx
    │   ├── admin/AdminDashboard.jsx
    │   └── NotFound.jsx
    ├── components/
    │   ├── ui/                  # Button, Input, Card, Badge, Modal, Spinner, EmptyState, ErrorState
    │   ├── layout/              # Navbar, Footer, Sidebar, ProtectedRoute
    │   ├── freelancer/          # FreelancerCard, SkillTags, PortfolioGrid
    │   ├── project/             # ProjectCard, ProjectForm
    │   ├── match/               # MatchCard, MatchScoreBar, WhyMatched
    │   └── chat/                # ConversationList, MessageBubble, MessageInput
    ├── hooks/                   # useAuth, useProjects, useMatches, useMessages...
    ├── services/                # funcții care apelează API-ul
    │   ├── api.js               # instanța Axios + token + erori
    │   ├── auth.js
    │   ├── users.js
    │   ├── freelancers.js
    │   ├── projects.js
    │   ├── matches.js
    │   ├── engagements.js
    │   ├── messages.js
    │   ├── reviews.js
    │   ├── notifications.js
    │   ├── skills.js
    │   └── admin.js
    ├── store/
    │   └── authStore.js
    └── utils/                   # formatare date, preț, validări
```

### 4.2. Navigație și protecția rutelor

- **Publice:** `/`, `/login`, `/register`, `/browse`, `/freelancers/:id`
- **Doar logat:** restul. `ProtectedRoute` redirecționează la `/login`.
- **După rol:** `CLIENT` vede „Postează proiect", `FREELANCER` vede „Potriviri pentru mine", `ADMIN` vede `/admin`.
- La prima logare, dacă profilul nu e completat → redirect la `/onboarding`.

### 4.3. Lista paginilor, conținutul și apelurile API

> Toate apelurile trebuie să existe **identic** în backend (secțiunea 5). Prefix comun: `/api`.

| Rută (pagină) | Ce conține | Apeluri API |
|---|---|---|
| `/` (**Landing**) | Prezentarea ideii, cum funcționează, butoane „Sunt client" / „Sunt freelancer", exemple | – |
| `/login` | Email + parolă, erori, link spre înregistrare | `POST /auth/login` |
| `/register` | Alegere rol (Client / Freelancer), nume, email, parolă | `POST /auth/register` |
| `/onboarding` | Completare profil la prima intrare (pași). Freelancer: abilități, preț, disponibilitate. Client: tip, domeniu | `GET /skills`, `GET /categories`, `PUT /freelancers/me` sau `PUT /clients/me` |
| `/dashboard` | Rezumat: proiectele mele / potriviri noi, colaborări active, mesaje necitite | `GET /matches/me?status=new`, `GET /engagements/me?status=active`, `GET /notifications?unread=true` |
| `/projects/new` | Formular proiect: descriere liberă, categorie, buget, termen, abilități (opțional) | `GET /categories`, `GET /skills`, `POST /projects` |
| `/projects/mine` | Proiectele clientului, cu status | `GET /projects/me` |
| `/projects/:id` | Detalii proiect, freelanceri potriviți (pentru client), buton „Sunt interesat" (pentru freelancer), edit/ștergere (proprietar) | `GET /projects/:id`, `GET /projects/:id/matches`, `POST /matches/:id/interest`, `PATCH /projects/:id`, `DELETE /projects/:id` |
| `/recommendations` | **Inima aplicației.** Client: freelancerii recomandați pentru proiectul ales. Freelancer: proiectele recomandate. Fiecare card are scor + „de ce se potrivește" | `GET /matches/me`, `GET /projects/:id/matches`, `POST /matches/:id/invite`, `POST /matches/:id/interest`, `POST /matches/:id/dismiss` |
| `/browse` | Căutare manuală cu filtre (categorie, abilități, preț, disponibilitate), paginare | `GET /freelancers`, `GET /projects`, `GET /categories`, `GET /skills` |
| `/freelancers/:id` | Profil public: descriere, abilități, portofoliu, recenzii, disponibilitate, buton „Invită la un proiect" | `GET /freelancers/:id`, `GET /freelancers/:id/reviews`, `POST /matches/invite` |
| `/profile/edit` | Editare profil, portofoliu (adăugare/ștergere elemente) | `GET /freelancers/me` / `GET /clients/me`, `PUT /freelancers/me` / `PUT /clients/me`, `POST /freelancers/me/portfolio`, `PATCH /freelancers/me/portfolio/:id`, `DELETE /freelancers/me/portfolio/:id` |
| `/engagements` | Lista colaborărilor mele, pe stări | `GET /engagements/me` |
| `/engagements/:id` | Detalii colaborare, schimbare stare (început, livrat, finalizat), formular de recenzie | `GET /engagements/:id`, `PATCH /engagements/:id/status`, `POST /engagements/:id/reviews` |
| `/messages` | Lista conversațiilor + fereastra de chat (polling la 5 s la început) | `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`, `PATCH /conversations/:id/read` |
| `/notifications` | Lista notificărilor | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| `/settings` | Schimbare nume / parolă / email, ștergere cont | `PATCH /users/me`, `POST /auth/change-password`, `DELETE /users/me` |
| `/admin` | Utilizatori, proiecte, raportări; blocare/deblocare, ștergere | `GET /admin/users`, `PATCH /admin/users/:id`, `GET /admin/projects`, `DELETE /admin/projects/:id`, `GET /admin/reports` |
| `*` (**404**) | Pagină negăsită | – |

### 4.4. Stări obligatorii pe fiecare pagină cu date

**Loading** (spinner/skeleton), **eroare** (cu „Reîncearcă"), **gol** (ex. „Nu ai niciun proiect încă — postează primul") și **datele**. Fără ele, site-ul pare stricat când rețeaua e lentă.

### 4.5. Logică comună în frontend

- **`services/api.js`**: o singură instanță Axios care adaugă tokenul în header (`Authorization: Bearer <accessToken>`), parsează erorile în format unic și, la `401`, încearcă `POST /auth/refresh`; dacă nu reușește, face logout.
- **Hook-uri** cu React Query: `useMatches`, `useProject(id)`, `useConversations` (cu polling).
- **URL-ul serverului** nu se scrie în cod, ci vine din `VITE_API_URL`.
- **Formulare** cu React Hook Form + Zod; aceleași reguli de validare ca în backend.
- **Design:** mobile-first (site-ul trebuie să arate bine pe telefon), Tailwind, componente reutilizabile.

---

## 5. BACKEND — structură, rute și CRUD

### 5.1. Structura folderelor

```
server/
├── package.json
├── .env                         # NU se pune în git
├── .env.example                 # se pune în git (fără secrete)
├── prisma/
│   ├── schema.prisma            # modelele bazei de date
│   ├── migrations/
│   └── seed.js                  # date inițiale (categorii, abilități, admin)
└── src/
    ├── server.js                # pornește serverul
    ├── app.js                   # configurare Express (cors, helmet, rute)
    ├── config/
    │   ├── env.js               # citește și validează variabilele de mediu
    │   └── prisma.js            # instanța unică PrismaClient
    ├── routes/                  # definirea rutelor (câte un fișier per modul)
    │   ├── index.js             # montează totul sub /api
    │   ├── auth.routes.js
    │   ├── users.routes.js
    │   ├── freelancers.routes.js
    │   ├── clients.routes.js
    │   ├── projects.routes.js
    │   ├── matches.routes.js
    │   ├── engagements.routes.js
    │   ├── conversations.routes.js
    │   ├── reviews.routes.js
    │   ├── notifications.routes.js
    │   ├── catalog.routes.js    # categories + skills
    │   └── admin.routes.js
    ├── controllers/             # primesc cererea, apelează service-ul, trimit răspunsul
    ├── services/                # logica de business (aici stă munca reală)
    │   ├── auth.service.js
    │   ├── matching/            # algoritmul de potrivire (secțiunea 9)
    │   └── ...
    ├── validators/              # scheme Zod pentru fiecare endpoint
    ├── middlewares/
    │   ├── auth.js              # verifică JWT și încarcă utilizatorul
    │   ├── requireRole.js       # CLIENT / FREELANCER / ADMIN
    │   ├── validate.js          # rulează schema Zod
    │   ├── rateLimit.js
    │   └── errorHandler.js      # format unic de eroare
    └── utils/
        ├── jwt.js
        ├── hash.js
        └── errors.js            # clase de erori (NotFound, Forbidden...)
```

> Fluxul unei cereri: **route → middleware (auth, validate) → controller → service → Prisma → răspuns**. Controllerul nu conține logică de business, doar apelează service-ul.

### 5.2. Format de răspuns

Succes: JSON cu datele. Eroare, mereu același format:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Email invalid" } }
```

Coduri HTTP: `200/201` ok, `204` șters, `400` date invalide, `401` neautentificat, `403` interzis, `404` negăsit, `409` conflict (email existent, deja trimis), `429` prea multe cereri, `500` eroare server.

**Paginare** pe liste: `?page=1&limit=20` → `{ data: [...], page, limit, total }`.

### 5.3. Autentificare

- `Authorization: Bearer <accessToken>` pe toate rutele, în afară de cele marcate 🔓.
- Access token: 15–30 min. Refresh token: 7–30 zile, salvat în baza de date (pentru invalidare la logout).
- Roluri: `CLIENT`, `FREELANCER`, `ADMIN`.

### 5.4. Toate rutele API

Prefix comun: **`/api`**.

#### Verificare și autentificare
| Metodă | Rută | Descriere |
|---|---|---|
| 🔓 `GET` | `/health` | Verificare că serverul rulează |
| 🔓 `POST` | `/auth/register` | `{ name, email, password, role }` → `{ user, accessToken, refreshToken }` |
| 🔓 `POST` | `/auth/login` | `{ email, password }` → `{ user, accessToken, refreshToken }` |
| 🔓 `POST` | `/auth/refresh` | `{ refreshToken }` → `{ accessToken }` |
| `POST` | `/auth/logout` | Invalidează refresh token-ul |
| `POST` | `/auth/change-password` | `{ oldPassword, newPassword }` |
| `GET` | `/auth/me` | Utilizatorul curent + profilul lui |

#### Utilizatori
| Metodă | Rută | Descriere |
|---|---|---|
| `PATCH` | `/users/me` | Schimbă nume / avatar / email |
| `DELETE` | `/users/me` | Șterge contul și datele asociate |

#### Catalog (categorii și abilități)
| Metodă | Rută | Descriere |
|---|---|---|
| 🔓 `GET` | `/categories` | Lista categoriilor (Web, Design, Traduceri…) |
| 🔓 `GET` | `/skills` | Lista abilităților; filtru `?categoryId=&q=` |

#### Freelanceri (CRUD profil + portofoliu)
| Metodă | Rută | Descriere |
|---|---|---|
| 🔓 `GET` | `/freelancers` | Căutare cu filtre: `?q=&categoryId=&skillIds=&minRate=&maxRate=&availability=&page=&limit=` |
| 🔓 `GET` | `/freelancers/:id` | Profil public (abilități, portofoliu, medie recenzii) |
| `GET` | `/freelancers/me` | Profilul meu (FREELANCER) |
| `PUT` | `/freelancers/me` | **Create/Update** profil: `{ title, bio, level, hourlyRate, availability, languages, skillIds }` |
| `POST` | `/freelancers/me/portfolio` | **Create** element de portofoliu: `{ title, description, imageUrl, link }` |
| `PATCH` | `/freelancers/me/portfolio/:id` | **Update** element |
| `DELETE` | `/freelancers/me/portfolio/:id` | **Delete** element |
| 🔓 `GET` | `/freelancers/:id/reviews` | Recenziile primite |

#### Clienți
| Metodă | Rută | Descriere |
|---|---|---|
| `GET` | `/clients/me` | Profilul meu (CLIENT) |
| `PUT` | `/clients/me` | Create/Update: `{ type, companyName, description, industry }` |

#### Proiecte (CRUD)
| Metodă | Rută | Descriere |
|---|---|---|
| `POST` | `/projects` | **Create** (CLIENT): `{ title, description, categoryId, budgetMin, budgetMax, deadline, skillIds? }`. Declanșează calculul potrivirilor |
| `GET` | `/projects` | **Read** listă (public/logat), filtre: `?q=&categoryId=&skillIds=&minBudget=&maxBudget=&status=&page=&limit=` |
| `GET` | `/projects/me` | Proiectele mele (CLIENT) |
| `GET` | `/projects/:id` | **Read** detalii |
| `PATCH` | `/projects/:id` | **Update** (doar proprietar) |
| `DELETE` | `/projects/:id` | **Delete** (doar proprietar; sau închidere) |
| `GET` | `/projects/:id/matches` | Freelancerii recomandați pentru proiect (doar proprietar) |

#### Potriviri (matches)
| Metodă | Rută | Descriere |
|---|---|---|
| `GET` | `/matches/me` | Potrivirile mele: CLIENT → freelanceri recomandați; FREELANCER → proiecte recomandate. Filtru `?status=&projectId=` |
| `POST` | `/matches/:id/interest` | FREELANCER își arată interesul pentru proiect |
| `POST` | `/matches/:id/invite` | CLIENT invită freelancerul recomandat |
| `POST` | `/matches/invite` | CLIENT invită un freelancer găsit manual: `{ projectId, freelancerId }` |
| `POST` | `/matches/:id/dismiss` | Ascunde recomandarea (opțional cu motiv, folosit ca feedback pentru algoritm) |
| `POST` | `/matches/refresh` | Recalculează potrivirile pentru mine / pentru un proiect (cu limită de utilizare) |

#### Colaborări (engagements)
| Metodă | Rută | Descriere |
|---|---|---|
| `POST` | `/engagements` | Creează colaborarea după acord: `{ matchId, agreedPrice, deadline }` |
| `GET` | `/engagements/me` | Colaborările mele; filtru `?status=` |
| `GET` | `/engagements/:id` | Detalii (doar participanții) |
| `PATCH` | `/engagements/:id/status` | `{ status }`: `IN_PROGRESS` → `DELIVERED` → `COMPLETED` / `CANCELLED` (cu reguli de cine poate schimba ce) |

#### Recenzii
| Metodă | Rută | Descriere |
|---|---|---|
| `POST` | `/engagements/:id/reviews` | `{ rating (1–5), comment }` — doar după `COMPLETED`, o singură dată per participant |
| `GET` | `/freelancers/:id/reviews` | (vezi mai sus) |
| `PATCH` | `/reviews/:id` | Editare recenzie proprie (în limita de timp) |
| `DELETE` | `/reviews/:id` | Ștergere (autor sau admin) |

#### Mesaje (chat)
| Metodă | Rută | Descriere |
|---|---|---|
| `GET` | `/conversations` | Conversațiile mele (cu ultimul mesaj și numărul de necitite) |
| `POST` | `/conversations` | Pornește conversație: `{ projectId, otherUserId }` (doar după interes/invitație) |
| `GET` | `/conversations/:id/messages` | Mesajele (paginat) |
| `POST` | `/conversations/:id/messages` | `{ content }` |
| `PATCH` | `/conversations/:id/read` | Marchează ca citite |

#### Notificări
| Metodă | Rută | Descriere |
|---|---|---|
| `GET` | `/notifications` | Lista; filtru `?unread=true` |
| `PATCH` | `/notifications/:id/read` | Marchează ca citită |
| `PATCH` | `/notifications/read-all` | Marchează toate |

#### Admin (doar `ADMIN`)
| Metodă | Rută | Descriere |
|---|---|---|
| `GET` | `/admin/users` | Lista utilizatorilor, filtre |
| `PATCH` | `/admin/users/:id` | Blocare / deblocare / schimbare rol |
| `GET` | `/admin/projects` | Toate proiectele |
| `DELETE` | `/admin/projects/:id` | Ștergere proiect |
| `GET` | `/admin/reports` | Raportări primite |
| `PATCH` | `/admin/reports/:id` | Rezolvare raportare |
| `GET` | `/admin/stats` | Statistici generale |

#### Raportări (abuz)
| Metodă | Rută | Descriere |
|---|---|---|
| `POST` | `/reports` | `{ targetType, targetId, reason }` — raportează un utilizator/proiect/mesaj |

### 5.5. Permisiuni (cine are voie la ce)

- Un **client** poate edita/șterge doar **proiectele lui**.
- Un **freelancer** poate edita doar **profilul și portofoliul lui**.
- Conversațiile și colaborările sunt vizibile **doar participanților**.
- Recenzia se poate lăsa doar după `COMPLETED` și o singură dată.
- Rutele `/admin/*` cer rolul `ADMIN`.
- Verificarea de proprietate se face **mereu în service**, nu doar în frontend.

---

## 6. BACKEND — Baza de date (Neon + Prisma)

**PostgreSQL pe Neon**, pentru că datele sunt relaționale (utilizatori ↔ proiecte ↔ potriviri ↔ colaborări ↔ recenzii) și avem nevoie de constrângeri de unicitate. **Prisma** definește schema și face migrările.

### 6.1. Diagrama relațiilor

```mermaid
erDiagram
  USER ||--o| FREELANCER_PROFILE : has
  USER ||--o| CLIENT_PROFILE : has
  USER ||--o{ PROJECT : posts
  CATEGORY ||--o{ PROJECT : groups
  CATEGORY ||--o{ SKILL : groups
  FREELANCER_PROFILE ||--o{ FREELANCER_SKILL : has
  SKILL ||--o{ FREELANCER_SKILL : "known by"
  PROJECT ||--o{ PROJECT_SKILL : requires
  SKILL ||--o{ PROJECT_SKILL : "required by"
  FREELANCER_PROFILE ||--o{ PORTFOLIO_ITEM : shows
  PROJECT ||--o{ MATCH : "is matched in"
  FREELANCER_PROFILE ||--o{ MATCH : "is matched in"
  MATCH ||--o| ENGAGEMENT : "becomes"
  ENGAGEMENT ||--o{ REVIEW : receives
  USER ||--o{ REVIEW : writes
  PROJECT ||--o{ CONVERSATION : "discussed in"
  CONVERSATION ||--o{ MESSAGE : contains
  USER ||--o{ MESSAGE : sends
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ REPORT : files
  USER ||--o{ REFRESH_TOKEN : owns
```

### 6.2. Ce reprezintă fiecare tabel

| Tabel | Rol |
|---|---|
| `User` | Contul (email, parolă hash, nume, rol, stare) |
| `RefreshToken` | Refresh token-uri valide (pentru logout/invalidare) |
| `FreelancerProfile` | Profilul freelancerului: titlu, bio, nivel, preț, disponibilitate |
| `ClientProfile` | Profilul clientului: tip, firmă, domeniu |
| `Category` | Categorii (Web, Design, Traduceri…) |
| `Skill` | Abilități (React, Logo design, Engleză…), legate de categorie |
| `FreelancerSkill` | Abilitatea unui freelancer + nivel + dovadă (test/portofoliu) |
| `Project` | Proiectul postat de client |
| `ProjectSkill` | Abilitățile cerute de proiect (introduse sau deduse) |
| `PortfolioItem` | Lucrări din portofoliul freelancerului |
| `Match` | Potrivirea proiect × freelancer, cu scor, explicație și stare |
| `Engagement` | Colaborarea efectivă (preț, termen, stare) |
| `Review` | Recenzia după colaborare |
| `Conversation` / `Message` | Chat |
| `Notification` | Notificări în site |
| `Report` | Raportări de abuz |

### 6.3. Schema Prisma (esențialul)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // adresa pooled de la Neon
  directUrl = env("DIRECT_URL")     // adresa directă, folosită la migrări
}

enum Role {
  CLIENT
  FREELANCER
  ADMIN
}

enum Level {
  BEGINNER
  JUNIOR
  MID
  SENIOR
}

enum Availability {
  AVAILABLE
  LIMITED
  UNAVAILABLE
}

enum ProjectStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CLOSED
}

enum MatchStatus {
  SUGGESTED
  FREELANCER_INTERESTED
  CLIENT_INVITED
  ACCEPTED
  DISMISSED
}

enum EngagementStatus {
  IN_PROGRESS
  DELIVERED
  COMPLETED
  CANCELLED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          Role
  avatarUrl     String?
  isBlocked     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  freelancerProfile FreelancerProfile?
  clientProfile     ClientProfile?
  projects          Project[]
  reviewsWritten    Review[]
  messages          Message[]
  notifications     Notification[]
  reports           Report[]
  refreshTokens     RefreshToken[]
  conversations     ConversationParticipant[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model FreelancerProfile {
  id           String       @id @default(cuid())
  userId       String       @unique
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  bio          String
  level        Level        @default(BEGINNER)
  hourlyRate   Int?                          // în EUR
  availability Availability @default(AVAILABLE)
  languages    String[]
  onboarded    Boolean      @default(false)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  skills    FreelancerSkill[]
  portfolio PortfolioItem[]
  matches   Match[]
}

model ClientProfile {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        String  @default("PERSON")     // PERSON | COMPANY
  companyName String?
  description String?
  industry    String?
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  skills   Skill[]
  projects Project[]
}

model Skill {
  id         String   @id @default(cuid())
  name       String   @unique
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  freelancers FreelancerSkill[]
  projects    ProjectSkill[]
}

model FreelancerSkill {
  freelancerId String
  skillId      String
  level        Level   @default(BEGINNER)
  verified     Boolean @default(false)      // test trecut sau portofoliu validat
  freelancer   FreelancerProfile @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  skill        Skill             @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([freelancerId, skillId])
}

model PortfolioItem {
  id           String   @id @default(cuid())
  freelancerId String
  freelancer   FreelancerProfile @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  imageUrl     String?
  link         String?
  createdAt    DateTime @default(now())
}

model Project {
  id          String        @id @default(cuid())
  clientId    String
  client      User          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  title       String
  description String
  categoryId  String
  category    Category      @relation(fields: [categoryId], references: [id])
  budgetMin   Int?
  budgetMax   Int?
  deadline    DateTime?
  status      ProjectStatus @default(OPEN)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  skills        ProjectSkill[]
  matches       Match[]
  conversations Conversation[]

  @@index([status, categoryId])
}

model ProjectSkill {
  projectId String
  skillId   String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  skill     Skill   @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([projectId, skillId])
}

model Match {
  id           String      @id @default(cuid())
  projectId    String
  freelancerId String
  project      Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  freelancer   FreelancerProfile @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  score        Float                              // 0–100
  reasons      Json                               // explicația: lista motivelor
  status       MatchStatus @default(SUGGESTED)
  dismissReason String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  engagement Engagement?

  @@unique([projectId, freelancerId])
  @@index([freelancerId, status])
  @@index([projectId, score])
}

model Engagement {
  id          String           @id @default(cuid())
  matchId     String           @unique
  match       Match            @relation(fields: [matchId], references: [id])
  agreedPrice Int
  deadline    DateTime?
  status      EngagementStatus @default(IN_PROGRESS)
  createdAt   DateTime         @default(now())
  completedAt DateTime?

  reviews Review[]
}

model Review {
  id           String     @id @default(cuid())
  engagementId String
  engagement   Engagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)
  authorId     String
  author       User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  targetUserId String
  rating       Int                                   // 1–5
  comment      String?
  createdAt    DateTime   @default(now())

  @@unique([engagementId, authorId])                 // o recenzie per participant
}

model Conversation {
  id           String   @id @default(cuid())
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  participants ConversationParticipant[]
  messages     Message[]
}

model ConversationParticipant {
  conversationId String
  userId         String
  lastReadAt     DateTime?
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([conversationId, userId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  senderId       String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content        String
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String                                   // NEW_MATCH, NEW_MESSAGE, INVITED...
  data      Json
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, isRead])
}

model Report {
  id         String   @id @default(cuid())
  reporterId String
  reporter   User     @relation(fields: [reporterId], references: [id], onDelete: Cascade)
  targetType String                                  // USER | PROJECT | MESSAGE
  targetId   String
  reason     String
  resolved   Boolean  @default(false)
  createdAt  DateTime @default(now())
}
```

### 6.4. Conectarea la Neon prin Prisma

1. Creezi un proiect pe [neon.tech](https://neon.tech) și copiezi **două** connection string-uri: **pooled** (are `-pooler` în host) și **direct**.
2. În `server/.env`:
   ```
   DATABASE_URL="postgresql://user:parola@ep-xxxx-pooler.eu-central-1.aws.neon.tech/fairmatch?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://user:parola@ep-xxxx.eu-central-1.aws.neon.tech/fairmatch?sslmode=require"
   ```
3. Instalare și prima migrare:
   ```bash
   npm install prisma @prisma/client
   npx prisma migrate dev --name init
   npx prisma generate
   node prisma/seed.js        # categorii, abilități, cont admin
   ```
4. `src/config/prisma.js` exportă **o singură instanță** `PrismaClient`, refolosită în toate service-urile.
5. Neon gratuit poate „adormi" baza după inactivitate → prima cerere poate dura 1–2 secunde. E normal.
6. **Nu** se modifică baza manual: orice schimbare de schemă = `schema.prisma` + migrare, comisă în git, ca toată echipa să fie sincronizată.
7. Vizualizare date: `npx prisma studio`.

---

## 7. Cum se unesc frontendul și backendul

```
┌──────────────────┐   HTTPS / JSON    ┌────────────────────┐   Prisma   ┌────────────────┐
│  React + Tailwind│ ────────────────► │  Express API       │ ─────────► │ PostgreSQL     │
│  (client/)       │ ◄──────────────── │  JWT, services     │ ◄───────── │ (Neon)         │
└──────────────────┘                   └─────────┬──────────┘            └────────────────┘
                                                 │
                                                 ▼
                                    Modulul de potrivire (secțiunea 9)
```

### 7.1. Reguli de legătură

- Frontendul vorbește cu backendul **doar prin API-ul din secțiunea 5**, nu direct cu baza de date.
- **Sursa de adevăr pentru contract** este acest README. Dacă se schimbă un endpoint, se actualizează întâi aici (într-un PR), apoi în cod.
- **CORS:** backendul permite doar originea frontendului (`CORS_ORIGIN`).
- **Autentificare:** frontendul păstrează access token-ul în memorie (store) și refresh token-ul într-un loc ales de echipă (vezi decizii deschise: cookie `httpOnly` este varianta mai sigură). La `401`, Axios cere `/auth/refresh` automat.
- **Nume de câmpuri:** `camelCase` peste tot (JSON, Prisma, JS).
- **Date:** ISO 8601 în UTC.
- **Erori:** frontendul afișează `error.message` din formatul unic de eroare.

### 7.2. Ce se întâmplă pe fluxul principal (exemplu)

1. Clientul completează `/projects/new` → `POST /projects`.
2. Backendul salvează proiectul și apelează **modulul de potrivire**, care calculează scorurile și creează înregistrări `Match` (status `SUGGESTED`).
3. Backendul creează notificări pentru freelancerii potriviți.
4. Frontendul redirecționează clientul la `/recommendations` → `GET /projects/:id/matches` → arată top freelanceri cu scor și „de ce".
5. Clientul apasă „Invită" → `POST /matches/:id/invite` → status `CLIENT_INVITED`, notificare către freelancer, se deschide conversația.
6. Se înțeleg în chat → `POST /engagements` → colaborarea începe.
7. La final → `PATCH /engagements/:id/status` (`COMPLETED`) → ambii lasă recenzii.

### 7.3. Variabile de mediu

`server/.env.example`
```
PORT=4000
NODE_ENV=development
DATABASE_URL=
DIRECT_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=20m
JWT_REFRESH_EXPIRES=14d
CORS_ORIGIN=http://localhost:5173
```

`client/.env.example`
```
VITE_API_URL=http://localhost:4000/api
```

### 7.4. Rulare locală

```bash
# Backend
cd server
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev            # http://localhost:4000

# Frontend
cd client
npm install
npm run dev            # http://localhost:5173
```

### 7.5. Deploy (când e momentul)

- **Frontend:** Vercel sau Netlify.
- **Backend:** Render, Railway sau Fly.io.
- **Bază de date:** Neon (deja online).
- Variabilele de mediu se setează în panoul fiecărui serviciu, **niciodată în git**.

---

## 8. Reguli de lucru în echipă

- **Git:** branch-uri `main` (stabil), `dev` (integrare), `feature/nume-functie`. Lucrăm în branch-uri, ajungem în `dev` prin Pull Request cu cel puțin o revizuire.
- **Commit-uri** scurte și clare (`feat: adaugă endpoint POST /projects`, `fix: ...`).
- **Împărțirea muncii:** frontend și backend pot lucra în paralel pe baza contractului din acest README (secțiunile 4 și 5). Backendul poate livra la început răspunsuri „mock", iar frontendul le poate folosi până sunt gata endpoint-urile reale.
- **Orice schimbare de API sau de schemă** se anunță echipei și se reflectă în README.
- **Documentare API:** opțional, se adaugă Swagger/OpenAPI generat din cod.
- **Fără secrete în git.** `.env` este în `.gitignore`.
- **Cod:** ESLint + Prettier cu aceeași configurare pentru toți.

---

## 9. Algoritmul de potrivire și AI

> Această secțiune descrie **ce trebuie să facă** sistemul, nu cu ce tehnologie se face. Tehnologia se alege ulterior; aici stabilim cerințele, intrările, ieșirile și regulile de echitate.

### 9.1. Rolul modulului

Primește un **proiect** și o mulțime de **profiluri de freelanceri** (și invers) și returnează o **listă ordonată de potriviri**, fiecare cu:
- `score` (0–100),
- `reasons` (explicația pe înțelesul omului: „are experiență în React și are 3 lucrări similare în portofoliu, prețul se încadrează în buget"),
- semnale de încredere (ex. „abilitate verificată").

Modulul stă în `server/src/services/matching/` și se apelează din controllere prin funcții clare (`matchFreelancersForProject(projectId)`, `matchProjectsForFreelancer(freelancerId)`), astfel încât implementarea să poată fi înlocuită fără să se schimbe restul aplicației.

### 9.2. Ce trebuie să facă (cerințe)

**A. Înțelegerea proiectului**
- Clientul scrie **liber** ce vrea. Sistemul trebuie să extragă: categorie, abilități necesare, dimensiunea proiectului (mic/mediu/mare), buget, termen, nivel de experiență necesar.
- Dacă datele lipsesc sau sunt neclare, sistemul le **deduce** și le arată clientului pentru confirmare, sau pune 1–2 întrebări scurte de clarificare.

**B. Înțelegerea freelancerului**
- Din profil și portofoliu: ce știe de fapt (nu doar ce a bifat), la ce nivel, ce tip de proiecte a făcut.
- Pentru începători, portofoliul și testele **contează mai mult decât istoricul**.

**C. Calculul potrivirii** — pe mai multe criterii (vezi 9.3).

**D. Explicarea rezultatului**
- Fiecare recomandare are o explicație clară. Fără explicații, utilizatorul nu are încredere și nu înțelege de ce a fost ales cineva.

**E. Echitate și diversitate** (vezi 9.4).

**F. Învățare din feedback** (vezi 9.6).

### 9.3. Criteriile de potrivire (versiune de pornire)

Scorul final este o combinație ponderată. Ponderile de mai jos sunt **valori de plecare** și se ajustează pe baza datelor reale.

| Criteriu | Pondere inițială | Ce măsoară |
|---|---|---|
| Potrivirea abilităților | 35% | Câte din abilitățile cerute le are freelancerul și la ce nivel |
| Dovezi de competență | 20% | Portofoliu relevant, abilități verificate (teste), lucrări similare |
| Buget și preț | 15% | Cât se încadrează tariful în bugetul proiectului |
| Disponibilitate și termen | 10% | Poate livra la termen? Este disponibil? |
| Potrivirea nivelului | 10% | Nivelul se potrivește cu complexitatea proiectului (nu trimitem începători pe proiecte critice, nici seniori pe proiecte foarte mici) |
| Încredere (recenzii) | 5% | Recenziile, dar cu **pondere mică și plafonată**, ca să nu domine |
| Altele | 5% | Limbă, fus orar, răspunsuri rapide |

**Reguli dure (filtre eliminatorii):** freelancer indisponibil, abilitate esențială lipsă, preț mult peste buget, cont blocat.

### 9.4. Mecanisme de echitate (esența produsului)

1. **Recenziile au plafon.** După un anumit număr de recenzii (ex. 10), contribuția lor la scor nu mai crește. Cineva cu 500 de recenzii nu are avantaj față de cineva cu 10.
2. **Începătorii nu sunt penalizați pentru lipsa istoricului.** Lipsa recenziilor nu scade scorul; se compensează cu portofoliu și teste.
3. **Expunere minimă garantată.** Fiecare freelancer activ și potrivit apare periodic în recomandări, ca nimeni să nu rămână invizibil.
4. **Slot de explorare.** În lista de top (ex. 5 recomandări), cel puțin 1–2 locuri sunt rezervate pentru freelanceri noi sau cu puțină expunere, dar **doar dacă depășesc un prag minim de potrivire**.
5. **Distribuție echilibrată.** Sistemul evită ca aceiași 3–5 freelanceri să primească toate propunerile; limitează numărul de recomandări active simultan pe freelancer.
6. **Proiecte de start.** Proiectele mici, cu risc redus, sunt direcționate preferențial către începători.
7. **Fără criterii sensibile.** Nu se folosesc date precum gen, vârstă, naționalitate, etnie, poză. Algoritmul se verifică periodic pentru efecte de discriminare.

### 9.5. Cum dovedește un începător ce știe (problema grea)

- **Portofoliu:** lucrări încărcate, cu descriere; evaluate de sistem pentru relevanță și, în unele cazuri, verificate de moderator.
- **Mini-teste de competență:** scurte, pe abilitate; trecerea marchează abilitatea ca `verified`.
- **Proiect-probă mic:** o sarcină mică, cu preț mic, care generează primele recenzii.
- **Garanții pentru client:** primele proiecte ale începătorilor pot avea garanții (ex. plată în etape, posibilitate de refacere), pentru a reduce riscul perceput.

### 9.6. Feedback și îmbunătățire

Sistemul colectează semnale și le folosește pentru a ajusta ponderile:
- recomandare **acceptată** (interes/invitație) vs. **ignorată/ascunsă** (`dismiss` cu motiv),
- **colaborare reușită** (finalizată, recenzie bună) vs. eșuată,
- timp până la prima propunere acceptată.

### 9.7. Cerințe non-funcționale

- **Explicabil:** orice scor trebuie să poată fi justificat.
- **Rapid:** recomandările pentru un proiect nou apar în câteva secunde (poate rula asincron; frontendul afișează „căutăm potriviri…").
- **Testabil:** set de cazuri de test (proiecte + freelanceri) cu rezultate așteptate.
- **Reproductibil:** aceeași intrare dă același rezultat (în afară de componenta de explorare, care e controlată și logată).
- **Respectă confidențialitatea:** nu expune date private ale utilizatorilor în explicații.
- **Înlocuibil:** interfața modulului rămâne stabilă chiar dacă implementarea se schimbă.

### 9.8. Metrici de succes

- Timp mediu până la prima potrivire acceptată
- Procent de recomandări acceptate
- Procent de freelanceri noi care primesc cel puțin o propunere în 7 zile
- Concentrarea expunerii (cât din propuneri merg la top 10% dintre freelanceri)
- Satisfacția clienților după colaborare

### 9.9. Ce NU se decide acum

- Tehnologia concretă (reguli simple, embeddings, model de limbaj etc.)
- Furnizorul de AI și costurile
- Metoda exactă pentru teste și verificarea portofoliului

> Recomandare de proces: pornim cu o **versiune pe reguli** (formula din 9.3), care e previzibilă și ușor de testat; AI-ul adevărat se adaugă după ce avem utilizatori și date.

---

## 10. Plan de lucru pe faze

### Faza 0 — Fundația
- [ ] Structura `client/` + `server/`, repo Git, convenții
- [ ] Express cu `/api/health`
- [ ] Proiect Neon creat, Prisma conectat, prima migrare
- [ ] React + Vite + Tailwind, rutare de bază
- [ ] Nume final, logo, paletă de culori

### Faza 1 — Conturi și profiluri
- [ ] Modele `User`, `FreelancerProfile`, `ClientProfile`, `Category`, `Skill`
- [ ] `/auth/*`, `/users/me`, `/freelancers/me`, `/clients/me`, `/categories`, `/skills`
- [ ] Pagini: Landing, Login, Register, Onboarding, ProfileEdit, FreelancerProfile
- [ ] `ProtectedRoute` și roluri

### Faza 2 — Proiecte și căutare manuală
- [ ] Modele `Project`, `ProjectSkill`, `PortfolioItem`
- [ ] CRUD `/projects`, portofoliu, `/freelancers` (căutare)
- [ ] Pagini: ProjectNew, MyProjects, ProjectDetail, Browse

### Faza 3 — Potrivirea *(inima aplicației)*
- [ ] Modelul `Match`
- [ ] Modulul de potrivire, versiunea pe reguli (secțiunea 9)
- [ ] `/projects/:id/matches`, `/matches/*`
- [ ] Pagina Recommendations (scor + „de ce")
- [ ] Mecanisme de echitate (plafon recenzii, slot de explorare)
- [ ] Teste unitare pentru algoritm

### Faza 4 — Colaborare și comunicare
- [ ] Modele `Engagement`, `Review`, `Conversation`, `Message`, `Notification`
- [ ] Endpoint-uri pentru colaborări, recenzii, chat, notificări
- [ ] Pagini: Engagements, Messages, Notifications

### Faza 5 — Siguranță și administrare
- [ ] `Report`, panou admin, moderare
- [ ] Rate limiting, validări complete, ștergere cont
- [ ] Politică de confidențialitate, termeni și condiții

### Faza 6 — Încredere și lansare
- [ ] Mini-teste, insigne, proiecte de start
- [ ] Deploy (frontend, backend), domeniu, HTTPS
- [ ] Lansare cu primii utilizatori (vezi marketing)

### Faza 7 — După lansare
- [ ] Plăți și escrow, notificări email
- [ ] AI avansat pentru potrivire
- [ ] Aplicație mobilă

---

## 11. Marketing

### 11.1. Mesaj principal
- **Slogan:** „Nu cel mai cunoscut. Cel mai potrivit."
- **Pentru freelanceri:** „Primești proiecte potrivite pentru tine, chiar dacă abia începi."
- **Pentru clienți:** „Spune ce ai nevoie. Îți găsim noi omul potrivit."

### 11.2. Problema „cold start" (cea mai mare provocare)
Platforma are nevoie de ambele părți. Soluția: **pornim pe o singură parte, într-o nișă îngustă**.

1. **Alegem o nișă de pornire** (ex. site-uri și design pentru afaceri mici dintr-o regiune/țară).
2. **Strângem întâi freelanceri începători** (studenți, școli, colegi, comunități locale). Ei vin ușor pentru că primesc clienți gratis.
3. **Aducem primii clienți manual** (afaceri mici din jur, cunoscuți). Primele potriviri le validăm noi, manual, cu ajutorul algoritmului.
4. **Automatizăm** după ce vedem că funcționează.

### 11.3. Canale
- **Comunități de studenți și tineri:** grupuri Telegram, Facebook, Discord, Instagram, TikTok.
- **Școli, licee și universități:** parteneriate cu cadre didactice și cluburi.
- **Afaceri mici locale:** contact direct (frizerii, restaurante, saloane, magazine).
- **Conținut:** povești reale („cum a primit X primul client"), tutoriale, „before/after" de proiecte.
- **SEO:** pagini pentru „freelancer pentru site restaurant", „grafician pentru logo" etc.
- **Recomandări (referral):** bonus pentru cine aduce un client sau un freelancer.
- **Lansări pe platforme de start-up-uri:** Product Hunt, comunități de dezvoltatori.

### 11.4. Pași de lansare
1. **Pre-lansare:** pagină de așteptare (waitlist) cu email.
2. **Beta închis:** 20–30 freelanceri + 10–20 clienți, feedback săptămânal.
3. **Lansare publică în nișa aleasă.**
4. **Extindere pe categorii și regiuni.**

### 11.5. Indicatori de urmărit
- Număr de freelanceri și clienți activi
- Raportul client/freelancer (să nu fie dezechilibrat)
- Rata de potriviri acceptate
- Timpul până la primul proiect finalizat al unui începător
- Costul de aducere a unui utilizator

---

## 12. Monetizare

> Notă: în faza de început, banii nu sunt prioritatea; prioritatea este să funcționeze potrivirea și să avem utilizatori. Mai jos sunt opțiunile pentru mai târziu.

| Model | Cum funcționează | Avantaje | Riscuri |
|---|---|---|---|
| **Comision din proiect** (5–10%) | Se reține un procent din suma plătită prin platformă | Câștigi doar când câștigă și utilizatorii; simplu de explicat | Utilizatorii se pot înțelege în afara platformei |
| **Taxă pentru client la potrivire** | O sumă mică (ex. 2–5 €) când clientul invită/angajează | Venit predictibil | Poate descuraja clienții noi |
| **Abonament freelancer (premium)** | Funcții extra: mai multe propuneri, statistici, insigne, profil evidențiat | Venit recurent | **Atenție:** nu trebuie să cumpere avantaj în scorul de potrivire, altfel se pierde ideea de echitate |
| **Abonament client / firme** | Proiecte nelimitate, suport, rapoarte | Pentru afaceri cu nevoi frecvente | Necesită bază de clienți |
| **Servicii de verificare** | Taxă mică pentru teste certificate / verificare de portofoliu | Util începătorilor | Trebuie să rămână accesibil |
| **Pachete pentru școli / universități** | Licență pentru instituții care vor să-și ajute studenții | Venit stabil, impact social | Ciclu lung de vânzare |
| **Parteneriate și sponsorizări** | Instrumente, cursuri, platforme de plată | Venit suplimentar | Trebuie să nu afecteze neutralitatea |

### Principiu esențial
**Banii nu pot cumpăra poziția în potrivire.** Dacă un freelancer plătit apare mai sus decât unul mai potrivit, produsul își pierde diferențiatorul. Planurile premium oferă *unelte* (statistici, mai multe propuneri trimise, insigne), nu *avantaj în clasament*.

### Recomandare de pornire
1. **Gratuit** la început pentru ambele părți (ca să rezolvăm cold start).
2. **Comision mic din proiect** când adăugăm plățile prin platformă.
3. **Premium** pentru freelanceri și firme, după ce există tracțiune.

### Aspecte legale de verificat înainte de plăți
- Reguli pentru procesarea plăților (furnizor de plăți autorizat, de ex. Stripe)
- Taxe și facturare
- Termeni și condiții, politică de confidențialitate, GDPR
- Raportarea veniturilor freelancerilor (după țară)

---

## 13. Riscuri și decizii deschise

### Riscuri
| Risc | Cum îl reducem |
|---|---|
| **Cold start** (fără freelanceri/clienți nu are valoare) | Nișă îngustă, pornire pe o parte, matching manual la început |
| **Calitate inegală la începători** | Mini-teste, portofoliu, proiecte de start, garanții pentru client |
| **Ocolirea platformei** (se înțeleg în afară) | Valoare reală în platformă (plăți sigure, recenzii, protecție), comision rezonabil |
| **Abuz și înșelătorii** | Moderare, raportări, verificare, rate limiting |
| **Potrivire proastă la început** (puține date) | Versiune pe reguli, explicații, feedback rapid |
| **Responsabilitate legală la plăți** | Furnizor autorizat, termeni clari, consultanță juridică |

### Decizii deschise
1. **Numele final** al platformei și disponibilitatea domeniului.
2. **Nișa de pornire** (ce categorie și ce regiune).
3. **Un utilizator poate fi și client, și freelancer?** (Simplu: un singur rol per cont; flexibil: ambele profiluri pe același cont.)
4. **Stocarea imaginilor de portofoliu** (Cloudinary, S3, Supabase Storage etc.).
5. **Unde se păstrează refresh token-ul** (cookie `httpOnly` — mai sigur — sau în `localStorage`).
6. **Chat în timp real:** polling (simplu, la început) sau WebSocket/Socket.IO.
7. **Limba site-ului:** RO, EN sau ambele (i18n).
8. **Cum se verifică portofoliul și testele** (manual, automat, mixt).
9. **Tehnologia pentru algoritm / AI** (secțiunea 9.9).
10. **Modelul de bani** și momentul introducerii (secțiunea 12).

---

*Acest README este sursa de adevăr a proiectului. Orice schimbare de funcționalitate, rută API sau schemă de bază de date se reflectă aici înainte (sau odată) cu schimbarea în cod.*
