# Join Flow Test

Script: `tests/join-flow.test.sh`

Esegue:
1. Clear utenti (`/api/Admin/clear-users`)
2. Connect di due utenti (Alice, Bob)
3. Richiesta join A->B
4. Approvazione B
5. Verifica coppia e (se creata) sessione di gioco
6. Snapshot finale

## Requisiti
- Backend attivo su http://localhost:5000
- `jq` installato

## Uso
```bash
bash tests/join-flow.test.sh
```
