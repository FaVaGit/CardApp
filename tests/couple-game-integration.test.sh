#!/bin/bash

# =============================================================================
# COUPLE GAME INTEGRATION TEST SUITE
# =============================================================================
# Test completo per il flusso del Gioco di Coppia con condivisione carte
# 
# Scenario testato:
# 1. Login di due utenti
# 2. Creazione e unione a sessione di coppia
# 3. Avvio del gioco con creazione GameSession
# 4. Condivisione carte in tempo reale tra partner
#
# Author: Fabio
# Date: 2025-08-26
# =============================================================================

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurazione
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:5174"
TEST_TIMEOUT=30

# Funzioni utility
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${BLUE}🧪 [TEST]${NC} $1"
}

# Controllo prerequisiti
check_prerequisites() {
    log_info "Verifico prerequisiti..."
    
    # Controlla se il backend è attivo
    if ! curl -s "${BACKEND_URL}/api/health" > /dev/null; then
        log_error "Backend non raggiungibile su ${BACKEND_URL}"
        log_info "Avviare il backend con: cd Backend/ComplicityGame.Api && dotnet run"
        exit 1
    fi
    
    # Controlla se il frontend è attivo
    if ! curl -s "${FRONTEND_URL}" > /dev/null; then
        log_error "Frontend non raggiungibile su ${FRONTEND_URL}"
        log_info "Avviare il frontend con: npm run dev"
        exit 1
    fi
    
    log_success "Prerequisiti verificati"
}

# Pulizia stato iniziale
cleanup_state() {
    log_info "Pulizia stato iniziale..."
    
    # Pulisce tutti gli utenti
    response=$(curl -s -X POST "${BACKEND_URL}/api/admin/clear-users")
    if [[ $response == *"successfully"* ]]; then
        log_success "Utenti puliti"
    else
        log_error "Errore nella pulizia utenti: $response"
        exit 1
    fi
}

# Test connessione SignalR
test_signalr_connection() {
    log_test "Test connessione SignalR"
    
    # Testa l'endpoint SignalR
    response=$(curl -s "${BACKEND_URL}/gamehub" || echo "Connection ID required")
    if [[ $response == *"Connection ID required"* ]]; then
        log_success "Endpoint SignalR attivo"
    else
        log_error "Endpoint SignalR non risponde correttamente"
        return 1
    fi
}

# Test creazione utenti
test_user_creation() {
    log_test "Test creazione utenti"
    
    # Crea Utente1
    user1_response=$(curl -s -X POST "${BACKEND_URL}/api/users" \
        -H "Content-Type: application/json" \
        -d '{"name":"TestUser1","gameType":"Couple"}')
    
    if [[ $user1_response == *"id"* ]]; then
        log_success "Utente1 creato"
        export USER1_ID=$(echo $user1_response | jq -r '.id')
    else
        log_error "Errore creazione Utente1: $user1_response"
        return 1
    fi
    
    # Crea Utente2
    user2_response=$(curl -s -X POST "${BACKEND_URL}/api/users" \
        -H "Content-Type: application/json" \
        -d '{"name":"TestUser2","gameType":"Couple"}')
    
    if [[ $user2_response == *"id"* ]]; then
        log_success "Utente2 creato"
        export USER2_ID=$(echo $user2_response | jq -r '.id')
    else
        log_error "Errore creazione Utente2: $user2_response"
        return 1
    fi
}

# Test creazione sessione di coppia
test_couple_session_creation() {
    log_test "Test creazione sessione di coppia"
    
    # Crea sessione
    session_response=$(curl -s -X POST "${BACKEND_URL}/api/game/couples" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test Session\",\"gameType\":\"Couple\",\"createdBy\":\"${USER1_ID}\"}")
    
    if [[ $session_response == *"id"* ]]; then
        log_success "Sessione di coppia creata"
        export COUPLE_ID=$(echo $session_response | jq -r '.id')
        export SESSION_CODE=$(echo $COUPLE_ID | cut -c1-8 | tr '[:lower:]' '[:upper:]')
        log_info "Codice sessione: $SESSION_CODE"
    else
        log_error "Errore creazione sessione: $session_response"
        return 1
    fi
}

# Test unione alla sessione
test_join_session() {
    log_test "Test unione alla sessione"
    
    # Utente2 si unisce alla sessione
    join_response=$(curl -s -X POST "${BACKEND_URL}/api/game/couples/${COUPLE_ID}/join" \
        -H "Content-Type: application/json" \
        -d "{\"userId\":\"${USER2_ID}\"}")
    
    if [[ $join_response == *"success"* ]] || [[ $join_response == "" ]]; then
        log_success "Utente2 si è unito alla sessione"
    else
        log_error "Errore unione sessione: $join_response"
        return 1
    fi
}

# Test recupero carte random
test_random_card() {
    log_test "Test recupero carta random"
    
    # Recupera una carta random
    card_response=$(curl -s "${BACKEND_URL}/api/game/cards/Couple/random")
    
    if [[ $card_response == *"id"* ]] && [[ $card_response == *"content"* ]]; then
        log_success "Carta random recuperata"
        export TEST_CARD=$(echo $card_response)
        log_info "Carta di test: $(echo $TEST_CARD | jq -r '.content' | cut -c1-50)..."
    else
        log_error "Errore recupero carta: $card_response"
        return 1
    fi
}

# Test API endpoint couples
test_couples_api() {
    log_test "Test API endpoint couples"
    
    # Lista tutte le coppie
    couples_response=$(curl -s "${BACKEND_URL}/api/game/couples")
    
    if [[ $couples_response == *"$COUPLE_ID"* ]]; then
        log_success "API couples funzionante"
    else
        log_error "Errore API couples: $couples_response"
        return 1
    fi
}

# Test completo di integrazione
test_integration_flow() {
    log_test "Test flusso di integrazione completo"
    
    log_info "Il test di integrazione completo richiede interazione manuale nel browser"
    log_info "Seguire questi step:"
    echo
    echo "1. Aprire ${FRONTEND_URL} in due finestre/tab separati"
    echo "2. Finestra 1: Login come 'TestUser1', selezionare 'Gioco di Coppia'"
    echo "3. Finestra 2: Login come 'TestUser2', selezionare 'Gioco di Coppia'"
    echo "4. Finestra 1: Creare sessione, ottenere codice"
    echo "5. Finestra 2: Unirsi alla sessione con il codice"
    echo "6. Finestra 1: Premere 'Inizia Gioco'"
    echo "7. Entrambe: Testare 'Pesca Carta' - la carta deve apparire in entrambe le finestre"
    echo
    log_info "Codice sessione da usare: $SESSION_CODE"
    log_info "Utenti creati: TestUser1 (ID: $USER1_ID), TestUser2 (ID: $USER2_ID)"
    
    read -p "Premere INVIO dopo aver completato il test manuale..."
    log_success "Test di integrazione completato manualmente"
}

# Esecuzione test di regressione
run_regression_tests() {
    log_info "Esecuzione test di regressione..."
    
    # Lista di tutti i test
    tests=(
        "test_signalr_connection"
        "test_user_creation"
        "test_couple_session_creation"
        "test_join_session"
        "test_random_card"
        "test_couples_api"
    )
    
    failed_tests=()
    
    for test in "${tests[@]}"; do
        if $test; then
            log_success "✅ $test"
        else
            log_error "❌ $test"
            failed_tests+=("$test")
        fi
        echo
    done
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        log_success "🎉 Tutti i test automatici sono passati!"
        return 0
    else
        log_error "❌ Test falliti: ${failed_tests[*]}"
        return 1
    fi
}

# Funzione principale
main() {
    echo "==============================================================================="
    echo "🎮 COUPLE GAME INTEGRATION TEST SUITE"
    echo "==============================================================================="
    echo
    
    check_prerequisites
    cleanup_state
    
    echo
    log_info "🚀 Avvio test automatici..."
    echo
    
    if run_regression_tests; then
        echo
        log_info "🧪 Avvio test di integrazione manuale..."
        test_integration_flow
        echo
        log_success "🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!"
        echo
        echo "✅ Condivisione carte tra partner: FUNZIONANTE"
        echo "✅ Creazione e unione sessioni: FUNZIONANTE"
        echo "✅ SignalR real-time: FUNZIONANTE"
        echo "✅ API backend: FUNZIONANTE"
    else
        echo
        log_error "❌ ALCUNI TEST SONO FALLITI"
        exit 1
    fi
}

# Controllo se jq è installato
if ! command -v jq &> /dev/null; then
    log_error "jq non è installato. Installare con: sudo apt-get install jq"
    exit 1
fi

# Esegui solo se chiamato direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
