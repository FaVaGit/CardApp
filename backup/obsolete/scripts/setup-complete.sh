#!/bin/bash

# 🎮 Gioco della Complicità - Setup Completo
# Script per setup automatico dell'ambiente di sviluppo

set -e  # Exit on any error

echo "🎮 Benvenuto nel setup del Gioco della Complicità!"
echo "=================================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Verifica prerequisiti
print_step "Verifica prerequisiti..."

# Verifica Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js non trovato. Installalo da https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_NODE="18.0.0"
if ! printf '%s\n%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V -C; then
    print_error "Node.js $NODE_VERSION trovato, ma è richiesta la versione $REQUIRED_NODE o superiore"
    exit 1
fi
print_success "Node.js $NODE_VERSION ✓"

# Verifica .NET
if ! command -v dotnet &> /dev/null; then
    print_error ".NET SDK non trovato. Installalo da https://dotnet.microsoft.com/download"
    exit 1
fi

DOTNET_VERSION=$(dotnet --version)
print_success ".NET SDK $DOTNET_VERSION ✓"

# Verifica Git
if ! command -v git &> /dev/null; then
    print_error "Git non trovato. Installalo da https://git-scm.com/"
    exit 1
fi
print_success "Git $(git --version | cut -d' ' -f3) ✓"

# Setup Backend
print_step "Setup Backend ASP.NET Core..."
cd Backend/ComplicityGame.Api

# Restore packages
print_step "Ripristino pacchetti .NET..."
dotnet restore
print_success "Pacchetti .NET ripristinati"

# Verifica build
print_step "Verifica build backend..."
dotnet build --no-restore
print_success "Build backend completata"

# Torna alla root
cd ../../

# Setup Frontend
print_step "Setup Frontend React..."

# Installa dependencies
print_step "Installazione dipendenze npm..."
npm install
print_success "Dipendenze npm installate"

# Verifica build frontend
print_step "Verifica build frontend..."
npm run build
print_success "Build frontend completata"

# Setup ambiente
print_step "Configurazione ambiente di sviluppo..."

# Crea file .env se non esiste
if [ ! -f .env ]; then
    cat > .env << EOF
# Frontend Configuration
VITE_API_URL=http://localhost:5000
VITE_SIGNALR_URL=http://localhost:5000/gameHub
VITE_ENV=development

# Development Settings
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
EOF
    print_success "File .env creato"
else
    print_warning "File .env già esistente"
fi

# Verifica porte disponibili
print_step "Verifica porte disponibili..."

check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port &> /dev/null; then
        print_warning "Porta $port occupata (per $service). Potrebbero esserci conflitti."
        return 1
    else
        print_success "Porta $port disponibile per $service"
        return 0
    fi
}

check_port 5000 "Backend"
check_port 5173 "Frontend"

# Crea script di avvio
print_step "Creazione script di avvio..."

cat > start-dev.sh << 'EOF'
#!/bin/bash

# Script per avviare entrambi i servizi in modalità sviluppo

echo "🎮 Avvio Gioco della Complicità in modalità sviluppo..."

# Funzione per cleanup al termine
cleanup() {
    echo "🛑 Terminazione servizi..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Avvia backend in background
echo "🔧 Avvio backend su porta 5000..."
cd Backend/ComplicityGame.Api
dotnet run &
BACKEND_PID=$!
cd ../../

# Aspetta che il backend sia pronto
echo "⏳ Attendo che il backend sia pronto..."
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Backend pronto!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout: backend non risponde"
        kill $BACKEND_PID
        exit 1
    fi
    sleep 1
done

# Avvia frontend
echo "🎨 Avvio frontend su porta 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Servizi avviati con successo!"
echo "📱 Frontend: http://localhost:5173"
echo "⚙️  Backend:  http://localhost:5000"
echo "🔍 Health:   http://localhost:5000/api/health"
echo ""
echo "Premi Ctrl+C per terminare"

# Attendi terminazione
wait
EOF

chmod +x start-dev.sh
print_success "Script start-dev.sh creato"

# Test finale
print_step "Test configurazione finale..."

# Test build backend
cd Backend/ComplicityGame.Api
if dotnet build --no-restore > /dev/null 2>&1; then
    print_success "Backend build test ✓"
else
    print_error "Backend build test fallito"
    exit 1
fi
cd ../../

# Test lint frontend
if npm run lint --if-present > /dev/null 2>&1; then
    print_success "Frontend lint test ✓"
else
    print_warning "Frontend lint non configurato o fallito"
fi

# Riepilogo finale
print_step "Setup completato! 🎉"
echo ""
echo -e "${GREEN}✅ Ambiente di sviluppo configurato con successo!${NC}"
echo ""
echo "📋 Comandi disponibili:"
echo "  ./start-dev.sh           - Avvia entrambi i servizi"
echo "  cd Backend/ComplicityGame.Api && dotnet run - Solo backend"
echo "  npm run dev              - Solo frontend"
echo "  npm run build            - Build frontend per produzione"
echo "  npm run test             - Esegui test"
echo ""
echo "🌐 URLs una volta avviato:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000"
echo "  API Health: http://localhost:5000/api/health"
echo ""
echo -e "${BLUE}💡 Per iniziare: ./start-dev.sh${NC}"
echo ""
echo -e "${YELLOW}📚 Documentazione completa: README.md${NC}"
echo -e "${YELLOW}🤝 Guida contribuzione: CONTRIBUTING.md${NC}"
echo ""
echo "❤️  Buon sviluppo e che il vostro amore cresca sempre di più!"
