# 💕 Gioco della Complicità - Card Game per Coppie

Un'applicazione web interattiva progettata per rafforzare i legami tra le coppie attraverso domande, sfide e attività pensate per promuovere la comunicazione e l'intimità.

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

### 1. Clona il Repository
```bash
git clone https://github.com/tuoUsername/CardApp.git
cd CardApp
```

### 2. Avvia il Backend
```bash
cd Backend/ComplicityGame.Api
dotnet restore
dotnet run
```
Il backend sarà disponibile su `http://localhost:5000`

### 3. Avvia il Frontend
```bash
# In una nuova finestra del terminale
cd CardApp
npm install
npm run dev
```
Il frontend sarà disponibile su `http://localhost:5173`

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
