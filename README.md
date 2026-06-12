# Registro Attrezzature con QR — Di Curzio Hospitality

Sito web autonomo per il censimento delle attrezzature tecniche e di
manutenzione delle 5 strutture, con etichette QR su ogni bene.

- **`/asset/:code`** — pagina pubblica (apertura via scansione QR): chiunque
  può vedere nome, struttura, ubicazione, stato del bene e **segnalare un
  guasto**, senza login.
- **`/attrezzature`** — pannello di gestione riservato allo staff (login
  richiesto): elenco completo, filtri, aggiunta/modifica beni, storico
  interventi, generazione etichette.
- **`/etichette`** — generazione e stampa dei QR per i beni selezionati
  (riservato allo staff).

## 1. Crea il nuovo progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → **New project** (nome
   suggerito: `dicurzio-attrezzature`).
2. Una volta creato, apri **SQL Editor** → incolla ed esegui interamente il
   file `schema.sql` di questo progetto. Crea tabelle, categorie
   pre-caricate, vista e tutte le policy di sicurezza.
3. Vai su **Project Settings → API** e copia:
   - `Project URL`
   - `anon public` key

## 2. Crea gli utenti staff

In **Authentication → Users → Add user**, crea un account per ciascuna
persona che deve gestire il registro (es. te stesso, responsabile
manutenzione). Imposta email + password.

Consigliato: in **Authentication → Providers → Email**, disattiva
"Allow new users to sign up" così solo gli account creati manualmente
possono accedere — il sito pubblico resta comunque accessibile per le
segnalazioni guasti (non richiede login).

## 3. Configurazione locale

```bash
cd registro-attrezzature
npm install
cp .env.example .env
```

Apri `.env` e inserisci:

```
VITE_SUPABASE_URL=<Project URL del tuo progetto Supabase>
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_APP_BASE_URL=https://attrezzature.dicurziohospitality.it
```

Avvia in locale:

```bash
npm run dev
```

Apri `http://localhost:5173`, fai login con uno degli utenti creati al punto
2, e inizia a censire le attrezzature da "Nuovo bene".

## 4. Deploy su Cloudflare Pages

1. Crea un repository (GitHub/GitLab) con questo codice, oppure usa
   `npx wrangler pages deploy dist` per un deploy diretto.
2. Su Cloudflare Pages:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. In **Settings → Environment variables**, aggiungi le stesse tre variabili
   del file `.env` (sia in Production che Preview).
4. Pubblica. Una volta noto il dominio definitivo, aggiorna
   `VITE_APP_BASE_URL` con l'URL reale e rifai il deploy: è il valore
   codificato in ogni QR generato successivamente. Conviene fissare il
   dominio definitivo prima di stampare le etichette in massa, perché i QR
   già stampati continuano a puntare all'URL con cui sono stati generati.

Se hai un dominio personalizzato, collegalo in **Custom domains** su
Cloudflare Pages.

## 5. Flusso operativo

1. **Censimento iniziale**: per ogni struttura, percorri gli impianti
   tecnici (centrale termica, quadri elettrici, UTA/condizionatori,
   ascensori, antincendio, gruppi piscina, lavanderia, cucina, gruppo
   elettrogeno) e crea un bene da "Nuovo bene" in `/attrezzature`. Ogni bene
   riceve automaticamente un codice QR univoco.

2. **Stampa etichette**: seleziona i beni con le checkbox → "Etichette (n)"
   → `/etichette` → stampa. Per etichette adesive resistenti
   (poliestere/vinile per centrali termiche e lavanderie), adatta
   `grid-template-columns` in `QRLabelSheet.jsx` al formato del foglio.

3. **Applicazione**: il personale tecnico applica ogni etichetta sul
   relativo bene, in posizione visibile.

4. **Uso quotidiano**:
   - **Chiunque** (anche senza account, es. cameriera, manutentore esterno)
     inquadra il QR → vede nome, struttura, ubicazione, stato → può
     "Segnalare un guasto" con descrizione e nome di chi segnala.
   - **Lo staff autenticato**, scansionando lo stesso QR da loggato, vede
     anche marca/modello, matricola, prossima manutenzione, storico
     completo, e può "Registrare un intervento" (ordinaria, straordinaria,
     controllo) che aggiorna automaticamente data ultima manutenzione e
     ripristina lo stato a "Operativo".

5. **Pianificazione**: il campo "Prossima manutenzione" su ogni bene
   permette di programmare controlli periodici (estintori, caldaie,
   ascensori, ecc.), filtrabile in `/attrezzature`.

## 6. Sicurezza dei dati

- Le segnalazioni pubbliche di guasto sono le uniche scritture consentite
  senza login (policy `Public report fault`, solo `type = 'guasto'`).
- Nessun dato sensibile (matricole, marche, storico costi) è visibile a chi
  non è autenticato.
- Per aggiungere altri utenti staff in futuro, ripeti il punto 2.

## 7. Estendere il progetto

- **Foto dei beni**: il campo `photo_url` in `assets` è già previsto. Per
  caricare immagini, attiva Storage su Supabase, crea un bucket
  `asset-photos` con policy di lettura pubblica/scrittura staff, e aggiungi
  un componente di upload nel form (`AssetFormModal` in
  `AssetRegistry.jsx`).
- **Notifiche guasti**: per essere avvisato via email/Telegram quando arriva
  una segnalazione, puoi creare un Database Webhook su Supabase collegato a
  un trigger `after insert` su `asset_maintenance_log` con
  `type = 'guasto'`.
- **Nuove categorie**: aggiungibili direttamente in tabella
  `asset_categories` dal Table Editor di Supabase, scegliendo un'icona tra
  quelle mappate in `ICONS` (`AssetRegistry.jsx`).


  
