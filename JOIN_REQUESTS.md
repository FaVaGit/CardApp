# Flusso Richieste di Join (Pairing)

Questo documento descrive la gestione delle richieste di join tra utenti per formare una coppia.

## Obiettivi
- Fornire feedback immediato all'utente che invia una richiesta (optimistic UI)
- Evitare lampeggi / scomparsa prematura del badge "In attesa"
- Sincronizzare periodicamente lo stato reale tramite snapshot/polling

## Cache Locale
L'istanza di `EventDrivenApiService` mantiene:
```js
joinRequestCache = {
  incoming: [], // richieste ricevute
  outgoing: []  // richieste inviate
};
```

## Inserimento Optimistic
Quando `requestJoin(targetUserId)` viene chiamato, il client ora inserisce SUBITO un placeholder ottimistico con `requestId` temporaneo che inizia con `temp-`:
```js
{ requestId: 'temp-<timestamp>-<rand>', requestingUserId, targetUserId, createdAt, _optimistic: true }
```
Alla risposta del backend:
1. Se arriva un `requestId` reale, il placeholder viene sostituito mantenendo `_optimistic: true` finché lo snapshot lo ri-echoa (a quel punto il flag viene rimosso).
2. Se la chiamata fallisce (errore HTTP), il placeholder viene rollbackato (rimosso) per non lasciare richieste zombie.

Il flag `_optimistic` indica che il backend potrebbe non aver ancora propagato la richiesta nello snapshot.

## Reconciliation con Snapshot
Durante `pollForUpdates()` lo snapshot può restituire liste vuote (race iniziale). Regole:
1. Se `outgoingRequests` è vuoto ma esistono record `_optimistic` in cache locale, la cache non viene sovrascritta.
2. Quando il backend inizia a restituire la richiesta, il flag `_optimistic` viene rimosso.

## Cancellazione
`cancelJoin(targetUserId)` rimuove in modo ottimistico il record da `outgoing` e emette `joinRequestsUpdated`.

In caso di errore della chiamata `cancel-join`, la rimozione NON avviene perché avviene solo dopo risposta positiva; l'entry rimane visibile evitando stato incoerente.

## TTL & Pruning
Per evitare che un placeholder `_optimistic` rimanga indefinitamente (es. perdita evento backend):

- `EventDrivenApiService` definisce `optimisticJoinTTL` (default 30000 ms).
- Ad ogni `pollForUpdates()` dopo l'applicazione della logica di riconciliazione, i record `_optimistic` più vecchi del TTL vengono rimossi.
- Per ogni record rimosso viene emesso `joinRequestExpired` con payload `{ request }`.
- Le UI possono ascoltare questo evento per mostrare un messaggio tipo: "Richiesta scaduta, riprova".

### Configurazione
Metodo: `apiService.setOptimisticJoinTTL(ms)` per override runtime.
Metriche disponibili via `apiService.getMetrics()` che restituisce:
```js
{ prunedJoinCount, optimisticJoinTTL }
```
Evento aggiuntivo: `metricsUpdated` emesso quando `prunedJoinCount` cambia.

Motivazione: evita badge bloccati quando il backend non conferma mai la richiesta (es. crash intermedio).

## Approvazione / Coppia Formata
`respondJoin(requestId, true)` pulisce entrambe le liste e emette `coupleJoined`.
Il componente `UserDirectory` ascolta `coupleJoined` e svuota immediatamente inbound/outbound per eliminare il badge "In attesa" senza aspettare il prossimo snapshot.

## Test Unit
Il file `tests/unit/EventDrivenApiService.spec.js` copre:
- Aggiunta optimistica
- Cancellazione
- Approvazione (clear cache + evento)
- Preservazione optimistica con snapshot precoce vuoto
- Fallimento `cancelJoin` (mantiene entry)
- Rollback su fallimento `requestJoin` (rimozione placeholder temp)
- Pruning automatico TTL + evento `joinRequestExpired`
- Configurazione TTL & metriche (`setOptimisticJoinTTL`, `getMetrics`, evento `metricsUpdated`)

## E2E
Gli scenari Playwright (`join-approve`, `cancel-flow`, `reject-flow`, `reconnect-flow`) verificano la coerenza UI, incluso:
- Badge "In attesa" mostrato dopo invio
- Rimozione dopo approvazione / cancellazione / rifiuto
- Persistenza stato dopo reload (reconnect)

## Linee Guida Future
- Evitare di aggiungere logica condizionale duplicata nei componenti: centralizzare in `EventDrivenApiService`.
- Se si introduce WebSocket/SSE in futuro, mantenere la semantica del flag `_optimistic` per transizione graduale.
- Considerare TTL locale per richieste stale se il backend definisce una scadenza.
- Possibile pruning periodico dei placeholder `temp-*` che restano `_optimistic` oltre una finestra (es. 30s) come fallback di sicurezza.
  - (Implementato) TTL interno già attivo; valutare configurazione dinamica da UI.
