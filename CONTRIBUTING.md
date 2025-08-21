# Contribuire al Gioco della Complicità

Grazie per il tuo interesse nel contribuire a questo progetto! ❤️

## Come Contribuire

### 🐛 Segnalare Bug
1. Controlla che il bug non sia già stato segnalato negli [Issues](https://github.com/FaVaGit/CardApp/issues)
2. Crea un nuovo issue usando il template "Bug Report"
3. Fornisci tutte le informazioni richieste per riprodurre il problema

### 💡 Proporre Nuove Funzionalità
1. Controlla che la funzionalità non sia già stata proposta
2. Crea un nuovo issue usando il template "Feature Request"
3. Descrivi chiaramente il problema che risolve e la soluzione proposta

### 🔧 Contribuire con Codice

#### Setup Ambiente di Sviluppo
```bash
# Clona il repository
git clone https://github.com/FaVaGit/CardApp.git
cd CardApp

# Setup backend
cd Backend/ComplicityGame.Api
dotnet restore
dotnet run

# Setup frontend (in un nuovo terminale)
cd CardApp
npm install
npm run dev
```

#### Processo di Sviluppo
1. **Fork** il repository
2. **Crea un branch** per la tua feature: `git checkout -b feature/nome-feature`
3. **Sviluppa** seguendo le linee guida di codice
4. **Testa** le tue modifiche
5. **Commit** con messaggi descrittivi
6. **Push** sul tuo fork
7. **Crea una Pull Request**

### 📝 Linee Guida per il Codice

#### Frontend (React)
- Usa **Functional Components** con hooks
- Segui le convenzioni di **Tailwind CSS**
- Commenta codice complesso
- Mantieni componenti piccoli e riutilizzabili
- Usa **TypeScript** quando possibile

#### Backend (ASP.NET Core)
- Segui le convenzioni **C#** standard
- Usa **dependency injection**
- Implementa **logging** appropriato
- Gestisci le **eccezioni** correttamente
- Scrivi **test unitari** per la business logic

#### Database
- Usa **Entity Framework migrations**
- Mantieni la **compatibilità backward**
- Documenta cambiamenti al schema

### 🧪 Testing

#### Frontend
```bash
npm run test          # Test unitari
npm run test:e2e     # Test end-to-end
npm run lint         # Linting
```

#### Backend
```bash
dotnet test          # Test unitari
dotnet test --collect:"XPlat Code Coverage"  # Coverage
```

### 📋 Checklist per Pull Request
- [ ] Codice testato localmente
- [ ] Test unitari aggiunti/aggiornati
- [ ] Documentazione aggiornata
- [ ] Nessun warning di build
- [ ] Commit con messaggi significativi
- [ ] PR collegata a issue (se applicabile)

### 🎨 Suggerimenti per Nuove Carte

Se vuoi contribuire con nuove carte per il gioco:

1. **Tema**: Mantieni il focus sulla crescita della relazione
2. **Lingua**: Usa italiano corretto e naturale
3. **Tono**: Mantieni un tono rispettoso e inclusivo
4. **Varietà**: Bilancia domande profonde e attività leggere
5. **File**: Aggiungi le carte in `src/expandedCards.js`

#### Esempio di Carta
```javascript
{
  id: 999,
  text: "Raccontate un ricordo d'infanzia che vi ha segnato positivamente",
  category: "Ricordi",
  difficulty: "medium"
}
```

### 🌍 Internazionalizzazione

Se vuoi aiutare a tradurre l'app:
1. Crea file di traduzione in `src/i18n/`
2. Mantieni lo stesso tono emotivo
3. Adatta le espressioni culturali quando necessario

### 💬 Comunicazione

- **Issues**: Per bug report e feature request
- **Discussions**: Per domande generali e idee
- **Email**: Per questioni private contatta [fabio.vacchino@gmail.com]

### 📖 Codice di Condotta

Questo progetto aderisce al **Contributor Covenant Code of Conduct**. Partecipando, ti impegni a rispettare questo codice.

### 🏆 Riconoscimenti

Tutti i contributori saranno riconosciuti nel README del progetto. Grazie per aiutare a rendere questo progetto migliore per tutte le coppie! 💕

---

**Nota**: Questo è un progetto di passione dedicato alle relazioni di coppia. Manteniamo sempre un approccio rispettoso e inclusivo in tutto quello che facciamo.
