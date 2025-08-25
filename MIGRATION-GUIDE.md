# 🔄 Guida alla Migrazione - Architettura Unificata

## 📋 Panoramica

Questa guida documenta la migrazione da un'architettura con doppio backend (simulato + reale) a un'architettura unificata con **solo backend ASP.NET Core**.

## 🎯 Obiettivi della Migrazione

- ✅ **Eliminare confusione**: Un solo backend invece di due
- ✅ **Semplificare manutenzione**: Meno codice, meno bug
- ✅ **Migliorare performance**: Architettura più efficiente
- ✅ **Facilitare sviluppo**: Flusso di lavoro più lineare

## 🗂️ File Modificati/Rimossi

### ❌ File Rimossi (Archiviati in `backup/obsolete/`)

| File | Descrizione | Motivo Rimozione |
|------|-------------|------------------|
| `useBackend.js` | Hook per backend simulato | Sostituito da `useUnifiedBackend.js` |
| `BackendService.js` | Servizio backend simulato | Non più necessario |
| `SimulatedBackend.js` | Implementazione backend fake | Usato solo backend reale |
| `App.jsx` | App con doppio backend | Sostituito da `AppUnified.jsx` |
| `SimpleUserLogin.jsx` | Login con backend multiplo | Sostituito da versione unificata |
| `PartnerManagement.jsx` | Gestione partner complessa | Semplificato in versione unificata |

### ✅ File Nuovi/Unificati

| File | Descrizione | Funzionalità |
|------|-------------|--------------|
| `useUnifiedBackend.js` | Hook backend unificato | Gestisce solo backend ASP.NET Core |
| `AppUnified.jsx` | App principale semplificata | Flusso lineare connecting→login→partner→game |
| `SimpleUserLoginUnified.jsx` | Login semplificato | Controlli admin sempre visibili |
| `PartnerManagementUnified.jsx` | Gestione partner essenziale | Tab create/join/status + admin controls |

## 🔄 Modifiche di Architettura

### Prima (Architettura Doppia)
```
React Frontend
     ↕
useBackend ←→ BackendService ←→ SimulatedBackend
     ↕
useRealBackend ←→ RealBackendService ←→ ASP.NET Core
```

### Dopo (Architettura Unificata)
```
React Frontend
     ↕
useUnifiedBackend ←→ ASP.NET Core Backend
                          ↕
                     SQLite Database
```

## 🛠️ Modifiche agli Script

### Nuovi Script

| Script | Piattaforma | Descrizione |
|--------|-------------|-------------|
| `start-unified.sh` | Linux/macOS | Avvio con architettura unificata |
| `start-unified.bat` | Windows | Avvio Windows con architettura unificata |
| `setup-unified.sh` | Linux/macOS | Setup completo ambiente unificato |

### Script Aggiornati

Gli script esistenti rimangono per compatibilità, ma si consiglia di usare le versioni `*-unified.*`.

## 🔗 Modifiche agli Endpoint

### Porte Utilizzate

| Servizio | Porta | Descrizione |
|----------|-------|-------------|
| **Frontend React** | 5173 | Interfaccia utente (Vite) |
| **Backend ASP.NET** | 5000 | API REST + SignalR |

### URL di Accesso

- 🌐 **Applicazione**: http://localhost:5173
- ⚙️ **API Backend**: http://localhost:5000
- 🔍 **Health Check**: http://localhost:5000/api/health
- 🎮 **SignalR Hub**: ws://localhost:5000/gamehub

## 📱 Modifiche all'Interfaccia

### Controlli Admin

I controlli amministrativi sono ora **sempre visibili** in tutte le schermate:

- **Clear Users**: Rimuove tutti gli utenti dal sistema
- **Refresh**: Forza l'aggiornamento di tutti i dati
- **Debug**: Mostra informazioni di debug del sistema
- **Sync**: Sincronizza manualmente i dati

### Flusso Utente Semplificato

1. **Connecting**: Connessione automatica al backend
2. **Login**: Registrazione o accesso con codice personale
3. **Partner Management**: Creazione/join coppie
4. **Game Ready**: Sessioni di gioco attive

## 🔧 Modifiche per Sviluppatori

### Hook Unificato

```javascript
// Prima (multipli hook)
const { ... } = useBackend();
const { ... } = useRealBackend();

// Dopo (un solo hook)
const { ... } = useUnifiedBackend();
```

### Gestione Stato

Tutto lo stato è gestito dal hook `useUnifiedBackend`:
- Connessione backend
- Utenti online
- Coppie attive
- Sessioni di gioco
- Funzioni admin

### Componenti Semplificati

I componenti sono stati semplificati rimuovendo la complessità delle features avanzate:
- Focus sulle funzionalità core
- Interfaccia più pulita
- Meno prop drilling
- Controlli admin integrati

## 🧪 Modifiche ai Test

### Test Backend

```bash
# Health check
curl http://localhost:5000/api/health

# Test API
curl http://localhost:5000/api/users
curl http://localhost:5000/api/game/couples
```

### Test Frontend

Il frontend ora si connette solo al backend reale:
- Nessun mock o simulazione
- Test di integrazione più realistici
- Verifica connessione SignalR

## 📦 Dipendenze

### Rimossi

Nessuna dipendenza rimossa - tutte mantenute per compatibilità.

### Modificati

- **main.jsx**: Importa `AppUnified` invece di `App`
- **package.json**: Nessuna modifica (compatibilità mantenuta)

## 🚀 Procedura di Migrazione

### Per Sviluppatori Esistenti

1. **Backup**: I file esistenti sono in `backup/obsolete/`
2. **Pull**: Ottieni le ultime modifiche dal repository
3. **Setup**: Esegui `./setup-unified.sh` (o `setup-unified.bat`)
4. **Test**: Avvia con `./start-unified.sh` (o `start-unified.bat`)

### Per Nuovi Sviluppatori

1. **Clone**: Clona il repository
2. **Setup**: Esegui lo script di setup unificato
3. **Start**: Avvia l'applicazione unificata

## 🔍 Troubleshooting

### Problemi Comuni

**Backend non si avvia**
```bash
# Verifica .NET SDK
dotnet --version

# Verifica porta 5000 libera
lsof -i :5000
```

**Frontend non si connette**
```bash
# Verifica backend in esecuzione
curl http://localhost:5000/api/health

# Verifica CORS nel browser console
```

**Dati non sincronizzati**
- Usa il pulsante "Sync" nell'interfaccia
- Verifica connessione SignalR nei DevTools
- Prova "Clear Users" e riavvia

## 📈 Benefici della Migrazione

### Per Sviluppatori
- **Codice più pulito**: Meno file, meno complessità
- **Debug più facile**: Un solo flusso dati
- **Setup più rapido**: Meno configurazioni

### Per Utenti
- **Performance migliori**: Meno overhead
- **Stabilità maggiore**: Meno punti di fallimento
- **Funzionalità coerenti**: Comportamento uniforme

### Per Manutenzione
- **Bug ridotti**: Meno codice = meno bug
- **Aggiornamenti semplici**: Un solo backend da mantenere
- **Test più efficaci**: Scenari di test più realistici

## 🎯 Prossimi Passi

1. **Monitoring**: Verifica che tutto funzioni correttamente
2. **Documentation**: Aggiorna documentazione specifica
3. **Training**: Familiarizza team con nuova architettura
4. **Cleanup**: Rimuovi definitivamente file obsoleti quando sicuri

## 📞 Supporto

Per problemi durante la migrazione:
1. Controlla questa guida
2. Verifica log di backend e frontend
3. Usa controlli admin per debug
4. Consulta README-unified.md per riferimento completo

---

**🎉 Migrazione Completata! L'architettura unificata è ora attiva e operativa.**
