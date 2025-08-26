#!/bin/bash

# 🎮 Gioco della Complicità - Modern Simple Architecture Launcher
# Updated script for current architecture with SimpleApp, SimpleAuth, and CoupleGame

set -e  # Exit on any error

echo "🎮 Gioco della Complicità - Simple Architecture"
echo "=============================================="
echo "📋 Architettura: React Frontend + ASP.NET Core Backend"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function for cleanup on exit
cleanup() {
    echo -e "\n🛑 Stopping services..."
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}   Stopping backend...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}   Stopping frontend...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Kill any remaining processes on our ports
    lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
    lsof -ti:5174 | xargs -r kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    echo "👋 Goodbye!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Prerequisites check
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ .NET SDK not found. Please install and try again.${NC}"
    echo -e "${CYAN}💡 Install from: https://dotnet.microsoft.com/download${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm not found. Please install and try again.${NC}"
    echo -e "${CYAN}💡 Install from: https://nodejs.org/${NC}"
    exit 1
fi

# Project structure verification
if [ ! -d "Backend/ComplicityGame.Api" ]; then
    echo -e "${RED}❌ Backend directory not found: Backend/ComplicityGame.Api${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in root directory${NC}"
    exit 1
fi

# Verify current architecture files
echo -e "${BLUE}🔍 Verifying architecture files...${NC}"
REQUIRED_FILES=(
    "src/SimpleApp.jsx"
    "src/SimpleAuth.jsx"
    "src/CoupleGame.jsx"
    "src/SimpleCardGame.jsx"
    "src/GameTypeSelector.jsx"
    "src/useUnifiedBackend.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        echo -e "${YELLOW}⚠️  Current architecture requires these files${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Prerequisites and architecture verified${NC}"

# Clean occupied ports
echo -e "${YELLOW}🧹 Cleaning occupied ports...${NC}"
lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5174 | xargs -r kill -9 2>/dev/null || true
sleep 2

# Start backend
echo -e "${BLUE}🔧 Starting ASP.NET Core backend...${NC}"
echo -e "${CYAN}   📍 Port: 5000${NC}"
echo -e "${CYAN}   📂 Directory: Backend/ComplicityGame.Api${NC}"

cd Backend/ComplicityGame.Api
dotnet run &
BACKEND_PID=$!
cd ../../

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Timeout: backend not responding after 30 seconds${NC}"
        echo -e "${CYAN}💡 Check that port 5000 is free and .NET is properly installed${NC}"
        cleanup
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
    npm install
fi

# Start frontend
echo -e "${BLUE}🎨 Starting React + Vite frontend...${NC}"
echo -e "${CYAN}   📍 Port: Will auto-detect (5173 or 5174)${NC}"
echo -e "${CYAN}   ⚛️  Components: SimpleApp → SimpleAuth + CoupleGame${NC}"

npm run dev &
FRONTEND_PID=$!

# Wait for frontend
sleep 4

# Verify services
echo -e "${BLUE}🔍 Verifying services...${NC}"

if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend not responding${NC}"
    cleanup
    exit 1
fi

# Detect frontend port
FRONTEND_PORT=""
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    FRONTEND_PORT="5173"
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    FRONTEND_PORT="5174"
else
    echo -e "${YELLOW}⚠️  Frontend might not be ready yet (normal in first seconds)${NC}"
    FRONTEND_PORT="5173/5174"
fi

echo ""
echo -e "${GREEN}🎉 SERVICES STARTED SUCCESSFULLY!${NC}"
echo ""
echo -e "${PURPLE}┌─────────────────────────────────────────────────┐${NC}"
echo -e "${PURPLE}│                   ENDPOINTS                     │${NC}"
echo -e "${PURPLE}├─────────────────────────────────────────────────┤${NC}"
echo -e "${PURPLE}│ 📱 Frontend:     ${GREEN}http://localhost:$FRONTEND_PORT${PURPLE}           │${NC}"
echo -e "${PURPLE}│ ⚙️  Backend API:  ${GREEN}http://localhost:5000${PURPLE}           │${NC}"
echo -e "${PURPLE}│ 🔍 Health Check: ${GREEN}http://localhost:5000/api/health${PURPLE} │${NC}"
echo -e "${PURPLE}│ 🎮 SignalR Hub:  ${GREEN}ws://localhost:5000/gamehub${PURPLE}      │${NC}"
echo -e "${PURPLE}└─────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${CYAN}🏗️  SIMPLE ARCHITECTURE:${NC}"
echo -e "${CYAN}   • Entry Point: SimpleApp.jsx${NC}"
echo -e "${CYAN}   • Authentication: SimpleAuth.jsx${NC}"
echo -e "${CYAN}   • Game Selection: GameTypeSelector.jsx${NC}"
echo -e "${CYAN}   • Couple Game: CoupleGame.jsx${NC}"
echo -e "${CYAN}   • Card Game: SimpleCardGame.jsx${NC}"
echo -e "${CYAN}   • Backend Hook: useUnifiedBackend.js${NC}"
echo ""
echo -e "${YELLOW}💡 Open browser at ${GREEN}http://localhost:$FRONTEND_PORT${YELLOW} to start!${NC}"
echo ""
echo -e "${YELLOW}🎮 FEATURES AVAILABLE:${NC}"
echo -e "${CYAN}   • User login/registration${NC}"
echo -e "${CYAN}   • Couple session creation & sharing${NC}"
echo -e "${CYAN}   • Real-time card synchronization${NC}"
echo -e "${CYAN}   • SignalR WebSocket communication${NC}"
echo -e "${CYAN}   • Decoupled component architecture${NC}"
echo ""
echo -e "${RED}🛑 Press Ctrl+C to stop both services${NC}"
echo ""

# Show real-time logs
echo -e "${BLUE}📋 Services running...${NC}"
echo "========================================"

# Keep services running
wait
