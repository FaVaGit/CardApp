# 🛠️ Nuove Funzionalità Multi-Device e Settings

## 📋 Panoramica

Sono state implementate tre nuove funzionalità principali per migliorare l'esperienza di testing e gestione dell'app:

### 1. ⚙️ Pannello Impostazioni
### 2. 👥 Lista Utenti Filtrabile  
### 3. 📱 Simulatore Multi-Device

---

## ⚙️ Pannello Impostazioni

Accessibile dalla schermata principale e dalla gestione coppie.

### 🔧 Funzionalità Disponibili:

#### 📊 Statistiche in Tempo Reale
- Utenti totali registrati
- Coppie attive
- Utenti online
- Sessioni di gioco attive

#### 🧹 Gestione Dati
- **Cancella Solo Utenti**: Rimuove tutti gli utenti mantenendo le coppie
- **Cancella Solo Coppie**: Rimuove tutte le coppie mantenendo gli utenti
- **Reset Completo**: Cancella tutto (utenti, coppie, sessioni)

#### 💾 Backup & Ripristino
- **Esporta Dati**: Scarica un file JSON con tutti i dati
- **Importa Dati**: Carica dati da file JSON di backup

#### 🔧 Debug Info
- Utilizzo localStorage
- ID tab corrente
- Timestamp ultima sincronizzazione

---

## 👥 Lista Utenti Filtrabile

Mostra tutti gli utenti registrati con opzioni di filtro avanzate.

### 🔍 Filtri Disponibili:
- **Ricerca per Nome/Codice**: Trova utenti specifici
- **Stato Online/Offline**: Filtra per presenza
- **In Coppia/Singoli**: Filtra per stato relazione

### 📊 Informazioni Mostrate:
- Nome utente e codice personale
- Stato online con indicatore visivo
- Partner attuale (se in coppia)
- Data creazione e ultimo accesso
- Indicazione utente corrente

### 🛠️ Azioni Disponibili:
- **Unisciti**: Collegati direttamente a un utente
- **Dettagli**: Visualizza informazioni complete
- **Elimina**: Rimuovi utente (non il proprio)

---

## 📱 Simulatore Multi-Device

Permette di testare l'app come se si avessero più dispositivi su un singolo browser.

### 🎯 Modalità di Simulazione:

#### 1. 👤 Profili Multipli
- Crea profili separati con dati indipendenti
- Ogni profilo simula un "dispositivo" diverso
- Switch tra profili con reload automatico

#### 2. 🪟 Nuova Finestra
- Apri il profilo selezionato in una nuova finestra
- Test della sincronizzazione in tempo reale
- Ideale per simulare due utenti contemporaneamente

#### 3. 🥷 Modalità Incognito
- Istruzioni per aprire finestra incognito
- localStorage completamente separato
- Simula un dispositivo realmente diverso

### 🔄 Gestione Profili:
- **Crea Profilo**: Nuovo profilo con nome personalizzato
- **Cambia Profilo**: Switch con reload automatico
- **Elimina Profilo**: Rimuovi profili non utilizzati

---

## 🚀 Come Utilizzare per Testing Multi-Device

### Scenario 1: Test su Singolo Browser
1. Vai su **Simulatore Multi-Device**
2. Crea un nuovo profilo (es. "Utente2")
3. Apri in **Nuova Finestra**
4. Registra un utente diverso in ogni finestra
5. Usa i codici per unire gli utenti

### Scenario 2: Test con Incognito
1. Apri una finestra incognito (Ctrl+Shift+N)
2. Vai su `http://localhost:5175`
3. Registra un nuovo utente
4. Nella finestra normale, usa il codice per unirti

### Scenario 3: Test tra Tab
1. Registra un utente in una tab
2. Duplica la tab (Ctrl+D)
3. Nella nuova tab, fai login con lo stesso utente
4. Osserva la sincronizzazione automatica

---

## 🔍 Accesso alle Funzionalità

### 📍 Posizioni dei Pulsanti:

#### Schermata Selezione Modalità:
- ⚙️ **Impostazioni**
- 👥 **Lista Utenti** 
- 📱 **Simula Multi-Device**

#### Gestione Coppie:
- Stessi pulsanti nella sezione "Strumenti Avanzati"

---

## 💡 Suggerimenti per Testing

### ✅ Best Practices:
1. **Usa profili diversi** per simulare utenti su dispositivi separati
2. **Testa la sincronizzazione** aprendo nuove finestre
3. **Backup dei dati** prima di fare reset completi
4. **Monitora le statistiche** per verificare il comportamento
5. **Usa la modalità incognito** per test realistici

### 🎯 Scenari di Test Consigliati:
- Registrazione simultanea di due utenti
- Join tramite codice tra profili diversi
- Sync cross-tab dello stato online
- Avvio sessione di gioco e auto-join del partner
- Reset completo e ri-import dei dati

### 🔧 Debug e Troubleshooting:
- Usa il pannello Debug Info per monitorare lo stato
- Controlla le console del browser per log dettagliati
- Usa "Force Refresh" se la sincronizzazione è lenta
- Verifica che i codici siano copiati correttamente

---

## 🚧 Limitazioni Attuali

- **Cross-Browser**: Non sincronizza tra browser diversi (serve Firebase)
- **Persistenza**: I profili sono locali al browser
- **Real-time**: Sincronizzazione via polling, non WebSocket
- **Network**: Funziona solo su stesso device/rete locale

## 🔮 Prossimi Sviluppi

Per un deployment pubblico reale sarà necessario:
1. Backend Firebase/server per sincronizzazione cross-device
2. Autenticazione persistente
3. WebSocket per real-time sync
4. Database remoto per persistenza utenti

---

L'app è ora pronta per testing multi-device avanzato e gestione completa dei dati! 🎉
