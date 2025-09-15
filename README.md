# 🎮 CardApp - Gioco della Complicità

<!-- CI Badges -->
![Unit Tests](https://github.com/FaVaGit/CardApp/actions/workflows/ci-unit.yml/badge.svg?branch=Evolution)
![E2E Tests](https://github.com/FaVaGit/CardApp/actions/workflows/ci-e2e.yml/badge.svg?branch=Evolution)
<!-- If Codecov is enabled add: -->
![Coverage](https://img.shields.io/badge/coverage-11.3%25-blue?style=flat)

A modern card game application built with **Event-Driven Architecture** using React, ASP.NET Core, and RabbitMQ. Designed for couples to strengthen their relationship through meaningful conversation prompts.

## ✨ Features

- 🎯 **Single Player Mode**: Individual card drawing experience
- 👥 **Couple Mode**: Partner matching and shared game sessions
- 🎲 **150+ Conversation Cards**: Carefully crafted prompts in Italian
- 🔄 **Real-time Events**: RabbitMQ-powered event system
- 📱 **Responsive Design**: Works on mobile and desktop
- 🏗️ **Modern Architecture**: Clean, maintainable codebase

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

### Tipologie di test
| Livello | Strumento | Percorso | Cosa valida |
|---------|-----------|----------|-------------|
| Shell integration | bash + curl + jq | `tests/*.test.sh` | Flussi API (join approve / reject / cancel, snapshot) |
| End‑to‑End UI | Playwright | `tests/e2e/*.spec.js` | Interazioni reali browser (richiesta, accetta, rifiuta, annulla, reconnect) |

### Esecuzione rapida
```bash
# Tutti i test shell + (se configurato) eventuali altri script
./test-all.sh

# Solo flussi join API (approve / reject / cancel)
bash tests/join-flow.test.sh
bash tests/reject-flow.test.sh
bash tests/cancel-flow.test.sh

# Test E2E Playwright (richiede Node >=20 e browsers Playwright installati)
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
- `POST /api/EventDrivenGame/respond-join` - Approvazione / rifiuto richiesta (B risponde)
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
- Ottimistic UI per richieste (aggiornamento immediato senza attendere polling)
- Snapshot endpoint aggregato (riduce chiamate multiple)
- Test shell negativi & positivi (approve, reject, cancel)
- Test E2E Playwright stabili con `data-testid`
- Auto pulizia richieste pendenti incrociate dopo approvazione
- Avvio automatico Game Session al completamento coppia

### 🔮 Miglioramenti Futuri
- CI pipeline (GitHub Actions) con matrix Node / OS
- Global Playwright setup per `clear-users` unico
- Coverage report (nyc per frontend, coverlet per backend)
- Persistenza carte / progressi per sessioni multiple
- Internationalizzazione dinamica (i18n)
- Notifiche WebSocket / SignalR come alternativa al polling

## 🧹 Aggiornamenti Recenti
| Area | Aggiornamento |
|------|---------------|
| Join Workflow | Introdotto flusso approvazione con cleanup richieste incrociate |
| UI | Stato ottimistico per richieste e badge testabili |
| Testing | Aggiunti Playwright E2E (approve / reject / cancel / reconnect) |
| Selettori | Migrazione a `data-testid` per stabilità test |
| Node Version | Aggiunto `.nvmrc` (20.19.0) e engines in `package.json` |
| Script e2e | `scripts/e2e-server.js` riusa backend già avviato evitando conflitti porta |
| Documentazione | README ampliato (workflow join, admin endpoints, test) |

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
