# 💕 Gioco della Complicità - Card Game per Coppie

Un'applicazione web interattiva progettata per rafforzare i legami tra le coppie attraverso domande, sfide e attività pensate per promuovere la comunicazione e l'intimità.

## 🚀 Caratteristiche Principali

- **🎮 Gioco Interattivo**: Carte con domande e attività per coppie
- **� Condividi Carta**: Condividi le tue carte preferite sui social media o tramite link
- **�👥 Multi-utente in Tempo Reale**: Sincronizzazione live tramite SignalR
- **📱 Responsive Design**: Ottimizzato per dispositivi mobili e desktop
- **🔗 Sistema di Accoppiamento**: Crea coppie tramite codici unici
- **🌐 Supporto Multi-dispositivo**: Gioca su diversi dispositivi contemporaneamente
- **🏗️ Architettura Centralizzata**: Logica UI gestita completamente dal backend

## 📤 Funzionalità "Condividi Carta"

### ✨ **Cosa Puoi Fare**
- **Condivisioni Rapide**: Condividi direttamente su WhatsApp, Telegram, Twitter, Facebook
- **Link Personalizzati**: Genera link che mostrano la carta condivisa nell'app
- **Copia Intelligente**: Copia il testo della carta o solo il link negli appunti
- **Salvataggio**: Scarica la carta come immagine PNG personalizzata
- **Apertura Diretta**: I link condivisi aprono automaticamente la carta nell'app

### 🎯 **Come Funziona**
1. **Durante il Gioco**: Clicca "📤 Condividi Carta" su qualsiasi carta pescata
2. **Scegli il Metodo**: Seleziona tra social media, link, copia o salvataggio
3. **Condivisione Automatica**: La carta viene formattata e condivisa con design professionale
4. **Ricezione**: Chi riceve il link vede la carta in un viewer speciale

### 🔗 **Dove Appare**
- **Gioco Privato**: Nelle carte pescare nella modalità privata
- **Sessioni Multi-utente**: Durante le sessioni di gruppo
- **Partner Management**: Nelle carte condivise nella sessione attiva
- **Dual-Device**: Nella modalità dual-device per coppie

### 📱 **Formati Supportati**
- **Nativo Mobile**: Usa il menu di condivisione del telefono
- **Social Media**: Collegamenti diretti a WhatsApp, Telegram, ecc.
- **Link Web**: URL che apre la carta direttamente nell'app
- **Immagine**: PNG ad alta risoluzione con design personalizzato

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** con Hooks e componenti funzionali
- **Vite** per il build system e hot-reload
- **Tailwind CSS** per styling responsive
- **@microsoft/signalr** per comunicazione real-time

### Backend
- **ASP.NET Core 8** Web API
- **SignalR** per comunicazione bidirezionale
- **Entity Framework Core** con SQLite per persistenza
- **C# 12** con nullable reference types

## 🏗️ Architettura del Sistema

### Architettura Centralizzata (Backend-Driven UI)
Il sistema implementa un'architettura completamente centralizzata dove:

- **Backend**: Gestisce tutta la logica di business e calcola i permessi UI
- **Frontend**: Si adatta dinamicamente ai permessi ricevuti dal backend
- **Sincronizzazione**: Garantita attraverso l'endpoint `/api/users/{userId}/state`

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend A    │    │   Frontend B    │    │   Frontend C    │
│   (React)       │    │   (React)       │    │   (React)       │
└─────┬───────────┘    └─────┬───────────┘    └─────┬───────────┘
      │                      │                      │
      └──────────────────────┼──────────────────────┘
                             │
            ┌─────────────────▼─────────────────┐
            │        Backend Centralizzato      │
            │     (ASP.NET Core + SignalR)     │
            │                                  │
            │  ┌─────────────────────────────┐ │
            │  │     UserStateDto + Logic    │ │
            │  │   - User                    │ │
            │  │   - CurrentCouple           │ │
            │  │   - ActiveSession           │ │
            │  │   - OnlineUsers             │ │
            │  │   - Permissions ✨          │ │
            │  └─────────────────────────────┘ │
            └─────────────────┬─────────────────┘
                             │
            ┌─────────────────▼─────────────────┐
            │         Database SQLite          │
            │   Users | Couples | Sessions     │
            └───────────────────────────────────┘
```

### Struttura del Progetto
```
CardApp/
├── src/                          # Frontend React
│   ├── PartnerManagement.jsx     # Componente principale (centralizzato)
│   ├── BackendService.js         # Client API per backend
│   ├── useBackend.js             # Hook personalizzato
│   └── App.jsx                   # Componente root
├── Backend/                      # Backend ASP.NET Core
│   └── ComplicityGame.Api/
│       ├── Controllers/
│       │   ├── UsersController.cs     # Endpoint GetUserState
│       │   └── GameController.cs      # API gioco
│       ├── Services/
│       │   └── UserService.cs         # Logica centralizzata ✨
│       ├── Models/
│       │   ├── User.cs
│       │   ├── Couple.cs
│       │   └── GameSession.cs
│       ├── DTOs/
│       │   ├── UserStateDto.cs        # DTO principale ✨
│       │   └── UserPermissions.cs     # Permessi UI ✨
│       └── Hubs/
│           └── GameHub.cs             # SignalR Hub
└── docs/                         # Documentazione
```

## 🎯 Implementazioni Recenti (Dicembre 2024)

### ✅ Sistema di Permessi Centralizzato
- **UserPermissions**: Classe che definisce tutti i permessi UI
- **CalculateUserPermissions()**: Metodo che calcola i permessi basati sullo stato utente
- **Frontend Reattivo**: UI che si adatta automaticamente ai permessi del backend

### ✅ Tab "Utenti" Sempre Abilitata
**Problema Risolto**: "La Tab utenti dovrebbe essere sempre abilitata"

**Implementazione**:
- **Backend**: `CanViewUsers = true` per tutti gli stati utente
- **Frontend**: Rimossa logica `disabled={!canViewUsers}`
- **Contenuto Contestuale**: 
  - Utenti singoli → Lista utenti con pulsanti "Unisciti"
  - Utenti in coppia → Info coppia + pulsante "Inizia Sessione"

### ✅ Avvio Sessioni di Gioco dalla Tab Utenti
**Funzionalità Aggiunta**: Possibilità di iniziare sessioni di gioco direttamente dalla tab Utenti

**Implementazione**:
- **Pulsante "Inizia Sessione"** quando l'utente è in coppia e può iniziare
- **Pulsante "Vai alla Sessione Attiva"** se esiste già una sessione
- **Messaggio di attesa** se il partner non è online

### ✅ Sincronizzazione Multi-Istanza
**Architettura**: Tutte le istanze frontend ricevono lo stesso stato dal backend
- **Endpoint**: `/api/users/{userId}/state` ritorna UserStateDto completo
- **Real-time**: SignalR aggiorna tutte le istanze contemporaneamente
- **Consistenza**: Nessuna logica di stato locale, tutto centralizzato

## 🚀 Avvio Rapido

### Prerequisiti
- **Node.js** 18+ e npm
- **.NET 8 SDK**
- **Git**

### Avvio Automatico (Consigliato) 🎯

#### Su Linux/macOS:
```bash
# Avvio completo con log dettagliati
./start.sh

# Oppure avvio rapido in background
./quick-start.sh
```

#### Su Windows:
```cmd
# Doppio click su start.bat oppure:
start.bat
```

### Avvio Manuale
```bash
# Terminale 1 - Backend
cd Backend/ComplicityGame.Api
dotnet run

# Terminale 2 - Frontend  
npm run dev
```

🌐 **Applicazione pronta su:** http://localhost:5173  
🔗 **API Backend su:** http://localhost:5000

## 🎮 Come Giocare

### 1. **Registrazione**
- Crea un account con il tuo nome
- Ricevi automaticamente un codice personale (es. ABC123)

### 2. **Formazione Coppia**
- **Unisciti**: Inserisci il codice del tuo partner nella tab "🤝 Unisciti ad un Partner"
- **Automatico**: La coppia viene creata automaticamente

### 3. **Naviga tra le Tab**
- **👥 Utenti**: Sempre abilitata - vedi altri utenti o gestisci sessioni
- **💑 Coppie**: Visualizza tutte le coppie attive  
- **🎮 Sessione**: Gioca quando entrambi siete online

### 4. **Gioco Real-time**
- **Pesca Carte**: Condivise automaticamente con il partner
- **Chat**: Comunicazione istantanea
- **Sincronizzazione**: Tutto aggiornato in tempo reale

## 🔧 API Endpoints Principali

### User State (Centralizzato)
```http
GET /api/users/{userId}/state
```
**Response**: UserStateDto completo con permessi calcolati

### Gestione Utenti
```http
POST /api/users/login          # Login/registrazione
GET  /api/users               # Lista utenti online
POST /api/users/{id}/presence  # Aggiorna presenza
```

### Gestione Coppie
```http
POST /api/game/join           # Unisciti a partner
POST /api/game/leave          # Lascia coppia
GET  /api/game/couples        # Lista coppie attive
```

### Sessioni di Gioco
```http
POST /api/game/start          # Inizia sessione
POST /api/game/card           # Condividi carta
POST /api/game/message        # Invia messaggio
```

## 🛡️ Sicurezza e Persistenza

### Database SQLite
- **Utenti**: Gestione presence e codici unici
- **Coppie**: Relazioni tra utenti con ruoli
- **Sessioni**: Tracking di sessioni di gioco attive
- **Auto-Migration**: Database creato automaticamente al primo avvio

### Gestione Errori
- **Connection Retry**: Riconnessione automatica SignalR
- **Fallback States**: Stati di fallback quando backend non disponibile
- **Error Boundaries**: Gestione errori React

## 🧪 Debug e Testing

## 🧪 Debug e Testing

### Logs del Backend
Il backend produce logs dettagliati per:
- Connessioni SignalR con ID sessioni
- Query Entity Framework con parametri
- Calcolo permessi e stato utente
- Operazioni CRUD su database

### Testing Multi-utente
1. **Apri due browser** (normale + incognito)
2. **Registra due utenti** con nomi diversi
3. **Forma una coppia** usando i codici
4. **Testa sincronizzazione** tra le istanze

### Debug Console
Usa i pulsanti di debug nell'interfaccia:
- **🐛 Debug**: Mostra stato completo in console
- **🔄 Sync**: Forza sincronizzazione (se necessario)

## 🔧 Risoluzione Problemi

### Porte Occupate
```bash
# Libera tutte le porte
lsof -ti:5000 | xargs -r kill -9  # Backend
lsof -ti:5173 | xargs -r kill -9  # Frontend
```

### Database Issues
```bash
# Reset database
rm Backend/ComplicityGame.Api/game.db
# Riavvia backend - verrà ricreato automaticamente
```

### Cache Problems
```bash
# Pulisci cache Vite
rm -rf node_modules/.vite

# Reinstalla dipendenze (se necessario)
rm -rf node_modules
npm install
```

## 🚀 Deploy e Produzione

### Backend (ASP.NET Core)
```bash
# Build produzione
cd Backend/ComplicityGame.Api
dotnet publish -c Release

# Deploy su IIS/Linux
# Configura connection string per database produzione
```

### Frontend (React + Vite)
```bash
# Build per produzione
npm run build

# Deploy su Vercel/Netlify
# Upload cartella dist/
```

### Variabili d'Ambiente
```bash
# Backend
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection="Data Source=/path/to/production.db"

# Frontend  
VITE_API_URL=https://your-backend-api.com
```

## 📈 Roadmap Future

### 🎯 Prossime Implementazioni
- [ ] **Notifiche Push**: Avvisi quando il partner è online
- [ ] **Temi Personalizzati**: Personalizzazione colori e stili
- [ ] **Statistiche Coppia**: Analytics su sessioni e carte giocate
- [ ] **Import/Export**: Backup e restore delle sessioni
- [ ] **Multi-lingua**: Supporto per altre lingue

### 🔧 Miglioramenti Tecnici
- [ ] **Redis Cache**: Per scalabilità multi-server
- [ ] **PostgreSQL**: Upgrade da SQLite per produzione
- [ ] **Docker**: Containerizzazione completa
- [ ] **CI/CD**: Pipeline automatiche di deploy
- [ ] **Monitoring**: Logs strutturati e metriche

## 🤝 Contribuire

1. **Fork** del progetto
2. **Branch** per la feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** delle modifiche (`git commit -m 'Add AmazingFeature'`)
4. **Push** sul branch (`git push origin feature/AmazingFeature`)
5. **Pull Request**

### 🎨 Guidelines di Sviluppo
- **Backend-First**: Tutta la logica va nel backend
- **DTO Pattern**: Usa UserStateDto per comunicazione frontend-backend
- **Permissions**: Calcola permessi UI nel backend (UserService)
- **Real-time**: Usa SignalR per aggiornamenti live
- **Error Handling**: Gestisci sempre gli errori di rete

## 📝 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## ❤️ Ringraziamenti

- Progetto nato dall'idea di rafforzare i rapporti di coppia attraverso la tecnologia
- Architettura ispirata dalle migliori pratiche di sviluppo full-stack moderno
- Costruito con amore per le coppie che vogliono crescere insieme

---

**💕 Buon divertimento e che il vostro amore cresca sempre di più!**

*Ultima aggiornamento: Dicembre 2024 - Versione con Architettura Centralizzata*

## 🚀 Deploy e Produzione

### Deploy su IIS (Windows Server)
1. Pubblica il backend: `dotnet publish -c Release`
2. Build del frontend: `npm run build`
3. Configura IIS con i file generati
4. Aggiorna connection string per database produzione

### Deploy su Docker
```dockerfile
# Dockerfile di esempio per il backend
FROM mcr.microsoft.com/dotnet/aspnet:8.0
COPY Backend/ComplicityGame.Api/bin/Release/net8.0/publish/ /app/
WORKDIR /app
EXPOSE 80
ENTRYPOINT ["dotnet", "ComplicityGame.Api.dll"]
```

### Deploy su Vercel/Netlify (Frontend)
```bash
npm run build
# Carica la cartella dist/ su Vercel/Netlify
```

### Variabili d'Ambiente Produzione
```bash
# Backend
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection="Server=..."

# Frontend
VITE_API_URL=https://your-backend-api.com
```tà pensate per promuovere la comunicazione e l'intimità.

## 🚀 Caratteristiche Principali

- **🎮 Gioco Interattivo**: Carte con domande e attività per coppie
- **👥 Multi-utente in Tempo Reale**: Sincronizzazione live tramite SignalR
- **📱 Responsive Design**: Ottimizzato per dispositivi mobili e desktop
- **🔗 Sistema di Accoppiamento**: Crea coppie tramite codici unici
- **🌐 Supporto Multi-dispositivo**: Gioca su diversi dispositivi contemporaneamente

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** con Hooks
- **Vite** per il build system
- **Tailwind CSS** per lo styling
- **SignalR Client** per la comunicazione in tempo reale

### Backend
- **ASP.NET Core 8** Web API
- **SignalR** per la comunicazione real-time
- **Entity Framework Core** con SQLite
- **C# 12** con nullable reference types

## 🏗️ Architettura

```
CardApp/
├── src/                    # Frontend React
│   ├── components/         # Componenti riutilizzabili
│   ├── services/          # Servizi e API client
│   └── hooks/             # Custom React hooks
├── Backend/               # Backend ASP.NET Core
│   └── ComplicityGame.Api/
│       ├── Controllers/   # API controllers
│       ├── Services/      # Business logic
│       ├── Models/        # Data models
│       └── Hubs/          # SignalR hubs
└── docs/                  # Documentazione
```

## 🚀 Avvio Rapido

### Prerequisiti
- **Node.js** 18+ e npm
- **.NET 8 SDK**
- **Git**

## 🚀 Avvio Rapido

### Opzione 1: Script Automatico (Consigliato) 🎯

#### Su Linux/macOS:
```bash
# Avvio completo con log dettagliati
./start.sh

# Oppure avvio super rapido (in background)
./quick-start.sh
```

#### Su Windows:
```cmd
# Doppio click su start.bat oppure:
start.bat
```

### Opzione 2: Setup Completo
```bash
# Prima volta: setup completo dell'ambiente
./setup-complete.sh

# Poi usa lo script generato:
./start-dev.sh
```

### Opzione 3: Manuale
```bash
# Terminale 1 - Backend
cd Backend/ComplicityGame.Api
dotnet run

# Terminale 2 - Frontend  
npm run dev
```

🌐 **Applicazione pronta su:** http://localhost:5173

## 🎮 Come Giocare

1. **Registrazione**: Crea un account con il tuo nome
2. **Crea/Unisciti a una Coppia**: 
   - Crea una nuova coppia e condividi il codice
   - Oppure inserisci il codice del tuo partner
3. **Gioca Insieme**: Pescate carte e godetevi l'esperienza insieme!

## 🔧 Funzionalità Tecniche

### Sistema di Accoppiamento
- Codici unici di 6 caratteri per ogni utente
- Creazione automatica di coppie tra utenti
- Stato online/offline in tempo reale

### Sincronizzazione Real-time
- **SignalR** per aggiornamenti istantanei
- Notifiche di presenza utente
- Condivisione carte e messaggi

### Database
- **SQLite** per sviluppo locale
- **Entity Framework Core** per ORM
- Migrazioni automatiche al primo avvio

## 📁 File di Configurazione

### Frontend (`package.json`)
```json
{
  "name": "cardapp",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Backend (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=game.db"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

## � Debug e Testing

### Logs del Backend
Il backend produce logs dettagliati per:
- Connessioni SignalR
- Operazioni database
- Gestione errori

### Testing Multi-utente
1. Apri due browser (normale + incognito)
2. Registra due utenti diversi
3. Crea una coppia e testa la sincronizzazione

## 🔥 Sincronizzazione Multi-Dispositivo

Questa versione implementa un sistema completo di backend ASP.NET Core con:
- **SignalR Hub** per comunicazioni real-time
- **Entity Framework** per persistenza dati  
- **API REST** per operazioni CRUD
- **Supporto multi-dispositivo** nativo

## 🤝 Contribuire

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Pusha sul branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## � Ringraziamenti

- Progetto nato dall'idea di rafforzare i rapporti di coppia
- Ispirato dalle moderne tecnologie web per esperienze real-time
- Costruito con amore per le coppie che vogliono crescere insieme

---

**💕 Buon divertimento e che il vostro amore cresca sempre di più!**

## 🎯 Funzionalità Multi-Utente

### 🤝 **Sistema Semplificato**
- **Codice Personale**: Ogni utente riceve un codice automatico (es. ABC123)
- **Join One-Click**: Inserisci il codice del partner per formare una coppia
- **Sincronizzazione Automatica**: Chat, canvas e gioco sincronizzati istantaneamente
- **Presenza Real-time**: Vedi quando il partner è online

## 🎮 Come Usare la Modalità Multi-Coppia

### 🚀 **Primo Accesso**
1. All'avvio dell'app, scegli **"Modalità Multi-Coppia"**
2. Se siete nuovi: compilate il form di registrazione con i vostri nomi e nickname
3. Se siete già registrati: inserite il vostro nickname o nomi per accedere

### 👥 **Lobby Multi-Coppia**
- **Visualizza Coppie Online**: Vedi quali coppie sono attualmente attive
- **Crea Sessione di Gruppo**: Invita altre coppie per giocare insieme
- **Unisciti con Codice**: Inserisci un codice sessione per unirti a un gruppo
- **Gioco Privato**: Inizia una sessione solo per la vostra coppia

### 🎲 **Sessioni di Gruppo**
- **Pesca Carte Condivise**: Ogni carta pescata viene vista da tutto il gruppo
- **Chat di Gruppo**: Commentate e discutete insieme le risposte
- **Cronologia Condivisa**: Vedete tutte le carte giocate nella sessione
- **Partecipanti**: Lista dinamica di tutte le coppie nella sessione

### 🔄 **Passa tra le Modalità**
Puoi sempre passare da una modalità all'altra usando i pulsanti:
- **"Modalità Multi-Coppia"** per entrare nella lobby globale
- **"Modalità Privata"** per una sessione intima solo per voi

## 🎮 Come Usare la Modalità Dual-Device

### 🚀 **Setup Iniziale**
1. **Partner 1**: Apri l'app e seleziona "Modalità Dual-Device"
2. **Scegli Ruolo**: Seleziona se sei Partner 1 (👨 blu) o Partner 2 (👩 rosa)
3. **Inserisci Dati**: Nome personale, nome coppia e nome dell'altro partner
4. **Partner 2**: Apri l'app su un altro dispositivo
5. **Stesso Nome Coppia**: Usa esattamente lo stesso nome coppia per sincronizzarti

### 🎨 **Canvas Collaborativo**
- **Attiva Disegno**: Clicca "🎨 Canvas" per aprire l'area di disegno
- **Modalità Disegno**: Attiva "✏️ Disegno ON" per iniziare a disegnare
- **Personalizza**: Scegli colore e dimensione del pennello
- **Sincronizzazione**: I disegni appaiono istantaneamente sull'altro dispositivo
- **Pulisci**: Usa "Pulisci" per ricominciare da capo

### 📝 **Note Condivise**
- **Apri Note**: Clicca "📝 Note" per vedere tutte le note condivise
- **Scrivi**: Aggiungi note che saranno visibili ad entrambi i partner
- **Identificazione**: Ogni nota mostra chi l'ha scritta e quando
- **Tempo Reale**: Le note si sincronizzano automaticamente

### 🎲 **Gioco Sincronizzato**
- **Pesca Carte**: Quando un partner pesca una carta, appare su entrambi i dispositivi
- **Risposte Individuali**: Ognuno può rispondere usando il proprio schermo
- **Condivisione Idee**: Usate canvas e note per condividere pensieri creativi

## 🛡️ Privacy e Sicurezza

### 🔒 **Dati Locali**
- Tutti i dati vengono salvati **solo localmente** sul vostro dispositivo
- Nessun server esterno raccoglie le vostre informazioni
- Le chat e le sessioni sono simulate localmente

### 🌐 **Simulazione Multi-Utente**
- Il sistema multi-utente è **simulato localmente** per scopi dimostrativi
- In una versione reale, userebbe WebSockets e un database condiviso
- Perfetto per testare l'interfaccia e l'esperienza utente

## ❤️ Dedica

Questo progetto è dedicato a tutte le coppie che credono nel potere della comunicazione, del gioco e della crescita condivisa. Ogni carta è stata pensata per creare momenti di connessione autentica e duratura.
