# 🎮 Gioco della Complicità - Modern Event-Driven Architecture

## 📋 Current Implementation Status

**✅ MODERNIZATION COMPLETED** - Sistema completamente aggiornato all'architettura Event-Driven con RabbitMQ

### 🔧 Available Scripts
- **`start.sh`** - ✅ **RECOMMENDED** - Avvia l'intera applicazione (RabbitMQ + Backend + Frontend)
- **`stop.sh`** - 🛑 Ferma tutti i servizi
- **`test.sh`** - 🧪 Test completo della nuova architettura

### 🏗️ Modern Architecture

```
Backend (Event-Driven):
├── EventDrivenGameController.cs  → REST API endpoints
├── RabbitMQEventPublisher.cs     → Event publishing
├── UserPresenceService.cs        → Auto-user creation & presence
├── CoupleMatchingService.cs      → Auto-couple matching
└── GameSessionService.cs         → Game session management

Frontend (React + Vite):
├── main.jsx                      → Entry point
├── SimpleApp.jsx                 → Main orchestrator with inline game selection
├── SimpleAuth.jsx                → Authentication component
├── CoupleGame.jsx                → Modern couple game (no SignalR)
├── SimpleCardGame.jsx            → Card display component
└── EventDrivenApiService.js      → Unified API service
```

## 🚀 Quick Start

```bash
# 1. Start everything (RabbitMQ + Backend + Frontend)
./start.sh

# 2. Open browser
# Frontend: http://localhost:5173 or http://localhost:5174
# Backend API: http://localhost:5000
# RabbitMQ Admin: http://localhost:15672 (guest/guest)

# 3. Test the system
./test.sh
```

## 🔗 API Endpoints (Event-Driven)

```bash
POST /api/EventDrivenGame/connect
POST /api/EventDrivenGame/disconnect  
POST /api/EventDrivenGame/join-couple
POST /api/EventDrivenGame/start-game
POST /api/EventDrivenGame/draw-card
POST /api/EventDrivenGame/end-game
GET  /api/EventDrivenGame/user-status/{userId}
```

## 🧪 Testing Features

- ✅ **Auto-user creation**: Users created automatically on connect
- ✅ **Auto-couple matching**: Couples formed automatically with partner codes  
- ✅ **Auto-game start**: Games start automatically when both partners connect
- ✅ **Real-time events**: RabbitMQ event publishing for all actions
- ✅ **Card drawing**: Event-driven card selection with notifications
- ✅ **Clean UI**: Modern React interface with activity logs

## 🗑️ Legacy Removed

- ❌ **SignalR**: Completely removed, replaced with REST + RabbitMQ events
- ❌ **Legacy services**: Old UserService, CoupleService, CardService removed
- ❌ **Old scripts**: Obsolete .sh/.bat files cleaned up
- ❌ **Legacy components**: GameTypeSelector, SignalR hooks, legacy React components

## 🔧 Troubleshooting

```bash
# Check backend health
curl http://localhost:5000/api/health

# Kill all processes
pkill -f dotnet && pkill -f npm

# Check what's running on ports
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
lsof -i :5672  # RabbitMQ
```

## 🎯 Development Status

**CURRENT STATE**: ✅ Production Ready
- 🐰 RabbitMQ event system functional
- 🔄 Auto-user creation and matching working
- 🎴 Card drawing with real-time events
- 🧹 All legacy code cleaned up
- 📱 Modern responsive UI

**NEXT STEPS**: Ready for production deployment
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
