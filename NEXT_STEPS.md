# NEXT STEPS
Roadmap sintetica e priorità dopo stabilizzazione flusso join & test E2E.

## 1. Continuous Integration (Alta Priorità)
- GitHub Actions workflow:
  - Matrix: node 20.x ubuntu-latest (per ora singolo)
  - Job: install, build backend, run shell tests, run Playwright (headed=false)
  - Artifact: playwright-report se fallisce
- Cache: npm + playwright browsers

## 2. Global Test Setup
- Script `tests/e2e/global-setup.js` che:
  - Avvia backend se non attivo
  - Chiama `clear-users`
  - Esce
- Config: `globalSetup` in `playwright.config.js`

## 3. Node Upgrade Ambienti
- Enforce engines in `package.json` (già presente) + doc su `volta` / `nvm`.
- Aggiungere check pretest: script `pretest` che avvisa se version < 20.19.

## 4. Unit Test Coverage
- Backend: xUnit per snapshot builder, cleanup richieste incrociate.
- Frontend: Vitest per normalizzatori e stato ottimistico.
- Report coverage (lcov) pubblicato in CI.

## 5. Migliorare Reconnect Flow
- E2E: validare che token persistente ripristini stato coppia + sessione
- Aggiungere scenario: approvazione mentre uno si disconnette brevemente

## 6. Riduzione Polling
- Introdurre SignalR / WebSocket canale `snapshot-updates`.
- Fallback automatico a polling su errore.

## 7. UX Miglioramenti
- Spinner / shimmer durante primo snapshot
- Stato "scaduta" per richiesta oltre TTL
- Toast feedback su reject / cancel

## 8. Deck & Progressi
- Persistenza carte estratte per sessione (tabella `GameCardsDrawn`)
- Endpoint history ultime N carte
- Test integrati per esaurimento deck

## 9. i18n
- Estrarre stringhe italiane in file JSON
- Wrapper `t(key)` con fallback IT → EN

## 10. Qualità Codice
- ESLint + Prettier config condivisa
- Husky pre-commit: lint + vitest --changed

## 11. Sicurezza & Performance
- (COMPLETATO) Rate limit su request-join (5 ogni 30s, in-memory)
- Debounce client su invio multiplo
- Header `Cache-Control: no-store` su snapshot

### Follow-up Hardening
- Spostare rate limiting su storage distribuito (Redis) per scaling multi istanza
- Aggiungere unit test per logica cleanup finestra rate limit
- Metriche: contatore richieste limitate (esporre endpoint /metrics futura integrazione Prometheus)

## 12. Documentazione
- Diagramma sequence join (PlantUML) in `docs/` + embed README
- Aggiornare `TESTING.md` quando introdotto WebSocket

## 13. Feature Esperimenti
- Modalità "Challenge" con punteggio tempi risposta alle richieste
- Tag categorie carte & filtro preferenze coppia

## Sequenziamento Proposto (Sprint)
| Sprint | Focus |
|--------|-------|
| 1 | CI + Global Setup + Node enforcement |
| 2 | Unit tests + Coverage + Reconnect robusto |
| 3 | SignalR + UX miglioramenti |
| 4 | Deck persistente + History + i18n base |
| 5 | Hardening (rate limit, linting, husky) |

---
Aggiorna questo file man mano che gli item vengono completati o rifocalizzati.
