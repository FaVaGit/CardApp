# Firebase Setup per Gioco della Complicità

Questa guida spiega come configurare Firebase per abilitare la sincronizzazione real-time tra dispositivi diversi.

## 🔥 Opzioni di Configurazione

### 1. Modalità Demo (Solo Locale)
- Usa `localStorage` per salvare i dati
- Funziona solo sullo stesso browser/dispositivo
- Non richiede configurazione
- Ideale per test e sviluppo

### 2. Modalità Firebase (Real-time Multi-dispositivo)
- Sincronizzazione automatica tra tutti i dispositivi
- Supporta presenza online real-time
- Richiede configurazione Firebase
- Ideale per produzione e uso pubblico

## 🛠️ Setup Firebase

### Passo 1: Crea Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Clicca "Aggiungi progetto" o "Create a project"
3. Scegli un nome per il progetto (es. "gioco-complicita")
4. Abilita Google Analytics (opzionale)
5. Clicca "Crea progetto"

### Passo 2: Aggiungi App Web

1. Nel dashboard del progetto, clicca "Web" (&lt;/&gt;)
2. Registra l'app con un nome (es. "CardApp")
3. **NON** selezionare "Also set up Firebase Hosting"
4. Clicca "Registra app"
5. Copia le informazioni di configurazione

### Passo 3: Configura Realtime Database

1. Nel menu laterale, vai su "Realtime Database"
2. Clicca "Crea database"
3. Scegli una posizione (es. "europe-west1")
4. Inizia in "Modalità test" per permettere lettura/scrittura
5. Clicca "Fatto"

### Passo 4: Configura Regole Database

Vai su "Regole" e imposta:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **Nota**: Queste regole permettono accesso completo. Per produzione, configura regole più restrittive.

### Passo 5: Inserisci Configurazione nell'App

1. Avvia l'app CardApp
2. Verrai reindirizzato alla pagina di setup Firebase
3. Incolla i valori dalla configurazione Firebase:
   - API Key
   - Auth Domain
   - Database URL
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
4. Clicca "Salva Configurazione Firebase"

## 🔄 Come Funziona la Sincronizzazione

### Struttura Database Firebase

```
gioco-complicita/
├── users/
│   ├── ABC123/
│   │   ├── id: "ABC123"
│   │   ├── name: "Mario"
│   │   ├── personalCode: "ABC123"
│   │   ├── isOnline: true
│   │   └── lastSeen: timestamp
│   └── XYZ789/
│       └── ...
├── couples/
│   └── ABC123_XYZ789/
│       ├── id: "ABC123_XYZ789"
│       ├── user1: { userdata }
│       ├── user2: { userdata }
│       └── createdAt: timestamp
└── sessions/
    └── ABC123_XYZ789_1234567890/
        ├── coupleId: "ABC123_XYZ789"
        ├── mode: { gameType: "couple" }
        ├── currentCardIndex: 0
        ├── chat: { messages }
        └── canvas: { strokes }
```

### Presenza Online

- Ogni utente invia un "heartbeat" ogni 10 secondi
- Gli utenti offline vengono rimossi automaticamente dopo 30 secondi
- Lo stato online viene aggiornato real-time su tutti i dispositivi

### Chat e Canvas

- I messaggi chat vengono sincronizzati istantaneamente
- I disegni sul canvas condiviso appaiono real-time
- Tutti i dati persistono nel database Firebase

## 🚀 Deploy in Produzione

### Opzione 1: Vercel

```bash
npm run build
npx vercel --prod
```

### Opzione 2: Netlify

```bash
npm run build
# Carica la cartella dist/ su Netlify
```

### Opzione 3: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🔒 Sicurezza per Produzione

### Regole Database Avanzate

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": true,
        ".write": "$userId === auth.uid"
      }
    },
    "couples": {
      ".read": true,
      ".write": true
    },
    "sessions": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Variabili Ambiente

Per maggiore sicurezza, usa variabili d'ambiente:

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 🔧 Troubleshooting

### Errore "Permission denied"
- Verifica che le regole del database permettano lettura/scrittura
- Controlla che l'URL del database sia corretto

### Utenti non si vedono online
- Controlla la connessione internet
- Verifica che l'API Key sia corretta
- Controlla la console per errori JavaScript

### Sincronizzazione lenta
- Verifica la posizione del database (scegli la più vicina)
- Controlla la qualità della connessione internet

## 📞 Supporto

Per problemi o domande:
1. Controlla la console del browser per errori
2. Verifica la configurazione Firebase
3. Consulta la [documentazione Firebase](https://firebase.google.com/docs)
