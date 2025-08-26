# 🎮 Gioco della Complicità - Script Documentation

## 📋 Script Overview

Gli script sono stati completamente aggiornati per riflettere l'architettura attuale con componenti decoupled:

### 🔧 Setup & Configuration
- **`setup-unified.sh`** - Setup completo e verifica dell'architettura
- **`scripts-help.sh`** - Mostra stato e help per tutti gli script

### 🚀 Application Launchers  
- **`start-simple.sh`** - ✅ **RECOMMENDED** - Launcher aggiornato per architettura corrente
- **`start-unified.sh`** - Launcher legacy (mantenuto per compatibilità)

### 🧪 Testing Scripts
- **`test-api-endpoints.sh`** - Test completo di tutti gli endpoint API
- **`simple-api-test.sh`** - Test rapido API (richiede backend attivo)
- **`test-frontend.sh`** - Test di avvio del frontend

## 🏗️ Current Architecture

```
src/
├── main.jsx              → Entry point
├── SimpleApp.jsx         → Main orchestrator  
├── SimpleAuth.jsx        → Authentication component
├── GameTypeSelector.jsx  → Game selection
├── CoupleGame.jsx        → Couple game logic + SignalR
├── SimpleCardGame.jsx    → Card display component
└── useUnifiedBackend.js  → Backend integration hook
```

## 🚀 Quick Start

```bash
# 1. Setup (first time only)
./setup-unified.sh

# 2. Start application
./start-simple.sh

# 3. Open browser
# http://localhost:5173 or http://localhost:5174
```

## 🧪 Testing

```bash
# Quick API test (backend must be running)
./simple-api-test.sh

# Full endpoint test (starts backend automatically)
./test-api-endpoints.sh

# Frontend only test
./test-frontend.sh
```

## 🔧 Troubleshooting

```bash
# Check backend health
curl http://localhost:5000/api/health

# Kill all processes
pkill -f dotnet && pkill -f npm

# Check port usage
lsof -ti:5000 -ti:5173 -ti:5174

# Script help
./scripts-help.sh
```

## 🎯 Fixed Issues

1. ✅ **File References** - Script ora cercano i file corretti (SimpleApp.jsx, SimpleAuth.jsx, etc.)
2. ✅ **Port Detection** - Gestione automatica delle porte 5173/5174 per il frontend
3. ✅ **Architecture Validation** - Verifica che tutti i componenti dell'architettura corrente esistano
4. ✅ **Error Handling** - Cleanup automatico e gestione errori migliorata
5. ✅ **Documentation** - Informazioni aggiornate sull'architettura semplificata

## 📝 Notes

- Il frontend potrebbe usare la porta 5173 o 5174 (auto-detection)
- Il backend usa sempre la porta 5000
- SignalR WebSocket è disponibile su `ws://localhost:5000/gamehub`
- Tutti gli script sono ora compatibili con l'architettura corrente
