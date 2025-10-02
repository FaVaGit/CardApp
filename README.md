# 🎮 CardApp - Gioco della Complicità

<!-- CI Badges -->
![Unit Tests](https://github.com/FaVaGit/CardApp/actions/workflows/ci-unit.yml/badge.svg?branch=Evolution)
![E2E Tests](https://github.com/FaVaGit/CardApp/actions/workflows/ci-e2e.yml/badge.svg?branch=Evolution)
<!-- If Codecov is enabled add: -->
![Coverage](https://img.shields.io/badge/coverage-11.3%25-blue?style=flat)

A modern card game application built with **Event-Driven Architecture** using React, ASP.NET Core, and RabbitMQ. Designed for couples to strengthen their relationship through meaningful conversation prompts.

## ✨ Features

- 🔐 **Registrazione / Login con Password**: Account locale con hashing PBKDF2 (salt univoco, nessuna password in chiaro)
- 🎯 **Single Player Mode**: Esperienza personale di pesca carte
- 👥 **Couple Mode (richiesta / approvazione)**: Accoppiamento esplicito con auto‑start sessione
- ⚡ **Partner Sync Immediato**: `respond-join` ora restituisce direttamente `partnerInfo` evitando attese
- 🎴 **Card Sharing Sincronizzato**: Stato carte condivise in snapshot (storico `sharedCards`)
- 🎲 **150+ Carte Conversazione**: Prompt curati in italiano
- 🔄 **Eventi Real-time / Polling Resiliente**: RabbitMQ (o polling snapshot come fallback)
- 🩺 **Diagnostica Sync Partner**: Evento `partnerSyncDelay` dopo 3 poll se partner mancante
- 🧪 **Test Integrazione Automatizzati**: Suite Vitest per flussi coppia e pesca carta
- 🎨 **Modern UI con MUI + Fabric.js**: Layout responsive, AppBar, Drawer log, canvas animato per carte
- 📱 **Responsive Design**: Mobile & Desktop
- 🏗️ **Architettura Moderna**: Separation of concerns, fallback sicuri
 - 🌗 **Dark Mode Toggle**: Tema scuro persistente via localStorage

## 🔐 Sicurezza & Password
Le credenziali sono gestite solo lato browser (modalità prototipo):
| Aspetto | Implementazione |
|---------|-----------------|
| Hashing | PBKDF2 SHA-256 120k iterazioni |
| Salt | Generato per-account (16 byte) |
| Storage | `localStorage` (hash + salt + metadati utente) |
| Trasmissione | Nessun invio password al backend attuale |

Limitazioni attuali:
- Nessun recupero password / reset
- Nessun rate limiting locale
- Sessione legata al browser (no multi-device persistente)

Per produzione migrare a backend con Argon2id / scrypt, sessioni firmate e rotazione token.

## 🌗 Tema & Modalità Scura
Il toggle (icona sole/luna) consente di passare fra light e dark mode.
Caratteristiche:
- Persistenza in `localStorage['complicity_color_mode']`
- Palette ottimizzata per contrasto su sfumature viola/rosa
- Canvas Fabric rianima la carta mantenendo centratura in entrambi i temi
- Componenti MUI reattivi alla palette (background/paper/primary/secondary)

## 🏗️ Architecture

**Event-Driven with RabbitMQ**
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: ASP.NET Core 8 Web API
- **Database**: SQLite with Entity Framework Core
- **Events**: RabbitMQ for real-time communication
- **State Management**: Event sourcing pattern

## 📁 Project Structure

- `window.__apiService` esposto solo per scenari E2E (usato per impostare TTL e leggere metriche senza click UI fragili).
- Assert "soft" su formazione coppia / partner name: se il backend è lento non falliscono, ma loggano un messaggio informativo.
- Flag ambiente supportati:
   - `E2E_VERBOSE=1` abilita la stampa del frammento HTML post autenticazione.
   - `STRICT_COUPLE_ASSERT=1` rende nuovamente obbligatorie le asserzioni sulla coppia/partner (usa helper `assertStrict`).
   - `VITE_E2E=1` (build-time) abilita l'esposizione di `window.__apiService`.

Esempio esecuzione verbosa:

```bash
E2E_VERBOSE=1 npm run test:e2e
```

Per esecuzione silenziosa (CI):

```bash
npm run test:e2e
```

Nota: l'esposizione di `window.__apiService` è pensata unicamente per test end‑to‑end; evitare di farvi affidamento nel codice di produzione.
```
CardApp/
├── 🎯 Core Application
│   ├── src/                          # Clean, modern React frontend
│   │   ├── main.jsx                  # App entry point
│   │   ├── SimpleApp.jsx             # Main application orchestrator
│   │   ├── SimpleAuth.jsx            # User authentication
│   │   ├── SimpleCardGame.jsx        # Single player game
│   │   ├── CoupleGame.jsx            # Couple/partner game
│   │   ├── EventDrivenApiService.js  # API communication layer
│   │   ├── expandedCards.js          # Card deck data
│   │   └── familyCards.js            # Family-friendly cards
│   │
│   ├── Backend/ComplicityGame.Api/   # ASP.NET Core Web API
│   │   ├── Controllers/              # REST API endpoints
│   │   │   └── EventDrivenGameController.cs
│   │   ├── Services/                 # Business logic layer
│   │   │   ├── UserPresenceService.cs
│   │   │   ├── CoupleMatchingService.cs
│   │   │   ├── GameSessionService.cs
│   │   │   └── RabbitMQEventPublisher.cs
│   │   ├── Models/                   # Data models and entities
│   │   ├── Events/                   # RabbitMQ event system
│   │   └── Data/                     # Database context (SQLite)
│   │
├── 🛠️ Development Tools
│   ├── start.sh                      # Start complete application
│   ├── stop.sh                       # Stop all services
│   ├── test-all.sh                   # Comprehensive test suite
│   ├── test-partner-matching.sh      # Partner matching tests
│   │
├── 📦 Configuration
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.js               # Vite build configuration
│   └── .github/copilot-instructions.md
│
└── 📚 Documentation
    ├── README.md                     # This file
    ├── SCRIPTS.md                    # Scripts documentation
    └── archive/                      # Legacy files (cleaned up)
```

## 🚀 Quick Start

### Prerequisiti
- Node.js 20.19.0+ (consigliato via `.nvmrc` / `nvm use`)
- .NET 8 SDK
- SQLite
- (Opzionale) RabbitMQ se si abilita la messaggistica reale (il polling snapshot è fallback)

### Installation & Startup

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd CardApp
   npm install
   ```

2. **Start the application**:
   ```bash
   ./start.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Single Player Mode
1. Open http://localhost:5173
2. Enter your name and select "Gioco Singolo"
3. Start drawing cards and enjoy!

### Modalità Coppia (Flusso con approvazione richiesta)
Flusso moderno (request / approve) implementato per evitare accoppiamenti involontari:
1. Entrambi gli utenti si connettono ("Gioco di Coppia").
2. L'utente A preme "Richiedi" accanto al nome di B.
3. B vede un badge "Richiesta per te" e i pulsanti `Accetta` / `Rifiuta`.
4. Se B accetta:
   - La richiesta viene rimossa da entrambi i lati.
   - Si crea (o completa) la coppia.
   - Se la coppia ha due membri il sistema avvia automaticamente una Game Session.
5. Se B rifiuta: la richiesta scompare, nessuna coppia viene creata.
6. A può anche `Annulla` prima della risposta di B.

Note tecniche:
- Le richieste pendono per 10 minuti prima di scadere (expire) automaticamente.
- Optimistic UI: A vede subito lo stato "In attesa" senza attendere il polling.
- Se una richiesta viene approvata vengono ripulite eventuali richieste incrociate residue.

#### Documentazione dettagliata Join Requests
Per dettagli su caching locale, flag `_optimistic` e riconciliazione snapshot consultare il file `JOIN_REQUESTS.md`.

## 🧪 Testing

### Layering (Core vs API)
Per velocizzare e rendere più stabili i test di dominio è stato introdotto un progetto `ComplicityGame.Core` che contiene:
- Modelli minimi (`User`, `Couple`, `CoupleUser`) e `GameDbContext` con configurazione EF.
- Eventi di base per la coppia (`CoupleCreated`, `CoupleCompleted`, `CoupleDisconnection`).
- `CoupleMatchingService` e relative interfacce semplificate.

I test unitari ora referenziano solo `ComplicityGame.Core`, evitando dipendenze runtime superflue (Swagger, RabbitMQ, SQLite native), con esecuzione più rapida e isolamento maggiore. L'API continua a poter evolvere (controller, presenza utenti, sessioni di gioco) senza appesantire il ciclo TDD sul servizio di matching.


### Tipologie di test
| Livello | Strumento | Percorso | Cosa valida |
|---------|-----------|----------|-------------|
| Integrazione API (JS) | Vitest | `tests/integration/*.test.js` | Coppia, sessione, sync partner, pesca carta |
| Shell integration | bash + curl + jq | `tests/*.test.sh` | Flussi API legacy (approve / reject / cancel) |
| End‑to‑End UI | Playwright | `tests/e2e/*.spec.js` | Interazioni reali browser (richiesta, accetta, rifiuta, annulla, reconnect) |

### Esecuzione rapida
```bash
# Test unit frontend
npm run test:unit

# Test integrazione (avvia backend + frontend e lancia Vitest integration)
npm run test:integration

# Test shell (flussi base)
./test-all.sh

# Test E2E Playwright
npx playwright test
```

Per generare il report HTML Playwright:
```bash
npx playwright show-report
```

### Politica sui selettori E2E
Sono stati introdotti `data-testid` in `UserDirectory.jsx` per ridurre la fragilità:
- `incoming-request-badge`
- `send-request`
- `accept-request`
- `reject-request`
- `cancel-request`

### Troubleshooting
- Messaggio `Please upgrade your Node.js version`: assicurati di usare `nvm use` (20.19.0+).
- Se i test E2E trovano molti utenti "fantasma", l'endpoint `POST /api/admin/clear-users` può pulire lo stato.
- Flakiness ridotta aggiungendo polling con `expect.poll` e testids stabili.

## 🎯 API Endpoints

### Core Game & Join Workflow API
- `POST /api/EventDrivenGame/connect` - Connessione utente
- `POST /api/EventDrivenGame/reconnect` - Riconnessione con auth token
- `GET  /api/EventDrivenGame/available-users/{userId}` - Lista utenti disponibili (esclude self)
- `POST /api/EventDrivenGame/request-join` - Crea richiesta join (A->B)
- `POST /api/EventDrivenGame/respond-join` - Approvazione / rifiuto richiesta (B risponde) → ora ritorna anche `partnerInfo` e `gameSession`
- `POST /api/EventDrivenGame/cancel-join` - Annulla richiesta in pending (A)
- `GET  /api/EventDrivenGame/join-requests/{userId}` - Incoming / outgoing requests
- `GET  /api/EventDrivenGame/snapshot/{userId}` - Snapshot aggregato (users + requests + stato + sessione)
- `POST /api/EventDrivenGame/start-game` - Avvio manuale game (fallback se non auto)
- `POST /api/EventDrivenGame/draw-card` - Pesca carta

### Admin / Utility API
- `POST /api/admin/clear-users` - Pulisce utenti, coppie, sessioni (usato nei test)
- `POST /api/admin/reset-system` - Alias di reset completo
- `POST /api/admin/force-refresh` - Segnale soft di refresh (no-op logico)
- `POST /api/admin/seed-test-cards` - Inserisce carte di test
- `GET  /api/admin/cards-status` - Stato deck carte
- `GET  /api/health` - Health check

## 🎮 Game Flow

### Single Player
1. **Connect** → User authentication and setup
2. **Select Game Type** → Choose "Single Player"
3. **Draw Cards** → Get conversation prompts
4. **Enjoy** → Reflect on the prompts

### Couple Mode
1. **Both Connect** → Authentication for both partners
2. **Partner Matching** → Use personal codes to form a couple
3. **Auto Game Session** → System creates shared game session
4. **Draw Cards Together** → Take turns drawing cards
5. **Conversation** → Discuss the prompts together

## 🔧 Development Scripts

| Script | Purpose |
|--------|---------|
| `start.sh` | Start complete application (backend + frontend) |
| `start.sh --simple` | Quick start mode (minimal checks) |
| `start.sh --cleanup` | Clean up ports and processes only |
| `stop.sh` | Stop all services and clean up ports |
| `test-all.sh` | Run comprehensive test suite |
| `test-partner-matching.sh` | Test partner matching workflow |

### Usage Examples
```bash
# Standard start with full health checks
./start.sh

# Quick start for development
./start.sh --simple

# Clean up stuck processes/ports
./start.sh --cleanup

# Stop everything cleanly
./stop.sh
```

## 🗃️ Database Schema

**Users** - User accounts and authentication
**Couples** - Partner relationships  
**CoupleUsers** - Many-to-many relationship for couples
**GameSessions** - Active game instances
**Cards** - Game card data (optional storage)

## 📊 Event System

The application uses RabbitMQ for real-time events:

- **UserConnected** - User joins the system
- **CoupleCreated** - New couple formed
- **CoupleCompleted** - Couple has 2 members
- **GameSessionStarted** - New game begins
- **CardDrawn** - Card drawn by player

## 🏆 Stato Funzionalità

### ✅ Implementate
- Workflow richieste coppia (request / approve / reject / cancel) con auto-start game
- Risposta `respond-join` arricchita con `partnerInfo` + `gameSession`
- Fallback server-side partner (`[FallbackPartner]`) per snapshot immediato del richiedente
- Eventi frontend: `partnerUpdated`, `gameSessionStarted`, `sessionUpdated` (carta pescata)
- Diagnostica `partnerSyncDelay` dopo 3 poll senza partner
- Ottimistic UI per richieste (aggiornamento immediato)
- Snapshot endpoint aggregato
- Test integrazione Vitest (coppia, stabilità snapshot, pesca, partner immediato)
- Test shell (approve, reject, cancel) + E2E Playwright con `data-testid`
- Auto pulizia richieste incrociate dopo approvazione
- Avvio automatico Game Session

### 🔮 Miglioramenti Futuri
- Matrix CI (Node / OS) & caching ottimizzato
- Global Playwright setup (clear-users pre suite)
- Coverage combinata frontend+backend automatica (badge dinamico)
- Persistenza carte / progressi sessioni multiple
- i18n dinamico runtime
- WebSocket / SignalR per eliminare polling
- Rate limiting configurabile lato API (già esistente per join, estendere ad altre operazioni)

## 🧹 Aggiornamenti Recenti
| Area | Aggiornamento |
|------|---------------|
| UI | Introduzione Material UI (MUI) con tema personalizzato + Fabric.js (canvas carte) + pulizia log |
| Join Workflow | `respond-join` ora include `partnerInfo` e `gameSession` |
| Partner Sync | Fallback server-side immediato + evento diagnostico `partnerSyncDelay` |
| Snapshot | Aggiunto fallback `[FallbackPartner]` e stabilità sessione verificata via test |
| Testing | Suite integrazione Vitest + stabilizzazione unit (mock interno & ordine fetch deterministico) |
| API | Migliorata risposta `respond-join` per ridurre latenze UI |
| Ottimistic Join | TTL configurabile + pruning con metriche & evento `joinRequestExpired` |
| Script | `test:integration` esegue backend+frontend+Vitest in modo automatizzato |
| Documentazione | README aggiornato con nuove sezioni e API arricchite |

## 🧪 Modalità Test Interna (Backend-less)
Per i test unitari del frontend è disponibile un mock interno opzionale attivabile tramite variabile ambiente.

| Variabile | Valore | Effetto |
|-----------|--------|---------|
| `INTERNAL_API_TEST_MOCK` | `1` | Attiva handler in–memory dentro `EventDrivenApiService` (nessuna chiamata HTTP reale) |
| `ENABLE_POLL_IN_TEST` | `1` | (Opzionale) Riabilita il polling automatico anche in ambiente test |

Caratteristiche mock:
- Generazione deterministica di ID utente (`U1`, `U2`, ...)
- Aging artificiale delle richieste join per test pruning
- Simulazione failure: target contenente `FAIL` o `TARGET2` → errore su `/request-join`; `FAIL` su `/cancel-join`
- Primo snapshot può nascondere outgoing per validare conservazione ottimistica
- Nessun side effect esterno → test rapidi e stabili

Disabilitato di default: i test unitari usano fetch mock espliciti e il servizio in modalità "no polling" per mantenere l'ordine prevedibile delle chiamate.

## 🔁 Join Requests Ottimistiche & Pruning
Il frontend applica un pattern Optimistic UI alle richieste di coppia:

1. `requestJoin` inserisce subito un record temporaneo `{ _optimistic: true }` nella cache `outgoing` con `temp-<timestamp>`.
2. Se la risposta server contiene `requestId` il record viene aggiornato mantenendo il flag finché uno snapshot non lo conferma.
3. Snapshot vuoti preservano i record `_optimistic` (evita flicker).
4. Pruning: se un record resta `_optimistic` oltre `optimisticJoinTTL` viene rimosso e vengono emessi:
   - `joinRequestExpired` (payload `{ request })`
   - Incremento metrica `prunedJoinCount` (+ evento `metricsUpdated`)

Parametri:
| Chiave | Descrizione | Default |
|--------|-------------|---------|
| `optimisticJoinTTL` | Tempo massimo (ms) prima di pruning | 30000 |
| `minOptimisticTTL` | Soglia minima forzata | 500 |
| `prunedJoinCount` | Contatore persistito (localStorage) | 0 |

Persistenza: `localStorage['complicity_join_settings']` memorizza TTL e contatore pruning.

## 📊 Telemetria & Metriche
Il servizio accumula eventi interni in un buffer (flush a 20 eventi o al teardown):

Tipi principali:
- `metricIncrement` (es. pruning)
- `settingsUpdated` (cambio TTL)
- `telemetryBatch` (emesso con `{ events, at }` al flush)

Uso suggerito: collegare un listener a `telemetryBatch` per invio futuro a backend / analytics.

## 🧩 Eventi Frontend Esportati
| Evento | Payload | Trigger |
|--------|---------|---------|
| `usersUpdated` | `{ users, incoming, outgoing }` | Cambi snapshot utenti / richieste |
| `joinRequestsUpdated` | `{ incoming, outgoing }` | Cache richieste aggiornata |
| `joinRequestExpired` | `{ request }` | Pruning richiesta ottimistica |
| `metricsUpdated` | `{ prunedJoinCount }` | Aggiornamento metriche |
| `settingsUpdated` | `{ optimisticJoinTTL }` | Modifica TTL ottimistico |
| `coupleJoined` | `{ coupleId, partner }` | Coppia formata / approvazione |
| `partnerUpdated` | `{ userId, name, personalCode }` | Aggiornamento/rilevazione partner |
| `gameSessionStarted` | `{ sessionId }` | Sessione avviata |

## 🧪 Flag E2E & Modalità CI

Per migliorare stabilità e osservabilità dei test end‑to‑end sono stati introdotti alcuni flag ambiente:

| Variabile | Scope | Effetto |
|-----------|-------|---------|
| `VITE_E2E=1` | Build (vite) | Espone `window.__apiService` per test Playwright (lettura metriche, set TTL) – NON usare in produzione |
| `STRICT_COUPLE_ASSERT=1` | Runtime (Playwright) | Le asserzioni sulla formazione coppia/partner tornano hard‑fail (usa helper `assertStrict`) |
| `E2E_VERBOSE=1` | Runtime (Playwright) | Logga snippet HTML post‑auth per debug flussi di login/registrazione |

Esempi:
```bash
# Esecuzione completa in modalità strict e con log diagnostici
STRICT_COUPLE_ASSERT=1 E2E_VERBOSE=1 npm run test:e2e

# Costruire il frontend esponendo apiService per E2E
VITE_E2E=1 npm run dev
```

Nel workflow CI E2E (`.github/workflows/ci-e2e.yml`) i flag NON sono abilitati di default per mantenere il comportamento standard e evitare di dipendere da API non pubbliche. Abilitare `VITE_E2E` solo se si introducono nuovi test che richiedono accesso diretto alle metriche.

### Strategia Soft vs Strict
Le asserzioni su coppia e partner sono soft per ridurre flakiness dovuta a latenze backend. Abilitare `STRICT_COUPLE_ASSERT` nelle esecuzioni locali quando si vuole intercettare regressioni early.

## 🛡️ Sicurezza Dipendenze & Vulnerabilità

GitHub Dependabot può mostrare vulnerabilità anche quando `npm audit` locale restituisce 0. Possibili ragioni:
1. Database advisory GitHub aggiornato prima di quello npm.
2. Vulnerabilità segnalate per catena transitive già patchate ma non ancora riconosciute da `npm audit`.
3. Branch default diverso: assicurarsi che il branch `Evolution` sia sincronizzato con `main` (o viceversa) prima di confrontare.

Passi consigliati quando appare un avviso remoto ma audit locale è vuoto:
1. Apri il tab Security > Dependabot alerts su GitHub per vedere i pacchetti specifici.
2. Confronta la versione installata (in `package-lock.json`) con la versione risolta suggerita.
3. Esegui eventualmente:
    ```bash
    npm outdated
    npm install <pacchetto>@latest --save-dev # o --save se prod
    ```
4. Riesegui: `npm audit` e test (`npm run test:unit` / E2E).

Se l'alert riguarda un pacchetto transitive non direttamente dipendente, aggiungere un override (npm v8+) / `resolutions` (Yarn) o aprire PR upstream.

Esempio override (npm >=8):
```json
"overrides": {
   "minimatch": "9.0.5"
}
```

Attualmente l'audit locale è pulito (0 vulnerabilità). Monitorare periodicamente e valutare l'attivazione di un workflow programmato (cron) per audit automatico.
| `sessionUpdated` | `{ type:'cardDrawn', card,... }` | Carta pescata |
| `telemetryBatch` | `{ events, at }` | Flush telemetria |
| `partnerSyncDelay` | `{ polls, sessionId }` | Ritardo sincronizzazione partner |

Documentazione dettagliata: vedi `docs/FRONTEND_EVENTS.md`.

## 🧾 File Aggiuntivi Consigliati
Creare (o verificare) i seguenti file per approfondimenti:
- `JOIN_REQUESTS.md` – Dettaglio lifecycle, esempi timing, casi edge (approve simultaneo, cancel tardivo)
- `.env.example` – Porta frontend/backend + flag test
- `docs/FRONTEND_EVENTS.md` – Lista versionata degli eventi con schema payload


## 🩺 Diagnostica Sincronizzazione Partner
In casi rari di latenza, il frontend emette una voce log: `⏱️ Ritardo nella sincronizzazione del partner... (diagnostica)` dopo ~6s (3 poll). Il backend espone un fallback interno che ricostruisce `partnerInfo` direttamente dal DB; il log `[FallbackPartner]` indica che il meccanismo è entrato in azione.

Se questo evento appare di frequente:
- Verificare carico DB / latenza I/O
- Controllare eventuali lock o ritardi EF nelle navigation
- Considerare l'abilitazione di un canale WebSocket per push immediato

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./test-all.sh`
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**CardApp** - Bringing couples closer through meaningful conversation 💕
