# Test Guide - Gioco della Complicità Multi-User

## Quick Test Flow

### 1. Preparazione Test Multi-Device/Tab

1. **Apri 2 finestre/tab del browser**:
   - Tab 1: http://localhost:5180
   - Tab 2: http://localhost:5180 (incognito mode per simulare dispositivo diverso)

### 2. Test Base: Registrazione e Login

**Tab 1 (Utente A):**
1. Seleziona modalità "Coppia" 
2. Clicca "Registra Nuovo Utente"
3. Inserisci nome: "Alice"
4. Conferma registrazione
5. **Annota il codice join** (es: ABC123)

**Tab 2 (Utente B):**
1. Seleziona modalità "Coppia"
2. Clicca "Registra Nuovo Utente" 
3. Inserisci nome: "Bob"
4. Conferma registrazione
5. **Annota il codice join** (es: XYZ789)

### 3. Test Connessione Partner

**In Tab 1 (Alice):**
1. Vai alla tab "👥 Utenti" 
2. Verifica che Bob appaia nella lista utenti online
3. Vai alla tab "🤝 Unisciti ad un Partner"
4. Inserisci il codice di Bob (XYZ789)
5. Clicca "Unisciti al Partner"

**Risultato atteso:**
- Tab 1: Viene creata la coppia "Alice & Bob"
- Tab 2: Dovrebbe ricevere notifica della coppia creata (verifica console)

### 4. Test Sessione di Gioco

**In Tab 1 (Alice):**
1. Vai alla tab "💑 Coppia"
2. Verifica che Bob sia mostrato come "Online"
3. Clicca "🎮 Inizia Sessione di Gioco"

**In Tab 2 (Bob):**
1. Refresh se necessario
2. Vai alla tab "💑 Coppia" 
3. Dovrebbe vedere la sessione attiva
4. Clicca "Vai alla Sessione →"

### 5. Test Condivisione Carte e Chat

**In Tab 1 (Alice):**
1. Vai alla tab "🎮 Sessione"
2. Clicca "🃏 Condividi Carta"
3. Verifica che la carta appaia
4. Scrivi un messaggio nella chat
5. Invia il messaggio

**In Tab 2 (Bob):**
1. Nella tab "🎮 Sessione"
2. Verifica che la carta condivisa da Alice sia visibile
3. Verifica che il messaggio di Alice appaia nella chat
4. Rispondi con un messaggio

### 6. Test Sincronizzazione Real-time

**Test heartbeat e presenza:**
1. Chiudi Tab 2 (Bob)
2. Aspetta ~60 secondi
3. In Tab 1, verifica che Bob appaia come "Offline"
4. Riapri Tab 2 e fai login con Bob
5. Verifica che Alice veda Bob come "Online" di nuovo

## Features Testate

✅ **Backend Auto-Detection**
- Selezione automatica tra localStorage e simulatedBackend
- Visualizzazione configurazione backend scelta

✅ **Registrazione/Login Multi-User**
- Registrazione nuovi utenti
- Generazione codici join automatici
- Login utenti esistenti

✅ **Gestione Presenza Online**
- Heartbeat ogni 3 secondi
- Lista utenti online aggiornata
- Rilevamento disconnessioni (timeout 60s)

✅ **Gestione Coppie**
- Join tramite codice partner
- Creazione automatica coppie
- Stato partner (online/offline)

✅ **Sessioni di Gioco**
- Creazione sessioni per coppie
- Gestione stato sessione condiviso

✅ **Condivisione Contenuti**
- Condivisione carte dal database expandedCards
- Chat messaggi real-time
- Storico carte condivise

✅ **Sincronizzazione Multi-Device**
- BroadcastChannel per comunicazione cross-tab
- Aggiornamenti real-time tra dispositivi
- Persistenza stato tra refresh

## Debug Tools

### Console Logs
Cerca questi log nella console per verificare il funzionamento:

```
🚀 Inizializzazione del backend simulato richiesta...
✅ Backend simulato inizializzato
🆕 Registrando utente: Alice
✅ Utente registrato con successo
💓 Heartbeat sent for: user123
🤝 Tentativo join con codice: XYZ789
✅ Coppia creata: { name: "Alice & Bob" }
🎮 Sessione creata: { id: "session123" }
🃏 Carta condivisa: { content: "..." }
💬 Messaggio inviato: Hello!
```

### Backend Stats
Nel browser, apri Developer Tools Console e digita:
```javascript
window.simulatedBackend?.getStats()
```

Dovrebbe mostrare:
```
{
  users: 2,
  couples: 1, 
  sessions: 1,
  messages: 5
}
```

## Troubleshooting

### Utenti non appaiono online
- Verifica che entrambi gli utenti abbiano completato la registrazione
- Controlla console per errori heartbeat
- Aspetta max 10 secondi per aggiornamento lista

### Coppia non si crea
- Verifica che il codice sia esatto (6 caratteri)
- Entrambi utenti devono essere `availableForPairing: true`
- Controlla che non siano già in un'altra coppia

### Sessione non si avvia
- Entrambi partner devono essere online
- Deve esistere una coppia valida
- Verifica che non ci sia già una sessione attiva

### Chat/Carte non si sincronizzano
- Verifica BroadcastChannel support nel browser
- Controlla che entrambi tab siano sulla stessa origin
- Forza refresh se necessario

## Limitazioni Conosciute

1. **Incognito Mode**: BroadcastChannel limitato tra tab normali e incognito
2. **Cross-Domain**: Non funziona tra domini diversi  
3. **Storage**: Backend simulato solo in memoria, reset al refresh completo
4. **Timeout**: Presenza offline dopo 60s inattività
5. **Canvas**: Non ancora implementato (placeholder)

## Prossimi Step

- [ ] Implementare canvas condiviso real-time
- [ ] Aggiungere notifiche push per eventi
- [ ] Migliorare UI/UX per feedback utente
- [ ] Aggiungere persistenza dati (localStorage fallback)
- [ ] Implementare riconnessione automatica
- [ ] Aggiungere settings utente e preferenze
