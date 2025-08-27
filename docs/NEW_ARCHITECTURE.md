# 🚀 NUOVA ARCHITETTURA: Event-Driven + RabbitMQ

## 🎯 Principi di Design

### 1. **Frontend = Solo UI Reattiva**
- Nessuna logica di business
- Solo adattamento allo stato ricevuto dal backend
- Interfaccia completamente guidata dagli eventi

### 2. **Backend = State Manager Centralizzato**
- Unica fonte di verità per lo stato del gioco
- Gestisce tutta la logica di business
- Emette eventi per ogni cambiamento di stato

### 3. **RabbitMQ = Message Broker**
- Gestisce tutta la messaggistica real-time
- Pub/Sub pattern per notifiche
- Queue dedicate per ogni utente

### 4. **Auto-Join Logic**
- Ricerca utente per codice personale
- Connessione automatica quando entrambi online
- Avvio automatico del gioco

## 🏗️ Flusso Operativo

```
1. CONNESSIONE UTENTE
   Utente apre app → Login → Backend registra presenza → Queue personale

2. RICERCA PARTNER
   Utente cerca "ABC123" → Backend trova Utente2 → Crea coppia automaticamente

3. AUTO-START
   Entrambi online + In coppia → Backend crea GameSession automaticamente → Emette eventi

4. GIOCO
   Utente1 pesca carta → Backend aggiorna stato → RabbitMQ notifica → Utente2 vede carta

5. SINCRONIZZAZIONE
   Ogni azione → Event → RabbitMQ → Frontend si adatta
```

## 📡 Eventi RabbitMQ

### **User Events**
- `user.connected` - Utente si connette
- `user.disconnected` - Utente si disconnette
- `user.status_changed` - Cambio status utente

### **Couple Events**  
- `couple.created` - Coppia formata automaticamente
- `couple.partner_found` - Partner trovato e connesso
- `couple.dissolved` - Coppia sciolta

### **Game Events**
- `game.session_created` - Sessione di gioco creata automaticamente
- `game.card_drawn` - Carta pescata da un partner
- `game.state_changed` - Cambio stato del gioco
- `game.ended` - Gioco terminato

## 🔧 Implementazione

### **1. Backend Services**
- `UserPresenceService` - Gestisce presenza utenti
- `CoupleMatchingService` - Auto-matching per codice
- `GameStateService` - State manager centralizzato 
- `EventPublisher` - Pubblica eventi su RabbitMQ

### **2. Frontend Components**
- `UserSearch` - Ricerca partner per codice
- `GameStateProvider` - Context per stato gioco
- `RabbitMQClient` - Client per eventi real-time
- `GameUI` - Interfaccia reattiva pure

### **3. RabbitMQ Topology**
- Exchange: `complicity.events` (topic)
- Queues: `user.{userId}` (personali)
- Routing Keys: `user.*`, `couple.*`, `game.*`

## 🎮 User Experience

1. **Utente apre app** → Inserisce nome → Sistema assegna codice (es. "ABC123")
2. **Ricerca partner** → Inserisce codice partner (es. "XYZ789") → Sistema trova e connette
3. **Auto-start** → Quando entrambi online, gioco parte automaticamente
4. **Gioco sincronizzato** → Ogni azione di un partner appare immediatamente all'altro
5. **Zero configurazione** → Nessun bottone "Avvia", nessuna attesa manuale

## ✅ Vantaggi

- **Zero circular references** - Eventi semplici, no oggetti EF complessi
- **Scalabilità** - RabbitMQ gestisce migliaia di connessioni
- **Resilienza** - Queue persistenti, retry automatici
- **Semplicità** - Frontend diventa una "view" pura
- **Real-time** - Latenza minima con pub/sub dedicato
- **Debugging** - RabbitMQ Management UI per monitorare eventi
