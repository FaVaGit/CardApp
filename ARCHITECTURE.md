# Architettura Multi-Utente - Documentazione Tecnica

## 📋 Panoramica

L'app **Gioco della Complicità** è stata estesa per supportare funzionalità multi-utente, permettendo a più coppie di interagire e giocare insieme in sessioni condivise.

## 🏗️ Architettura Componenti

### 🔄 **App.jsx** - Controller Principale
Il componente principale gestisce due modalità di funzionamento:

```javascript
const [gameMode, setGameMode] = useState('multi'); // 'multi' o 'single'
const [appView, setAppView] = useState('lobby'); // 'lobby', 'single-game', 'multi-game'
```

- **Modalità Multi**: Gestisce lobby, sessioni di gruppo e interazioni tra coppie
- **Modalità Single**: Mantiene la funzionalità originale per coppie private

### 🔧 **useMultiUser.js** - Hook Multi-Utente
Hook personalizzato che simula un backend multi-utente usando localStorage:

```javascript
const {
  currentUser,       // Coppia attualmente loggata
  allUsers,          // Tutte le coppie registrate
  onlineUsers,       // Coppie attualmente online
  gameSession,       // Sessione di gioco attiva
  // ... funzioni di gestione
} = useMultiUser();
```

**Funzionalità Principali:**
- ✅ Registrazione e login coppie
- ✅ Gestione presenza online (heartbeat ogni 30s)
- ✅ Creazione e gestione sessioni di gioco
- ✅ Sistema di messaggistica
- ✅ Condivisione carte tra coppie

### 🚪 **MultiUserLoginForm.jsx** - Autenticazione
Gestisce sia registrazione di nuove coppie che login esistenti:

```javascript
const [isNewCouple, setIsNewCouple] = useState(true);
```

- **Registrazione**: Nome partner 1 & 2, nickname coppia (opzionale), data relazione
- **Login**: Ricerca per nickname o nomi partner
- **Validazione**: Controllo nickname duplicati e campi obbligatori

### 🏛️ **MultiUserLobby.jsx** - Lobby Principale
Interfaccia principale per la selezione delle modalità di gioco:

**3 Opzioni Principali:**
1. **💕 Gioca in Coppia**: Sessione privata solo per la coppia loggata
2. **👥 Crea Gruppo**: Invita altre coppie online per sessioni di gruppo
3. **🔗 Unisciti**: Partecipa a una sessione esistente tramite codice

**Funzionalità:**
- Lista coppie online in tempo reale
- Statistiche globali (coppie registrate, online, carte giocate)
- Sistema di inviti con selezione multipla

### 🎮 **MultiUserGameSession.jsx** - Sessione Multiplayer
Gestisce le sessioni di gioco condivise tra più coppie:

**Componenti Principali:**
- **Area Gioco**: Selettore categorie e pulsante pesca carta
- **Chat Laterale**: Messaggistica in tempo reale tra partecipanti
- **Cronologia Condivisa**: Tutte le carte giocate nella sessione
- **Lista Partecipanti**: Visualizzazione coppie attive

## 🎮 Modalità Dual-Device - Architettura Innovativa

### 📱 **Sistema Due Dispositivi**
La modalità dual-device rappresenta l'evoluzione più avanzata dell'app, permettendo un'esperienza completamente nuova dove ogni partner interagisce dal proprio dispositivo.

### 🔧 **useDualDevice.js** - Hook Dual-Device
Hook specializzato per gestire l'esperienza a due dispositivi:

```javascript
const {
  currentPartner,      // Partner attualmente loggato
  partnerConnection,   // Connessione con l'altro partner
  coupleSession,       // Sessione condivisa della coppia
  sharedCanvas,        // Canvas sincronizzato
  sharedNotes,         // Note condivise
  // ... funzioni specifiche
} = useDualDevice();
```

**Funzionalità Avanzate:**
- ✅ Autenticazione individuale per ogni partner
- ✅ Sincronizzazione real-time tra dispositivi
- ✅ Canvas collaborativo con disegni condivisi
- ✅ Sistema di note sincronizzate
- ✅ Presenza e heartbeat tra partner

### 🎨 **DualDeviceGameSession.jsx** - Interfaccia Collaborativa
Componente avanzato con funzionalità di disegno e annotazione:

**Caratteristiche Principali:**
- **Canvas HTML5**: Disegno collaborativo con pennelli personalizzabili
- **Note Real-Time**: Sistema di messaggistica sincrona
- **UI Personalizzata**: Interfacce diverse per Partner 1 (blu) e Partner 2 (rosa)
- **Controlli Avanzati**: Gestione colori, dimensioni pennello, modalità disegno

### 🗂️ Struttura Dati Dual-Device

### 👤 **Oggetto Partner Individuale**
```javascript
{
  id: "partner-unique-id",
  name: "Marco",
  role: "partner1", // 'partner1' o 'partner2'
  coupleId: "couple-session-id",
  coupleName: "Marco & Sofia",
  partnerName: "Sofia", // Nome dell'altro partner
  deviceId: "device_abc123",
  lastActive: "2024-01-01T12:00:00.000Z",
  preferences: {
    favoriteCategories: ["viaggi", "cibo"],
    drawingColor: "#8b5cf6",
    notificationSound: true
  }
}
```

### 💑 **Oggetto Sessione Coppia**
```javascript
{
  id: "couple-session-id",
  coupleId: "unique-couple-id",
  coupleName: "Marco & Sofia",
  createdAt: "2024-01-01T00:00:00.000Z",
  lastActivity: "2024-01-01T12:00:00.000Z",
  connectedPartners: [
    {
      id: "partner1-id",
      name: "Marco",
      role: "partner1",
      deviceId: "device_abc123",
      lastSeen: "2024-01-01T12:00:00.000Z"
    },
    // ... partner2
  ],
  currentCard: { /* carta attualmente pescata */ },
  sharedCanvas: [
    {
      id: "stroke-id",
      type: "path",
      points: [{ x: 100, y: 150 }, { x: 120, y: 170 }],
      color: "#8b5cf6",
      size: 3,
      authorId: "partner1-id",
      authorName: "Marco",
      timestamp: "2024-01-01T12:00:00.000Z"
    }
  ],
  sharedNotes: [
    {
      id: "note-id",
      content: "Idea interessante per il viaggio!",
      authorId: "partner1-id",
      authorName: "Marco",
      timestamp: "2024-01-01T12:00:00.000Z",
      color: "#8b5cf6",
      isPrivate: false
    }
  ],
  gameHistory: [ /* cronologia carte giocate */ ],
  settings: {
    allowDrawing: true,
    allowNotes: true,
    autoSync: true,
    notificationMode: "gentle"
  }
}
```

## 🔄 Flusso Multi-Utente

### 1. **Registrazione/Login**
```
Avvio App → Selezione Modalità Multi → Form Login → Validazione → Lobby
```

### 2. **Creazione Sessione Gruppo**
```
Lobby → "Crea Gruppo" → Selezione Coppie → Invio Inviti → Avvio Sessione
```

### 3. **Partecipazione Sessione**
```
Lobby → "Unisciti" → Inserimento Codice → Verifica → Ingresso Sessione
```

### 4. **Gameplay Condiviso**
```
Sessione → Pesca Carta → Condivisione Automatica → Chat Discussione → Ripeti
```

## 🔄 Flusso Dual-Device

### 1. **Setup Partner Individuali**
```
Device 1: Avvio → Dual-Device → Partner 1 → Nome Coppia → Attesa Partner 2
Device 2: Avvio → Dual-Device → Partner 2 → Stesso Nome Coppia → Connessione
```

### 2. **Sincronizzazione Real-Time**
```
Partner 1: Pesca Carta → Sync Automatica → Apparizione su Device 2
Partner 2: Vede Carta → Disegna Canvas → Sync → Visualizzazione su Device 1
```

### 3. **Collaborazione Attiva**
```
Entrambi: Vedono Stessa Carta → Ognuno Aggiunge Note → Canvas Condiviso → Discussione Facilitata
```

## 🛠️ Storage e Persistenza

### 🗃️ **localStorage Keys**
- `complicita_current_user`: Coppia attualmente loggata
- `complicita_all_users`: Array di tutte le coppie registrate
- `complicita_game_session`: Sessione di gioco attiva
- `complicita_history`: Cronologia carta (modalità single)

### ⏱️ **Sistema Heartbeat**
```javascript
// Aggiorna presenza ogni 30 secondi
setInterval(() => {
  updateOnlineStatus();
}, 30000);

// Considera offline dopo 5 minuti di inattività
const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
const online = users.filter(user => 
  user.lastSeen && new Date(user.lastSeen).getTime() > fiveMinutesAgo
);
```

## 🔮 Sviluppi Futuri

### 🌐 **Backend Reale**
Per implementare un sistema multi-utente reale servirebbe:

1. **WebSocket Server**: Per comunicazione real-time
2. **Database**: PostgreSQL/MongoDB per persistenza dati
3. **API REST**: Per gestione utenti e sessioni
4. **Autenticazione**: JWT tokens per sicurezza

### 🚀 **Funzionalità Aggiuntive**
- **Notifiche Push**: Inviti e messaggi in tempo reale
- **Matchmaking**: Sistema automatico di accoppiamento coppie
- **Tornei**: Competizioni tra più coppie
- **Achievements**: Sistema di badge e obiettivi
- **Video Chat**: Integrazione chiamate video
- **Geolocalizzazione**: Trova coppie nelle vicinanze

## 🐛 Debug e Testing

### 🔍 **Come Testare**
1. Apri l'app in due schede browser diverse
2. Registra due coppie diverse in ogni scheda
3. Dalla prima coppia, crea una sessione di gruppo
4. Dalla seconda coppia, usa "Unisciti" con il codice sessione
5. Testa chat e condivisione carte

### 📝 **Logs Utili**
```javascript
console.log('Current User:', currentUser);
console.log('All Users:', allUsers);
console.log('Game Session:', gameSession);
console.log('Online Users:', onlineUsers);
```

## 🏁 Conclusione

L'architettura multi-utente simula efficacemente un'esperienza social per coppie, mantenendo la semplicità del sistema locale mentre dimostra come funzionerebbe una versione completamente distribuita con backend reale.
