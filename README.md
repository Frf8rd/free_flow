# FairMatch

## Contul de administrator

Creează contul admin din terminalul serverului după ce ai configurat `DATABASE_URL` în `server/.env` și ai aplicat migrările:

```powershell
cd server
npm run admin:create
```

Comanda cere interactiv emailul, numele și parola (minimum 12 caractere); parola nu este afișată și nu se salvează în `.env`. Folosește o parolă unică și păstreaz-o într-un manager de parole. Emailul este adăugat în tabelul `Admin`, iar utilizatorul și intrarea allowlist sunt create într-o tranzacție. Conturile existente nu sunt promovate; dacă emailul este deja folosit, provisionarea se oprește.

Autentificarea admin se face din workspace cu emailul și parola create. La login, refresh și fiecare cerere autentificată, serverul verifică emailurile utilizatorilor cu rol `ADMIN` față de tabelul `Admin`; scoaterea emailului din tabel revocă accesul admin fără să aștepte expirarea tokenului. Înregistrarea publică și crearea contului prin Google/Apple acceptă doar rolurile `CLIENT` și `FREELANCER`; rolul din allowlist singur nu promovează conturile existente.
