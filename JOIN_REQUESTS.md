# JOIN_REQUESTS.md – Join Requests Optimistiche

Questo documento descrive il lifecycle delle richieste di join (accoppiamento coppia) lato frontend, la strategia Optimistic UI, la riconciliazione tramite snapshot e il meccanismo di pruning.

## Obiettivi
- Feedback immediato all'utente che invia la richiesta (latency hiding)
- Robustezza in presenza di ritardi backend o snapshot inizialmente vuoti
- Rimozione automatica dei placeholder mai confermati (memory hygiene)
- Metriche & telemetria per osservabilità

## Stato Locale
`EventDrivenApiService` mantiene:
```js
joinRequestCache = {
  incoming: [ /* { requestId, requestingUserId, targetUserId, createdAt, _optimistic? } */],
  outgoing: [ /* ... */ ]
};
```
Flag `_optimistic: true` => record creato lato client, non ancora eco dal backend.

## Flusso `requestJoin(targetUserId)`
1. Crea placeholder:
```js
{
  requestId: 'temp-<timestamp>-<rnd>',
  requestingUserId: currentUser,
  targetUserId,
  createdAt: new Date().toISOString(),
  _optimistic: true
}
```
2. Emissione immediata `joinRequestsUpdated`.
3. Chiamata `/request-join`:
   - Successo con `requestId` reale → sostituisce l'id mantenendo `_optimistic`.
   - Risposta senza id → placeholder resta (race server).
   - Errore (throw / HTTP >=400) → rollback (rimozione placeholder) + `joinRequestsUpdated`.

## Reconciliation Snapshot
Ad ogni `pollForUpdates()`:
- Se snapshot `outgoingRequests` è vuoto ma esistono record `_optimistic` → preserva quelli locali (niente flicker).
- Se snapshot contiene gli stessi ID → rimuove `_optimistic`.
- Incoming è sempre sovrascritto.

## Approve / Reject / Cancel
- `respondJoin(requestId, true)` rimuove da both incoming/outgoing e emette:
  - `coupleJoined`
  - `gameSessionStarted` (se sessione auto avviata)
- `respondJoin(requestId, false)` rimuove solo incoming.
- `cancelJoin(targetUserId)` rimuove outgoing alla sola conferma; se fallisce lascia invariato.

## TTL & Pruning
Per evitare richieste zombie:
- Parametro `optimisticJoinTTL` (default 30000 ms; clamp >= `minOptimisticTTL` 500 ms).
- Dopo reconciliation snapshot si filtrano i record `_optimistic` con `now - createdAt > TTL`.
- Ogni rimozione genera:
  - Evento `joinRequestExpired` `{ request }`
  - Incremento metrica `prunedJoinCount` + evento `metricsUpdated`

Persistenza configurazione / metrica in `localStorage['complicity_join_settings']`:
```json
{
  "optimisticJoinTTL": 30000,
  "prunedJoinCount": 5
}
```

## Eventi Coinvolti
| Evento | Quando | Payload |
|--------|--------|---------|
| joinRequestsUpdated | Cache mutate | `{ incoming, outgoing }` |
| joinRequestExpired | Pruning TTL | `{ request }` |
| metricsUpdated | Cambio metrica pruning | `{ prunedJoinCount }` |
| settingsUpdated | Cambio TTL | `{ optimisticJoinTTL }` |
| coupleJoined | Approve | `{ coupleId, partner }` |
| gameSessionStarted | Avvio sessione | `{ sessionId }` |
| telemetryBatch | Flush telemetria | `{ events, at }` |

## Telemetria
Buffer interno → flush (evento `telemetryBatch`) quando:
- Lunghezza >= 20
- Timer periodico (15s)
- Stop polling / disconnect

Eventi enqueue: `metricIncrement`, `settingsUpdated`. Payload generico:
```js
{ type: 'metricIncrement', key: 'prunedJoinCount', value: 1, at: Date.now() }
```

## Failure Scenarios (Mock Interno)
| Scenario | Condizione | Esito |
|----------|-----------|-------|
| Join failure | targetUserId contiene `FAIL` o `TARGET2` | Throw su `/request-join`, rollback placeholder |
| Cancel failure | targetUserId contiene `FAIL` | Throw su `/cancel-join`, cache invariata |
| Snapshot iniziale vuoto | first snapshot flag | Conserva `_optimistic` |

## Edge Cases
- Approve incrociato: la prima risposta valida pulisce entrambe le liste; successive sono idempotenti.
- Cancel dopo approve: no-op (entry già rimossa).
- Partner info ritardato: fallback derivazione da users list + evento `partnerUpdated`.

## API Pubbliche Rilevanti
```ts
requestJoin(targetUserId: string): Promise<{ requestId?: string }>
respondJoin(requestId: string, approve: boolean): Promise<any>
cancelJoin(targetUserId: string): Promise<any>
setOptimisticJoinTTL(ms: number): void
getMetrics(): { prunedJoinCount: number; optimisticJoinTTL: number }
```

## Miglioramenti Futuri
- Countdown visuale TTL lato UI
- Spedizione telemetria a backend
- WebSocket per eliminare polling e latenza conferma
- Audit trail richieste (storico) lato server

---
Fine documento.
