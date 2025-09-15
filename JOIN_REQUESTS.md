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
Quando `requestJoin(targetUserId)` ha successo (risposta con `requestId`), aggiunge un record:
```js
{ requestId, requestingUserId, targetUserId, createdAt, _optimistic: true }
```
Il flag `_optimistic` indica che il backend potrebbe non aver ancora propagato la richiesta nello snapshot.

## Reconciliation con Snapshot
Durante `pollForUpdates()` lo snapshot può restituire liste vuote (race iniziale). Regole:
1. Se `outgoingRequests` è vuoto ma esistono record `_optimistic` in cache locale, la cache non viene sovrascritta.
2. Quando il backend inizia a restituire la richiesta, il flag `_optimistic` viene rimosso.

## Cancellazione
`cancelJoin(targetUserId)` rimuove in modo ottimistico il record da `outgoing` e emette `joinRequestsUpdated`.

## Approvazione / Coppia Formata
`respondJoin(requestId, true)` pulisce entrambe le liste e emette `coupleJoined`.
Il componente `UserDirectory` ascolta `coupleJoined` e svuota immediatamente inbound/outbound per eliminare il badge "In attesa" senza aspettare il prossimo snapshot.

## Test Unit
Il file `tests/unit/EventDrivenApiService.spec.js` copre:
- Aggiunta optimistica
- Cancellazione
- Approvazione (clear cache + evento)
- Preservazione optimistica con snapshot precoce vuoto

## E2E
Gli scenari Playwright (`join-approve`, `cancel-flow`, `reject-flow`, `reconnect-flow`) verificano la coerenza UI, incluso:
- Badge "In attesa" mostrato dopo invio
- Rimozione dopo approvazione / cancellazione / rifiuto
- Persistenza stato dopo reload (reconnect)

## Linee Guida Future
- Evitare di aggiungere logica condizionale duplicata nei componenti: centralizzare in `EventDrivenApiService`.
- Se si introduce WebSocket/SSE in futuro, mantenere la semantica del flag `_optimistic` per transizione graduale.
- Considerare TTL locale per richieste stale se il backend definisce una scadenza.
