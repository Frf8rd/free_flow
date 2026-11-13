# FairMatch

## Conturi și autentificare

Serverul folosește PostgreSQL pe Neon și Prisma. În `server/.env`, setează `DATABASE_URL`, un `JWT_SECRET` aleatoriu de minimum 32 de octeți și, pentru autentificare socială, identificatorii OAuth:

```env
GOOGLE_CLIENT_ID=...
APPLE_CLIENT_ID=...
```

În Google Cloud Console creează un OAuth Client ID de tip Web și adaugă origin-ul workspace-ului la JavaScript origins. În Apple Developer configurează Sign in with Apple, un Services ID, domeniul și Return URL-ul folosit de workspace. Client ID-urile sunt publice; cheia privată Apple nu este necesară pentru acest flux bazat pe identity token.

Configurează aceleași Client ID-uri în `client-test/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=...
VITE_APPLE_CLIENT_ID=...
VITE_APPLE_REDIRECT_URI=http://localhost:5173
```

Nu include parole, chei private sau secrete OAuth în variabilele `VITE_*`; acestea ajung în browser.

Pornește serverul:

```powershell
cd server
npm run db:generate
npx prisma migrate deploy
npm run dev
```

În alt terminal pornește workspace-ul:

```powershell
cd client-test
npm run dev
```

Workspace-ul permite înregistrare și login cu email/parolă, Google sau Apple, alegerea rolului `CLIENT`/`FREELANCER` la crearea contului, reîmprospătarea sesiunii și logout. Rolul `ADMIN` nu poate fi ales public. Sesiunile sunt păstrate numai în memoria paginii.

Tokenurile Google și Apple sunt verificate server-side cu cheile publice ale furnizorilor, issuer, audience, expirare, email verificat și nonce de unică folosință. Refresh token-urile platformei sunt aleatorii și stocate hash-uit. Un email existent nu este asociat automat cu un cont social; utilizatorul trebuie mai întâi să se autentifice cu metoda existentă.

Rutele `GET /api/access/client`, `GET /api/access/freelancer` și `GET /api/access/admin` cer autentificare și rolul corespunzător; workspace-ul le poate folosi pentru a testa răspunsurile `200`/`403`.

Modelele aplicației sunt numai `User`, `RefreshToken`, `OAuthAccount` și `OAuthChallenge`. Rutele și modelele de profil au fost eliminate. Migrările istorice care au creat/șters tabele de profil se păstrează pentru consistența istoricului Prisma.

Teste: `cd server; npm test`. Generare Prisma: `cd server; npm run db:generate`.
