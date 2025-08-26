#!/bin/bash

# 🎮 Gioco della Complicità - Setup Unified Architecture
# Script per setup automatico dell'ambiente con architettura unificata

set -e  # Exit on any error

echo "🎮 Setup Gioco della Complicità - Unified Architecture"
echo "======================================================"
echo "🏗️  Configurazione: React Frontend + ASP.NET Core Backend"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Funzioni helper
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}💡 $1${NC}"
}

# Verifica se si è nella directory corretta
if [ ! -f "package.json" ]; then
    print_error "Setup deve essere eseguito dalla directory root del progetto"
    exit 1
fi

print_step "Verifica prerequisiti del sistema"

# Verifica .NET SDK
if ! command -v dotnet &> /dev/null; then
    print_error ".NET SDK non trovato"
    print_info "Scarica e installa .NET SDK da: https://dotnet.microsoft.com/download"
    exit 1
else
    DOTNET_VERSION=$(dotnet --version)
    print_success ".NET SDK trovato (versione: $DOTNET_VERSION)"
fi

# Verifica Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js non trovato"
    print_info "Scarica e installa Node.js da: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    print_success "Node.js trovato (versione: $NODE_VERSION)"
fi

# Verifica npm
if ! command -v npm &> /dev/null; then
    print_error "npm non trovato"
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_success "npm trovato (versione: $NPM_VERSION)"
fi

# Verifica curl per test
if ! command -v curl &> /dev/null; then
    print_warning "curl non trovato - utile per test API"
fi

print_step "Verifica struttura del progetto"

# Verifica directory backend
if [ ! -d "Backend/ComplicityGame.Api" ]; then
    print_error "Directory backend non trovata: Backend/ComplicityGame.Api"
    exit 1
else
    print_success "Directory backend trovata"
fi

# Verifica file di progetto .NET
if [ ! -f "Backend/ComplicityGame.Api/ComplicityGame.Api.csproj" ]; then
    print_error "File di progetto .NET non trovato"
    exit 1
else
    print_success "File di progetto .NET trovato"
fi

# Verifica package.json
if [ ! -f "package.json" ]; then
    print_error "package.json non trovato"
    exit 1
else
    print_success "package.json trovato"
fi

print_step "Setup dipendenze backend (.NET)"

cd Backend/ComplicityGame.Api

# Restore pacchetti .NET
echo -e "${CYAN}📦 Ripristino pacchetti .NET...${NC}"
if dotnet restore; then
    print_success "Pacchetti .NET ripristinati"
else
    print_error "Errore nel ripristino pacchetti .NET"
    exit 1
fi

# Build del progetto
echo -e "${CYAN}🔨 Build del progetto backend...${NC}"
if dotnet build; then
    print_success "Build backend completata"
else
    print_error "Errore nella build del backend"
    exit 1
fi

cd ../../

print_step "Setup dipendenze frontend (npm)"

# Installa dipendenze npm
echo -e "${CYAN}📦 Installazione dipendenze npm...${NC}"
if npm install; then
    print_success "Dipendenze npm installate"
else
    print_error "Errore nell'installazione dipendenze npm"
    exit 1
fi

print_step "Verifica configurazione unificata"

# Verifica file principali dell'architettura unificata
UNIFIED_FILES=(
    "src/useUnifiedBackend.js"
    "src/SimpleApp.jsx"
    "src/SimpleAuth.jsx"
    "src/CoupleGame.jsx"
    "src/SimpleCardGame.jsx"
    "src/GameTypeSelector.jsx"
)

for file in "${UNIFIED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "File unificato trovato: $file"
    else
        print_warning "File unificato mancante: $file"
    fi
done

# Verifica che i file obsoleti siano stati spostati
if [ -d "backup/obsolete" ]; then
    print_success "Directory backup obsoleti trovata"
    OBSOLETE_COUNT=$(find backup/obsolete -name "*.js" -o -name "*.jsx" | wc -l)
    print_info "File obsoleti archiviati: $OBSOLETE_COUNT"
else
    print_warning "Directory backup obsoleti non trovata"
fi

print_step "Test configurazione"

# Test build frontend
echo -e "${CYAN}🧪 Test build frontend...${NC}"
if npm run build > /dev/null 2>&1; then
    print_success "Build frontend test riuscita"
    # Pulizia
    rm -rf dist 2>/dev/null || true
else
    print_warning "Build frontend test fallita - controllare la configurazione"
fi

print_step "Creazione script di avvio"

# Rendi eseguibili gli script
chmod +x start-unified.sh 2>/dev/null || true
chmod +x setup-unified.sh 2>/dev/null || true

print_success "Script resi eseguibili"

print_step "Setup completato!"

echo ""
echo -e "${PURPLE}🎉 SETUP COMPLETATO CON SUCCESSO! 🎉${NC}"
echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│                    ARCHITETTURA UNIFICATA               │${NC}"
echo -e "${BLUE}├─────────────────────────────────────────────────────────┤${NC}"
echo -e "${BLUE}│ Frontend:  React + Vite + Tailwind CSS                 │${NC}"
echo -e "${BLUE}│ Backend:   ASP.NET Core + SignalR + Entity Framework   │${NC}"
echo -e "${BLUE}│ Database:  SQLite (embedded)                           │${NC}"
echo -e "${BLUE}│ Real-time: WebSocket tramite SignalR                   │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${YELLOW}🚀 COME INIZIARE:${NC}"
echo -e "${CYAN}   1. Esegui: ${GREEN}./start-unified.sh${CYAN} (Linux/Mac)${NC}"
echo -e "${CYAN}      oppure: ${GREEN}start-unified.bat${CYAN} (Windows)${NC}"
echo -e "${CYAN}   2. Apri il browser su: ${GREEN}http://localhost:5174${NC}"
echo -e "${CYAN}   3. Inizia a giocare!${NC}"
echo ""
echo -e "${YELLOW}🔧 ENDPOINT DISPONIBILI:${NC}"
echo -e "${CYAN}   • Frontend:     http://localhost:5174${NC}"
echo -e "${CYAN}   • Backend API:  http://localhost:5000${NC}"
echo -e "${CYAN}   • Health Check: http://localhost:5000/api/health${NC}"
echo -e "${CYAN}   • SignalR Hub:  ws://localhost:5000/gamehub${NC}"
echo ""
echo -e "${YELLOW}⚡ FUNZIONALITÀ PRINCIPALI:${NC}"
echo -e "${CYAN}   • Login/Registrazione utenti${NC}"
echo -e "${CYAN}   • Creazione e gestione coppie${NC}"
echo -e "${CYAN}   • Sessioni di gioco real-time${NC}"
echo -e "${CYAN}   • Controlli amministrativi integrati${NC}"
echo -e "${CYAN}   • Sincronizzazione automatica dei dati${NC}"
echo ""
echo -e "${GREEN}✨ Buon divertimento con il Gioco della Complicità! ✨${NC}"
echo ""
