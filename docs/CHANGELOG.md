# 📜 CHANGELOG - CardApp

Tutte le modifiche importanti al progetto CardApp sono documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-08-26

### ✅ Aggiunto
- **Gioco di Coppia Real-time**: Condivisione istantanea delle carte tra partner
- **SignalR Groups Management**: Gestione avanzata dei gruppi per GameSession
- **Test Suite Completa**: Suite unificata di test con scenario gioco di coppia
- **Documentazione Testing**: Guida completa in `docs/TESTING.md`
- **Test Integrazione Coppia**: Test automatici + manuali per condivisione carte
- **Interactive Test Runner**: Menu interattivo per selezione test specifici

### 🔧 Modificato
- **CoupleGame.jsx**: Aggiunto supporto per GameSession e auto-join gruppi SignalR
- **GameHub.cs**: Enhanced logging e gestione gruppi Session_{id}
- **GameSessionService.cs**: Migliorata gestione sessioni di gioco
- **README.md**: Aggiornato con nuove funzionalità e risultati test

### 🐛 Risolto
- **Bug condivisione carte**: Fixed session ID mismatch (couple ID vs game session ID)
- **Errori connessione SignalR**: Risolti problemi di connessione all'avvio gioco
- **Sincronizzazione gruppi**: Fixed join automatico ai gruppi GameSession
- **Real-time updates**: Cards ora si sincronizzano istantaneamente tra partner

### 🧪 Test
- **Scenario verificato**: "Utente1 pesca carta → appare a Utente2"
- **Scenario verificato**: "Utente2 pesca carta → appare a Utente1"  
- **Test automatici**: 6 test per API e connessioni SignalR
- **Test manuali**: Integrazione completa con browser in tempo reale

---

## [2.0.0] - 2025-08-25

### ✅ Aggiunto
- **Suite di test unificata**: `test-api-endpoints.sh` con 18 scenari di test
- **Validazione API completa**: Test per consistenza frontend-backend
- **Auto-startup backend**: Test suite self-contained con zero dipendenze
- **Report dettagliati**: Output colorato con statistiche complete
- **Resource cleanup**: Gestione automatica risorse e teardown

### 🔧 Modificato
- **Architecture unificata**: Single backend ASP.NET Core + React frontend
- **API endpoints**: Standardizzazione e consistenza completa
- **Error handling**: Gestione errori robusta con HTTP status appropriati
- **Documentation**: README aggiornato con architettura e risultati test

### 🐛 Risolto
- **6 endpoint mismatches**: Fixed inconsistenze frontend-backend
- **CORS issues**: Configurazione corretta per comunicazione cross-origin
- **Database issues**: Entity Framework Core con SQLite embedded
- **Hot reload issues**: Configurazione Vite ottimizzata

---

## [1.0.0] - 2024-12-XX

### ✅ Aggiunto
- **Applicazione base**: React frontend + ASP.NET Core backend
- **Gioco carte**: Sistema base di carte per il "Gioco della Complicità"
- **User management**: Registrazione e gestione utenti
- **SignalR foundation**: Base per comunicazione real-time
- **SQLite database**: Database embedded per persistenza dati

### 🔧 Iniziale
- **Frontend**: React con Tailwind CSS
- **Backend**: ASP.NET Core con Entity Framework
- **Database**: SQLite per persistenza
- **Real-time**: SignalR per comunicazione WebSocket

---

## 🎯 Prossime Versioni

### [2.2.0] - Planned
- **Mobile responsiveness**: Ottimizzazione per dispositivi mobili
- **Performance testing**: Test di carico per SignalR
- **Advanced analytics**: Tracking utilizzo e performance
- **Enhanced UI/UX**: Miglioramenti interfaccia utente

### [3.0.0] - Future
- **Multi-game support**: Supporto per più tipi di gioco
- **User authentication**: Sistema auth completo
- **Cloud deployment**: Deploy su cloud provider
- **Advanced features**: Funzionalità avanzate di gioco

---

## 📊 Statistiche Versioni

| Versione | Data | Features | Bug Fix | Test Coverage |
|----------|------|----------|---------|---------------|
| 2.1.0 | 2025-08-26 | 6 | 4 | 100% Couple Game |
| 2.0.0 | 2025-08-25 | 5 | 6 | 18 Test Scenarios |
| 1.0.0 | 2024-12-XX | Base | - | Manual |

---

## 🏷️ Tag Convention

- **Major**: Cambiamenti breaking o nuove funzionalità principali
- **Minor**: Nuove funzionalità backward-compatible  
- **Patch**: Bug fixes e miglioramenti minori

Esempio: `v2.1.0` = Major.Minor.Patch
