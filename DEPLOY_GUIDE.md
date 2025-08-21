# Deploy e Modalità per Gioco della Complicità

## 🔄 Modalità Disponibili

### 🔥 Firebase Mode (Produzione)
**Quando usarla**: Per deploy su siti web pubblici accessibili da qualsiasi dispositivo.

**Vantaggi**:
- ✅ Sincronizzazione real-time tra browser e dispositivi diversi
- ✅ Persistenza dati permanente
- ✅ Presenza online accurata
- ✅ Scalabilità illimitata
- ✅ Backup automatico
- ✅ Deploy su qualsiasi hosting

**Svantaggi**:
- ⚠️ Richiede setup Firebase (5 minuti)
- ⚠️ Quota gratuita limitata (ma generosa)

### 💻 Demo Mode (Sviluppo/Test)
**Quando usarla**: Per sviluppo locale, demo o test rapidi.

**Vantaggi**:
- ✅ Setup zero
- ✅ Nessun account richiesto
- ✅ Funziona offline
- ✅ Perfetto per sviluppo

**Svantaggi**:
- ❌ Solo stesso browser (no sincronizzazione tra dispositivi)
- ❌ Dati si perdono ricaricando
- ❌ Non adatto per uso pubblico

## 🚀 Deploy Opzioni

### 1. Vercel (Consigliato)
```bash
# Build dell'app
npm run build

# Deploy su Vercel
npx vercel --prod
```

**Risultato**: L'app sarà disponibile su `https://tuo-app.vercel.app`

### 2. Netlify
```bash
# Build dell'app
npm run build

# Carica manualmente su netlify.com
# Oppure usa Netlify CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### 3. Firebase Hosting
```bash
# Installa Firebase CLI
npm install -g firebase-tools

# Login e inizializza
firebase login
firebase init hosting

# Build e deploy
npm run build
firebase deploy
```

### 4. GitHub Pages
```bash
# Installa gh-pages
npm install --save-dev gh-pages

# Aggiungi script a package.json:
# "homepage": "https://username.github.io/repository",
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

## ⚙️ Configurazione per Produzione

### Firebase per Produzione

1. **Crea Progetto Firebase**:
   - Vai su [Firebase Console](https://console.firebase.google.com)
   - Crea nuovo progetto
   - Abilita Realtime Database

2. **Configura Regole Sicure**:
   ```json
   {
     "rules": {
       "users": {
         ".read": true,
         ".write": true,
         "$userId": {
           ".validate": "newData.hasChildren(['id', 'name', 'personalCode'])"
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

3. **Copia Configurazione**:
   - Nel setup dell'app, inserisci i dati Firebase
   - Oppure crea file `.env`:
   ```bash
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

### Ottimizzazioni Produzione

1. **Build Ottimizzata**:
   ```bash
   npm run build
   ```

2. **Verifica Bundle Size**:
   ```bash
   npm run build -- --analyze
   ```

3. **Test Produzione Locale**:
   ```bash
   npm run preview
   ```

## 📊 Monitoraggio

### Firebase Analytics
- Vai su Firebase Console > Analytics
- Monitora utenti attivi, sessioni, errori

### Performance
- Firebase Console > Performance
- Traccia tempi di caricamento e performance

### Logs
- Firebase Console > Functions (se usi Cloud Functions)
- Monitora errori e problemi

## 🔒 Sicurezza

### Regole Database
Per produzione, configura regole più restrittive:

```json
{
  "rules": {
    "users": {
      ".read": true,
      "$userId": {
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "couples": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### HTTPS
- Tutti i servizi di hosting (Vercel, Netlify, Firebase) forniscono HTTPS automatico
- Assicurati che il dominio custom usi HTTPS

### Rate Limiting
Firebase include rate limiting automatico, ma puoi configurarlo:
- Firebase Console > Realtime Database > Usage

## 🧪 Testing

### Test Locale
```bash
# Sviluppo
npm run dev

# Test build produzione
npm run build && npm run preview
```

### Test Multi-dispositivo
1. Deploy su ambiente di staging
2. Apri da dispositivi diversi
3. Testa sincronizzazione real-time
4. Verifica presenza online

### Load Testing
Per progetti grandi, usa strumenti come:
- Firebase Load Testing
- Artillery.io
- Apache Bench

## 📞 Supporto e Manutenzione

### Firebase Quotas
- Realtime Database: 100 connessioni simultanee (piano gratuito)
- Upgrade a Piano Blaze se necessario

### Backup
Firebase fa backup automatici, ma puoi esportare dati:
```bash
firebase database:get / --output backup.json
```

### Updates
```bash
# Aggiorna dipendenze
npm update

# Aggiorna Firebase
npm install firebase@latest
```
