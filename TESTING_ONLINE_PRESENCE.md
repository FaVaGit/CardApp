# Testing della Presenza Online e Codice Utente Personale

## Come testare la nuova funzionalità

### ⚠️ Importante: localStorage vs sessionStorage

La presenza online ora usa **localStorage** che è condiviso tra tab dello stesso browser, ma **NON** tra browser diversi. Per testare realmente la funzionalità multi-device serve un backend.

### Metodo 1: Tab multipli nello stesso browser ✅

1. **Prima tab**:
   - Vai su http://localhost:5174
   - Seleziona modalità "Coppia" + "Multi-utente"  
   - Registra un utente (es. "Marco")
   - Annota il **codice personale** generato automaticamente (es. ABC123)
   - Espandi "🔧 Debug Info Dettagliato" per vedere i dati

2. **Seconda tab**:
   - Apri una nuova tab su http://localhost:5174
   - Seleziona modalità "Coppia" + "Multi-utente"
   - Registra un altro utente (es. "Laura")
   - Clicca "🔄 Force Refresh" se non vedi "Marco" nella lista
   - Dovresti vedere "Marco" nella lista utenti online
   - Clicca "Unisciti" su Marco OPPURE inserisci il suo codice ABC123

### Metodo 2: Browser diversi ❌ 

**LIMITAZIONE**: Non funziona perché localStorage non è condiviso tra browser diversi.

## Debugging Steps

Se gli utenti non si vedono reciprocamente:

1. **Controlla Console Browser (F12)**:
   - Cerca log con `🆕 Registering user`
   - Cerca log con `👥 All users now`
   - Cerca log con `🔄 Refreshing users from localStorage`

2. **Usa Debug Info**:
   - Espandi "🔧 Debug Info Dettagliato"
   - Verifica "Users in localStorage" > 0
   - Verifica "Lista utenti completa" contenga entrambi gli utenti
   - Clicca "🔄 Force Refresh" per forzare sincronizzazione

3. **Verifica localStorage manualmente**:
   ```javascript
   // In Console Browser
   console.log(JSON.parse(localStorage.getItem('complicita_all_users')));
   ```

## Cosa dovrebbe accadere

✅ **Funzionalità implementate:**
- Codice personale automatico a 6 caratteri per ogni utente (formato ABC123)
- Lista utenti online disponibili per pairing (stesso browser)
- Join diretto cliccando su un utente online
- Join manuale inserendo il codice di un utente
- Pulsante "Copia Codice" e condivisione WhatsApp
- Stato online/offline in tempo reale (stesso browser)
- Sincronizzazione tramite localStorage + storage events
- Debug info dettagliato e pulsante Force Refresh

❌ **Limitazioni attuali:**
- La presenza online funziona solo tra tab dello stesso browser (localStorage)
- NON funziona tra browser diversi o dispositivi diversi
- Per vera sincronizzazione multi-device serve un backend/server

## Flusso Semplificato

1. **Registrazione**: Ogni utente ottiene automaticamente un codice personale
2. **Lista Online**: Vedi tutti gli utenti disponibili per formare coppie (stesso browser)
3. **Join**: Clicca "Unisciti" su un utente OPPURE inserisci il suo codice manualmente
4. **Coppia Formata**: Se il join ha successo, si crea automaticamente una coppia
5. **Gioco**: Quando entrambi sono online, si può iniziare la partita

## Debug Info

- Apri Developer Tools (F12)
- Controlla Console per log di debug
- Nella UI, espandi "🔧 Debug Info" per vedere:
  - Numero utenti registrati
  - Numero utenti online  
  - Utenti disponibili per pairing
  - Il tuo codice personale
  - Stato disponibilità

## Vantaggi del nuovo flusso

- **Più semplice**: Non devi inventare nomi per le coppie
- **Più intuitivo**: Vedi direttamente chi è online
- **One-click**: Join immediato su utenti online
- **Codice personale**: Ogni utente ha il suo codice da condividere

## Prossimi passi

Per una vera esperienza multi-device:
1. Implementare backend con WebSocket/Server-Sent Events
2. Database condiviso per utenti e coppie
3. Sistema di notifiche real-time
4. Autenticazione persistente

## Codici personali di esempio

- Formato: 3 lettere + 3 numeri
- Esempi: ABC123, XYZ789, MLA456
- Ogni utente ha il suo codice unico
- Facili da condividere via SMS/WhatsApp
