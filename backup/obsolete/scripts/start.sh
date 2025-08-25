#!/bin/bash

# 🎮 Gioco della Complicità - Avvio Rapido
# Script per avviare rapidamente frontend e backend

set -e  # Exit on any error

echo "🎮 Avvio Gioco della Complicità..."
echo "=================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per cleanup al termine
cleanup() {
    echo -e "\n🛑 Terminazione servizi..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Uccidi anche eventuali processi rimasti sulle porte
    lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
    echo "👋 Arrivederci!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verifica prerequisiti base
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ .NET SDK non trovato. Installalo e riprova.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm non trovato. Installalo e riprova.${NC}"
    exit 1
fi

# Pulizia porte occupate
echo -e "${YELLOW}🧹 Pulizia porte occupate...${NC}"
lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
sleep 1

# Avvia backend in background
echo -e "${BLUE}🔧 Avvio backend ASP.NET Core su porta 5000...${NC}"
cd Backend/ComplicityGame.Api
dotnet run &
BACKEND_PID=$!
cd ../../

# Aspetta che il backend sia pronto
echo -e "${YELLOW}⏳ Attendo che il backend sia pronto...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend pronto!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Timeout: backend non risponde dopo 30 secondi${NC}"
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
echo -e "${BLUE}🎨 Avvio frontend React + Vite su porta 5173...${NC}"
npm run dev &
FRONTEND_PID=$!

# Aspetta un po' per il frontend
sleep 3

# Verifica che entrambi i servizi siano attivi
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend non è attivo${NC}"
    cleanup
    exit 1
fi

if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend potrebbe non essere ancora pronto (normale, prova tra qualche secondo)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Servizi avviati con successo!${NC}"
echo ""
echo -e "${BLUE}📱 Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "${BLUE}⚙️  Backend:  ${GREEN}http://localhost:5000${NC}"
echo -e "${BLUE}🔍 Health:   ${GREEN}http://localhost:5000/api/health${NC}"
echo ""
echo -e "${YELLOW}💡 Apri il browser su http://localhost:5173 per iniziare!${NC}"
echo ""
echo -e "${RED}🛑 Premi Ctrl+C per terminare entrambi i servizi${NC}"
echo ""

# Mostra log in tempo reale
echo -e "${BLUE}📋 Log dei servizi (ultimi messaggi):${NC}"
echo "========================================"

# Attendi terminazione (mantiene i servizi attivi)
wait
