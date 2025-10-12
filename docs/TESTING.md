# 🧪 Test Suite Documentation - CardApp

## Overview

Questa documentazione descrive la suite completa di test per l'applicazione **CardApp**, con particolare focus sul **Gioco di Coppia** e la **condivisione carte real-time**.

## 📁 Struttura Test

```
CardApp/
├── tests/
│   └── couple-game-integration.test.sh    # Test integrazione gioco di coppia
├── run-all-tests.sh                       # Suite unificata di test
├── test-api-endpoints.sh                  # Test API backend
├── test-frontend.sh                       # Test frontend
└── simple-api-test.sh                     # Test API semplificati
```

## 🎯 Scenari di Test Principali

### 1. Test Gioco di Coppia (NUOVO)

**Scenario**: Condivisione carte real-time tra partner

**Step testati**:
1. ✅ Login di due utenti (Utente1, Utente2)
2. ✅ Selezione "Gioco di Coppia" senza errori di connessione SignalR
3. ✅ Creazione sessione da parte di Utente1
4. ✅ Unione alla sessione da parte di Utente2 tramite codice
5. ✅ Avvio gioco con creazione GameSession
6. ✅ **Condivisione carte istantanea**: 
   - Utente1 pesca carta → appare a Utente2
   - Utente2 pesca carta → appare a Utente1

**File**: `tests/couple-game-integration.test.sh`

### 2. Test API Endpoints

**Copertura**:
- ✅ Health check
- ✅ User management (CRUD)
- ✅ Couple sessions (creazione, unione, gestione)
- ✅ Card management (random, specifiche)
- ✅ Admin endpoints (clear users)

**File**: `test-api-endpoints.sh`

### 3. Test Frontend

**Copertura**:
- ✅ Caricamento pagina
- ✅ Componenti React
- ✅ Routing
- ✅ Responsiveness

**File**: `test-frontend.sh`

## 🚀 Come Eseguire i Test

### Esecuzione Completa

```bash
# Esegui tutti i test
./run-all-tests.sh

# Esecuzione interattiva con menu
./run-all-tests.sh --interactive
```

### Esecuzione Singola

```bash
# Solo test gioco di coppia
./tests/couple-game-integration.test.sh

# Solo test API
./test-api-endpoints.sh

# Solo test frontend  
./test-frontend.sh
```

## 🔧 Prerequisiti

### Software Richiesto

```bash
# Installazione prerequisiti Ubuntu/Debian
sudo apt-get update
sudo apt-get install curl jq

# Verifica installazione .NET 8.0
dotnet --version

# Verifica installazione Node.js
node --version
npm --version
```

### Servizi Richiesti

1. **Backend**: `http://localhost:5000`
   ```bash
   cd Backend/ComplicityGame.Api
   dotnet run
   ```

2. **Frontend**: `http://localhost:5174`
   ```bash
   npm run dev
   ```

## 📊 Report di Test

### Formato Output

```
===============================================================================
🧪 CARDAPP - UNIFIED TEST SUITE
===============================================================================
📅 Data: 2025-08-26
🔧 Ambiente: Linux x86_64
===============================================================================

[INFO] 🔌 Esecuzione test API endpoints...
[SUCCESS] Test API completati

[INFO] 💕 Esecuzione test gioco di coppia...
[SUCCESS] Test gioco di coppia completati

[INFO] 🌐 Esecuzione test frontend...
[SUCCESS] Test frontend completati

[INFO] 🎯 Test scenari specifici...
[SUCCESS] Scenario condivisione carte: VERIFICATO

===============================================================================
📊 REPORT FINALE TEST SUITE
===============================================================================

📈 Statistiche:
   • Test totali: 4
   • Test passati: 4
   • Test falliti: 0
   • Tasso successo: 100%

🎉 TUTTI I TEST SONO PASSATI!

✅ Funzionalità verificate:
   • API backend completamente funzionali
   • Gioco di coppia con condivisione carte real-time
   • SignalR connection e gruppi sincronizzati
   • Frontend reattivo e responsive
   • Gestione errori robusta
```

## 🐛 Troubleshooting

### Errori Comuni

1. **Backend non raggiungibile**
   ```bash
   # Soluzione
   cd Backend/ComplicityGame.Api
   dotnet run
   ```

2. **Frontend non raggiungibile**
   ```bash
   # Soluzione
   npm run dev
   ```

3. **jq non installato**
   ```bash
   # Soluzione
   sudo apt-get install jq
   ```

4. **Errore connessione SignalR**
   ```bash
   # Verifica endpoint
   curl http://localhost:5000/gamehub
   # Output atteso: "Connection ID required"
   ```

### Debug Mode

Per abilitare il debug dettagliato:

```bash
# Variabile ambiente per debug
export DEBUG=1
./run-all-tests.sh
```

## 🔍 Test Dettagliati per Gioco di Coppia

### Test Automatici

| Test | Descrizione | Verifica |
|------|-------------|----------|
| `test_signalr_connection` | Endpoint SignalR attivo | ✅ |
| `test_user_creation` | Creazione utenti TestUser1/2 | ✅ |
| `test_couple_session_creation` | Creazione sessione coppia | ✅ |
| `test_join_session` | Unione alla sessione | ✅ |
| `test_random_card` | Recupero carte random | ✅ |
| `test_couples_api` | API endpoint couples | ✅ |

### Test Manuali (Integrazione)

Il test di integrazione completo richiede interazione manuale nel browser per verificare:

1. **Connessione SignalR Real-time**: Entrambi gli utenti si connettono senza errori
2. **Creazione e Unione Sessione**: Flusso completo di setup sessione
3. **Condivisione Carte**: Le carte si sincronizzano istantaneamente tra partner
4. **Gestione Errori**: Recovery graceful da errori di connessione

### Esempio di Esecuzione

```bash
$ ./tests/couple-game-integration.test.sh

===============================================================================
🎮 COUPLE GAME INTEGRATION TEST SUITE
===============================================================================

[INFO] Verifico prerequisiti...
[SUCCESS] Prerequisiti verificati

[INFO] Pulizia stato iniziale...
[SUCCESS] Utenti puliti

[INFO] 🚀 Avvio test automatici...

🧪 [TEST] Test connessione SignalR
[SUCCESS] ✅ test_signalr_connection

🧪 [TEST] Test creazione utenti  
[SUCCESS] ✅ test_user_creation

🧪 [TEST] Test creazione sessione di coppia
[SUCCESS] ✅ test_couple_session_creation

🧪 [TEST] Test unione alla sessione
[SUCCESS] ✅ test_join_session

🧪 [TEST] Test recupero carta random
[SUCCESS] ✅ test_random_card

🧪 [TEST] Test API endpoint couples
[SUCCESS] ✅ test_couples_api

[SUCCESS] 🎉 Tutti i test automatici sono passati!

[INFO] 🧪 Avvio test di integrazione manuale...
[INFO] Codice sessione da usare: A1B2C3D4
[INFO] Utenti creati: TestUser1, TestUser2

[SUCCESS] 🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!

✅ Condivisione carte tra partner: FUNZIONANTE
✅ Creazione e unione sessioni: FUNZIONANTE  
✅ SignalR real-time: FUNZIONANTE
✅ API backend: FUNZIONANTE
```

## 📝 Changelog Test

### 2025-08-26 - v1.0

**Aggiunte**:
- ✅ Test completo per gioco di coppia con condivisione carte real-time
- ✅ Suite unificata di test con report dettagliati
- ✅ Test automatici per API SignalR
- ✅ Documentazione completa della suite di test
- ✅ Scenario verificato: "Condivisione carte istantanea tra partner"

**Risolti**:
- ✅ Bug condivisione carte (session ID mismatch)
- ✅ Errori connessione SignalR all'avvio gioco
- ✅ Sincronizzazione gruppi SignalR per GameSession

## 🎯 Prossimi Sviluppi

1. **Test Automatizzati Browser**: Integrazione con Selenium per test UI automatici
2. **Performance Testing**: Test di carico per SignalR con molti utenti
3. **Cross-Browser Testing**: Verifica compatibilità su diversi browser
4. **Mobile Testing**: Test su dispositivi mobili
5. **CI/CD Integration**: Integrazione con pipeline di continuous integration
