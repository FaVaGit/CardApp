# TESTING

Panoramica completa dell'approccio di test per il progetto.

## Strati di Test

| Livello | Strumento | Obiettivo | Velocità | Stabilità |
|---------|-----------|-----------|---------|-----------|
| Unit (WIP) | xUnit / Vitest | Logica pura isolata | Alta | Alta |
| Integration API | bash + curl + jq (`tests/*.test.sh`) | Endpoint e contratti principali | Media | Alta |
| E2E UI | Playwright | Comportamento utente end‑to‑end | Media | Alta (con testid) |

## Scope Attuale
- Copertura completa flusso richieste coppia: approve, reject, cancel (shell + E2E)
- Reconnect scenario (E2E)
- Snapshot include: users, requests, stato sessione
- Auto start Game Session dopo coppia completa

## Regressioni Cercate
| Feature | Rischio | Mitigazione Test |
|---------|--------|------------------|
| Casing proprietà JSON (Id/id) | Alto | Parse flessibile + E2E flussi completi |
| Richieste pendenti non ripulite | Medio | Test approve verifica scomparsa badge |
| Flakiness selettori testo | Alto | `data-testid` deterministici |
| Desync optimistic vs polling | Medio | E2E badge appare subito e poi scompare correttamente |
| Race reset ambiente | Medio | Reset opzionale: non fallisce se assente |

## Esecuzione
```bash
# Shell integration (tutto)
./test-all.sh

# Test join singoli
bash tests/join-flow.test.sh
bash tests/reject-flow.test.sh
bash tests/cancel-flow.test.sh

# E2E UI
npx playwright test
```

Per vedere un singolo spec:
```bash
npx playwright test tests/e2e/join-approve.spec.js
```

Report:
```bash
npx playwright show-report
```

## Selettori
Usare esclusivamente `data-testid` nei test Playwright:
- incoming-request-badge
- send-request
- accept-request
- reject-request
- cancel-request

Evita di agganciarti a testo visibile o struttura DOM.

## Pattern di Polling
Utilizziamo `expect.poll` per condizioni eventuali (badge che sparisce, arrivo richiesta).

Esempio (semplificato):
```js
await expect.poll(async () => (await page.locator('[data-testid="incoming-request-badge"]').count()), { timeout: 5000 })
  .toBe(0)
```

## Ottimistic UI
Il frontend marca una richiesta inviata come "In attesa" senza attendere il polling. I test:
1. Verificano apparizione immediata
2. Polling fino allo stato finale (rimosso / convertito in coppia)

## Reset Ambiente
Endpoint admin:
- `POST /api/admin/clear-users`

Nei test E2E il reset è "best effort": eventuale 404 o timing non fallisce lo scenario.

## Troubleshooting
| Sintomo | Causa Probabile | Soluzione |
|---------|-----------------|-----------|
| Warning Node version | Node < 20.19.0 | `nvm use` |
| Badge non appare | Race connect | Aggiungi piccola attesa dopo connect (<500ms) |
| Test E2E sporadicamente fallisce su badge non scomparso | Ritardo polling backend | Aumenta timeout `expect.poll` a 7s |
| Molti utenti residuali | Reset non eseguito | Invoca manualmente `clear-users` |

## Linee Guida per Nuovi Test
1. Aggiungi sempre `data-testid` se manca un selettore stabile.
2. Evita `page.waitForTimeout` salvo backoff minimo; preferisci `expect.poll`.
3. Mantieni flussi brevi e lineari (Arrange → Act → Assert clusterizzato).
4. Un test = un comportamento centrale; evita combinare più esiti (approve + reject insieme).
5. Fallimenti devono produrre messaggi chiari (usa `test.step` se complesso).

## Roadmap Miglioramenti
- Suite unit test carte & snapshot normalizer
- Coverage combinato (frontend + backend)
- Global setup Playwright per pulizia iniziale
- Parallelizzazione spec (shard) in CI
- Lint selettori per vietare uso di testo grezzo
- Mock WebSocket per futura sostituzione polling

## Filosofia
Stabilità > Velocità: preferiamo 1s extra di polling rispetto a test flaky.

## Versioni Chiave
| Componente | Richiesto |
|-----------|-----------|
| Node | 20.19.0+
| .NET SDK | 8.x
| Playwright Browsers | ultima installazione (`npx playwright install`)

---
Aggiornare questo file quando cambia il flusso join, le API snapshot, o la strategia selettori.
