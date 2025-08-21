# Changelog

Tutte le modifiche importanti a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Non Rilasciato]

### Aggiunto
- Setup CI/CD con GitHub Actions
- Template per Issues e Pull Request
- Documentazione contribuzione
- File LICENSE MIT
- Workflow automatici per testing e deploy

## [1.0.0] - 2025-08-21

### Aggiunto
- ✨ **Sistema multi-utente completo** con backend ASP.NET Core
- 🎮 **40+ carte** per il Gioco della Complicità in italiano
- 🔄 **SignalR** per sincronizzazione real-time
- 👥 **Sistema di coppie** con codici unici per l'accoppiamento
- 📱 **Design responsive** ottimizzato per mobile e desktop
- 🎨 **Canvas collaborativo** per disegnare insieme
- 💬 **Chat real-time** tra partner
- 📝 **Note condivise** sincronizzate
- 🌐 **Presenza online/offline** in tempo reale
- 📊 **Database SQLite** con Entity Framework Core
- 🛡️ **Gestione errori** robusta
- 📁 **Architettura modulare** con servizi separati

### Tecnico
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: ASP.NET Core 8 + SignalR + EF Core
- **Database**: SQLite per sviluppo locale
- **Real-time**: SignalR Hub per comunicazioni live
- **API**: REST endpoints per operazioni CRUD
- **Build**: Scripts automatici per setup ambiente

### Funzionalità
- Registrazione utenti con codici personalizzati
- Creazione e unione coppie tramite codici
- Sincronizzazione stato gioco tra dispositivi
- Canvas condiviso per attività creative
- Chat testuale real-time
- Note condivise persistenti
- Stato presenza utenti online
- Cronologia carte giocate
- Gestione sessioni multiple

### Sicurezza
- Validazione input lato server
- Gestione sicura delle connessioni SignalR
- Prevenzione XSS nelle chat
- Sanitizzazione dati utente

### Performance
- Lazy loading componenti React
- Ottimizzazione bundle con Vite
- Caching intelligente SignalR
- Database indexing per query veloci

---

## Tipi di Cambiamenti
- `Aggiunto` per nuove funzionalità
- `Modificato` per cambiamenti in funzionalità esistenti
- `Deprecato` per funzionalità che saranno rimosse in versioni future
- `Rimosso` per funzionalità rimosse in questa versione
- `Risolto` per bug fix
- `Sicurezza` in caso di vulnerabilità

---

**Nota**: Le versioni seguono il formato [MAJOR.MINOR.PATCH] dove:
- **MAJOR**: Cambiamenti incompatibili con versioni precedenti
- **MINOR**: Nuove funzionalità compatibili con versioni precedenti  
- **PATCH**: Bug fix compatibili con versioni precedenti
