# FRONTEND_EVENTS.md – Eventi Pubblici Frontend

Lista degli eventi emessi da `EventDrivenApiService` con payload e note d'uso.

| Evento | Payload | Descrizione | Note |
|--------|---------|-------------|------|
| `usersUpdated` | `{ users, incoming, outgoing }` | Delta utenti e richieste | Emesso anche dopo pruning richieste |
| `joinRequestsUpdated` | `{ incoming, outgoing }` | Cache richieste aggiornata | Include placeholders `_optimistic` |
| `joinRequestExpired` | `{ request }` | Richiesta ottimistica scaduta | TTL superato, incrementa metrica |
| `metricsUpdated` | `{ prunedJoinCount }` | Metrica pruning aggiornata | Persistita in localStorage |
| `settingsUpdated` | `{ optimisticJoinTTL }` | Cambio TTL ottimistico | Usare per aggiornare UI impostazioni |
| `coupleJoined` | `{ coupleId, partner }` | Coppia formata / approvazione | Avviare UI sessione condivisa |
| `partnerUpdated` | `{ userId, name, personalCode }` | Partner risolto / cambiato | Emette anche in fallback derivato |
| `gameSessionStarted` | `{ sessionId }` | Sessione creata (auto) | Precede carte condivise |
| `sessionUpdated` | `{ type:'cardDrawn', card, drawnBy, timestamp }` | Nuova carta condivisa | `card` è oggetto decodificato |
| `telemetryBatch` | `{ events, at }` | Flush buffer telemetria | Per future analytics |
| `partnerSyncDelay` | `{ polls, sessionId }` | Ritardo partner > soglia | Diagnostica (log UI) |

## Consigli d'Uso
- Sottoscriversi a `joinRequestsUpdated` per aggiornare badge richieste e pulsanti (accept/cancel).
- Usare `metricsUpdated` per pannello diagnostico o tooltip auto‑aggiornato.
- Collegare `telemetryBatch` ad un dispatcher centralizzato se/quando si introduce un backend di logging.
- Gestire idempotenza: alcuni eventi (es. `coupleJoined`) potrebbero arrivare vicino a uno snapshot; UI dovrebbe semplicemente riconciliare stato.

## Sequenza Tipica
```
connectUser → (seed) → snapshot → requestJoin → joinRequestsUpdated (optimistic) → snapshot echo → joinRequestsUpdated (flag rimosso)
respondJoin(approve) → coupleJoined → gameSessionStarted → snapshot (sessione consolidata)
```

## Versionamento
Aggiungere nuove righe mantenendo retro‑compatibilità. Se il payload cambia in modo breaking, annotare una colonna "Breaking" e aggiornare README.

---
Fine file.
