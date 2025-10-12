# ⚡ Quick Reference - Architettura Unificata

## 🚀 Avvio Rapido

```bash
# Setup (solo prima volta)
./setup-unified.sh

# Avvio applicazione
./start-unified.sh

# Accesso: http://localhost:5173
```

## 🔗 Endpoint Essenziali

| URL | Servizio |
|-----|----------|
| http://localhost:5173 | 📱 Frontend |
| http://localhost:5000 | ⚙️ Backend API |
| http://localhost:5000/api/health | 🔍 Health Check |

## 📁 File Principali

| File | Descrizione |
|------|-------------|
| `src/useUnifiedBackend.js` | Hook backend unificato |
| `src/AppUnified.jsx` | App principale |
| `src/main.jsx` | Entry point (importa AppUnified) |

## 🎮 Controlli Admin

Sempre disponibili nell'interfaccia:

- **Clear Users** - Rimuove tutti gli utenti
- **Refresh** - Aggiorna tutti i dati
- **Debug** - Info di debug
- **Sync** - Sincronizza dati

## 🧪 Test Rapidi

```bash
# Backend health
curl http://localhost:5000/api/health

# Users online
curl http://localhost:5000/api/users

# All couples
curl http://localhost:5000/api/game/couples
```

## 🔧 Sviluppo

```bash
# Frontend dev
npm run dev

# Backend dev
cd Backend/ComplicityGame.Api && dotnet run

# Build production
npm run build
cd Backend/ComplicityGame.Api && dotnet publish
```

## 🐛 Debug

1. **Backend Logs**: Visibili nella console di dotnet run
2. **Frontend Errors**: F12 → Console nel browser
3. **SignalR**: F12 → Network → WS tab
4. **Admin Controls**: Usa pulsanti Debug/Sync nell'app

## 📱 Flusso Utente

1. **Connecting** → Backend connection
2. **Login** → User registration/login
3. **Partner Management** → Create/join couples
4. **Game Ready** → Active game sessions

## ⚠️ File Obsoleti

Spostati in `backup/obsolete/`:
- `App.jsx` (old)
- `useBackend.js` (simulated)
- `BackendService.js` (simulated)
- `SimpleUserLogin.jsx` (old)
- `PartnerManagement.jsx` (complex)

## 🎯 Architettura

```
React (5173) ←→ ASP.NET Core (5000) ←→ SQLite
```

Solo backend reale, nessuna simulazione.
