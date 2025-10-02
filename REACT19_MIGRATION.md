# Piano Migrazione React 19 (Bozza)

Questo documento delinea i passi preparatori per una futura migrazione a **React 19** senza bloccare lo sviluppo attuale.

## Obiettivi
- Valutare nuove API (Actions, useOptimistic, Form enhancements) e la loro rilevanza.
- Garantire compatibilità librerie: MUI, Testing Library, Playwright, Vitest.
- Minimizzare breaking (rimozione implicit children, changes a defaultStrictMode behaviors se applicabile).

## Stato Attuale
- React 18.3.1
- Nessun StrictMode wrapper globale segnalato nel root (verificare in `main.jsx`).
- Uso hooks standard: useState, useEffect, useRef – niente API sperimentali.

## Checklist Pre‑Upgrade
- [ ] Aggiornare tutte le dipendenze di contorno a versioni che dichiarano compatibilità 19.
- [ ] Verificare MUI release notes per supporto React 19.
- [ ] Eseguire build con React 19 in branch feature e lanciare: unit, integration, e2e.
- [ ] Abilitare StrictMode wrapper temporaneo per surfacing di side‑effect doppi.
- [ ] Aggiornare tipizzazioni `@types/react` a major 19 (coordinato con upgrade runtime).

## Potenziali Aree Sensibili
| Area | Rischio | Mitigazione |
|------|---------|-------------|
| Librerie terze non ancora compatibili | Medium | Bloccare upgrade fino a release compatibile |
| Comportamento useEffect (doppio in dev) | Low | Validare idempotenza side effects |
| Tipizzazioni TS | Low | Allineare `@types/react` e `@types/react-dom` |

## Strategia Branch
1. Creare branch `feat/react19`.
2. Aggiornare versioni (react, react-dom, @types/react*, plugin Vite se richiesto).
3. Eseguire script smoke E2E + full test.
4. Aprire PR con changelog sintetico.

## Rollback Plan
Se emerge incompatibilità critica:
- Revert commit upgrade.
- Annotare issue in `REACT19_MIGRATION.md` sezione "Bloccanti".

## Bloccanti (da compilare)
- _Nessuno al momento_

## Note
Questo documento è vivo: aggiornare dopo ogni evaluation sprint.
