#!/bin/bash

# 🎮 Gioco della Complicità - Unified Backend
# Script per avviare l'applicazione con architettura unificata (solo ASP.NET Core)

set -e  # Exit on any error

echo "🎮 Gioco della Complicità - Unified Backend"
echo "==========================================="
echo "📋 Architettura: React Frontend + ASP.NET Core Backend"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funzione per cleanup al termine
cleanup() {
    echo -e "\n🛑 Terminazione servizi..."
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}   Terminando backend...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}   Terminando frontend...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Uccidi anche eventuali processi rimasti sulle porte
    lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup completato${NC}"
    echo "👋 Arrivederci!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verifica prerequisiti base
echo -e "${BLUE}🔍 Verifica prerequisiti...${NC}"

if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ .NET SDK non trovato. Installalo e riprova.${NC}"
    echo -e "${CYAN}💡 Installa da: https://dotnet.microsoft.com/download${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm non trovato. Installalo e riprova.${NC}"
    echo -e "${CYAN}💡 Installa da: https://nodejs.org/${NC}"
    exit 1
fi

# Verifica struttura del progetto
if [ ! -d "Backend/ComplicityGame.Api" ]; then
    echo -e "${RED}❌ Directory backend non trovata: Backend/ComplicityGame.Api${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json non trovato nella directory root${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisiti verificati${NC}"

# Pulizia porte occupate
echo -e "${YELLOW}🧹 Pulizia porte occupate...${NC}"
lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
sleep 1

# Avvia backend in background
echo -e "${BLUE}🔧 Avvio backend ASP.NET Core...${NC}"
echo -e "${CYAN}   📍 Porta: 5000${NC}"
echo -e "${CYAN}   📂 Directory: Backend/ComplicityGame.Api${NC}"

cd Backend/ComplicityGame.Api
dotnet run &
BACKEND_PID=$!
cd ../../

# Aspetta che il backend sia pronto
echo -e "${YELLOW}⏳ Attendo che il backend sia pronto...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend ASP.NET Core pronto!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Timeout: backend non risponde dopo 30 secondi${NC}"
        echo -e "${CYAN}💡 Verifica che la porta 5000 sia libera e che .NET sia installato correttamente${NC}"
        cleanup
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Verifica se npm install è necessario
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installazione dipendenze npm...${NC}"
    npm install
fi

# Avvia frontend
echo -e "${BLUE}🎨 Avvio frontend React + Vite...${NC}"
echo -e "${CYAN}   📍 Porta: 5173${NC}"
echo -e "${CYAN}   ⚛️  Framework: React con architettura unificata${NC}"

npm run dev &
FRONTEND_PID=$!

# Aspetta un po' per il frontend
sleep 3

# Verifica che entrambi i servizi siano attivi
echo -e "${BLUE}🔍 Verifica servizi...${NC}"

if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend non è attivo${NC}"
    cleanup
    exit 1
fi

if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend potrebbe non essere ancora pronto (normale nei primi secondi)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SERVIZI AVVIATI CON SUCCESSO!${NC}"
echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│                    ENDPOINTS                    │${NC}"
echo -e "${BLUE}├─────────────────────────────────────────────────┤${NC}"
echo -e "${BLUE}│ 📱 Frontend:     ${GREEN}http://localhost:5173${BLUE}           │${NC}"
echo -e "${BLUE}│ ⚙️  Backend API:  ${GREEN}http://localhost:5000${BLUE}           │${NC}"
echo -e "${BLUE}│ 🔍 Health Check: ${GREEN}http://localhost:5000/api/health${BLUE} │${NC}"
echo -e "${BLUE}│ 🎮 SignalR Hub:  ${GREEN}ws://localhost:5000/gamehub${BLUE}      │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${CYAN}🏗️  ARCHITETTURA UNIFICATA:${NC}"
echo -e "${CYAN}   • Frontend: React + Vite + Tailwind CSS${NC}"
echo -e "${CYAN}   • Backend: ASP.NET Core + SignalR + SQLite${NC}"
echo -e "${CYAN}   • Comunicazione: HTTP REST + WebSocket${NC}"
echo ""
echo -e "${YELLOW}💡 Apri il browser su ${GREEN}http://localhost:5173${YELLOW} per iniziare!${NC}"
echo ""
echo -e "${YELLOW}📋 CONTROLLI ADMIN DISPONIBILI:${NC}"
echo -e "${CYAN}   • Clear Users: Rimuove tutti gli utenti${NC}"
echo -e "${CYAN}   • Refresh: Aggiorna tutti i dati${NC}"
echo -e "${CYAN}   • Debug: Mostra informazioni di debug${NC}"
echo -e "${CYAN}   • Sync: Sincronizza dati con il backend${NC}"
echo ""
echo -e "${RED}🛑 Premi Ctrl+C per terminare entrambi i servizi${NC}"
echo ""

# Mostra log in tempo reale
echo -e "${BLUE}📋 Servizi in esecuzione...${NC}"
echo "========================================"

# Attendi terminazione (mantiene i servizi attivi)
wait
