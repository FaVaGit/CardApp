# 🎮 CardApp - Gioco della Complicità

<!-- CI Badges -->
![Unit Tests](https://github.com/FaVaGit/CardApp/actions/workflows/ci-unit.yml/badge.svg?branch=Evolution)
![E2E Tests](https://github.com/FaVaGit/CardApp/actions/workflows/ci-e2e.yml/badge.svg?branch=Evolution)
<!-- If Codecov is enabled add: -->
![Coverage](https://img.shields.io/badge/coverage-11.3%25-blue?style=flat)

A modern card game application built with **Event-Driven Architecture** using React, ASP.NET Core, and RabbitMQ. Designed for couples to strengthen their relationship through meaningful conversation prompts.

## ✨ Features

- 🎯 **Single Player Mode**: Esperienza personale di pesca carte
- 👥 **Couple Mode (richiesta / approvazione)**: Accoppiamento esplicito con auto‑start sessione
- ⚡ **Partner Sync Immediato**: `respond-join` ora restituisce direttamente `partnerInfo` evitando attese
- 🎴 **Card Sharing Sincronizzato**: Stato carte condivise in snapshot (storico `sharedCards`)
- 🎲 **150+ Carte Conversazione**: Prompt curati in italiano
- 🔄 **Eventi Real-time / Polling Resiliente**: RabbitMQ (o polling snapshot come fallback)
- 🩺 **Diagnostica Sync Partner**: Evento `partnerSyncDelay` dopo 3 poll se partner mancante
- 🧪 **Test Integrazione Automatizzati**: Suite Vitest per flussi coppia e pesca carta
- 📱 **Responsive Design**: Mobile & Desktop
- 🏗️ **Architettura Moderna**: Separation of concerns, fallback sicuri

## 🏗️ Architecture

**Event-Driven with RabbitMQ**
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: ASP.NET Core 8 Web API
- **Database**: SQLite with Entity Framework Core
- **Events**: RabbitMQ for real-time communication
- **State Management**: Event sourcing pattern

## 📁 Project Structure

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
| Join Workflow | `respond-join` ora include `partnerInfo` e `gameSession` |
| Partner Sync | Fallback server-side immediato + evento diagnostico `partnerSyncDelay` |
| Snapshot | Aggiunto fallback `[FallbackPartner]` e stabilità sessione verificata via test |
| Testing | Suite integrazione Vitest (`tests/integration/*.test.js`) aggiunta + test partner immediato |
| API | Migliorata risposta `respond-join` per ridurre latenze UI |
| UI | Dedupe log, placeholder partner ridotto, diagnostica delay una sola volta |
| Script | `test:integration` esegue backend+frontend+Vitest in modo automatizzato |
| Documentazione | README aggiornato con nuove sezioni e API arricchite |

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
