#!/bin/bash

# 📋 Script Status and Help
echo "🎮 Gioco della Complicità - Script Status"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}📋 AVAILABLE SCRIPTS:${NC}"
echo ""

# Check which scripts exist and are executable
scripts=(
    "setup-unified.sh:🔧 Setup and verify project architecture"
    "start-unified.sh:🚀 Start both backend and frontend (legacy)"
    "start-simple.sh:🚀 Start both backend and frontend (current)"
    "test-api-endpoints.sh:🧪 Comprehensive API endpoint testing"
    "simple-api-test.sh:🧪 Quick API testing (backend must be running)"
    "test-frontend.sh:🎨 Quick frontend startup test"
)

for script_info in "${scripts[@]}"; do
    script=$(echo "$script_info" | cut -d: -f1)
    description=$(echo "$script_info" | cut -d: -f2)
    
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}✅ ./$script${NC} - $description"
        else
            echo -e "${YELLOW}⚠️  ./$script${NC} - $description (not executable)"
        fi
    else
        echo -e "${YELLOW}❌ $script${NC} - $description (missing)"
    fi
done

echo ""
echo -e "${PURPLE}🏗️  CURRENT ARCHITECTURE:${NC}"
echo -e "${CYAN}   • Entry Point: src/main.jsx → SimpleApp.jsx${NC}"
echo -e "${CYAN}   • Authentication: SimpleAuth.jsx${NC}"
echo -e "${CYAN}   • Game Types: GameTypeSelector.jsx${NC}"
echo -e "${CYAN}   • Couple Game: CoupleGame.jsx${NC}"
echo -e "${CYAN}   • Card Game: SimpleCardGame.jsx${NC}"
echo -e "${CYAN}   • Backend Hook: useUnifiedBackend.js${NC}"

echo ""
echo -e "${YELLOW}🚀 QUICK START:${NC}"
echo -e "${CYAN}   1. Run setup:    ${GREEN}./setup-unified.sh${NC}"
echo -e "${CYAN}   2. Start app:    ${GREEN}./start-simple.sh${NC}"
echo -e "${CYAN}   3. Open browser: ${GREEN}http://localhost:5174${NC}"

echo ""
echo -e "${YELLOW}🧪 TESTING:${NC}"
echo -e "${CYAN}   • Full API test: ${GREEN}./test-api-endpoints.sh${NC}"
echo -e "${CYAN}   • Quick test:    ${GREEN}./simple-api-test.sh${NC}"
echo -e "${CYAN}   • Frontend only: ${GREEN}./test-frontend.sh${NC}"

echo ""
echo -e "${YELLOW}🔧 TROUBLESHOOTING:${NC}"
echo -e "${CYAN}   • Backend health: ${GREEN}curl http://localhost:5000/api/health${NC}"
echo -e "${CYAN}   • Kill processes: ${GREEN}pkill -f dotnet && pkill -f npm${NC}"
echo -e "${CYAN}   • Port check:     ${GREEN}lsof -ti:5000 -ti:5173 -ti:5174${NC}"
echo ""
