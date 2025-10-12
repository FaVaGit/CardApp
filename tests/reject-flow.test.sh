#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:5000/api/EventDrivenGame"
ADMIN_URL="http://localhost:5000/api/Admin"

echo "🔄 Pulizia utenti precedenti (reject-flow)..."
curl -s -X POST "$ADMIN_URL/clear-users" -H 'Content-Type: application/json' >/dev/null || true
sleep 1

# Connect requester (A) and target (B)
echo "👤 Connect User A (Richiedente)"
RESP_A=$(curl -s -X POST "$BASE_URL/connect" -H 'Content-Type: application/json' -d '{"Name":"Raffa"}')
USER_A_ID=$(echo "$RESP_A" | jq -r '.status.userId')

echo "👤 Connect User B (Target)"
RESP_B=$(curl -s -X POST "$BASE_URL/connect" -H 'Content-Type: application/json' -d '{"Name":"Lia"}')
USER_B_ID=$(echo "$RESP_B" | jq -r '.status.userId')

if [[ -z "$USER_A_ID" || -z "$USER_B_ID" ]]; then
  echo "❌ Creazione utenti fallita"; exit 1; fi

# A requests join with B
echo "📨 A richiede join verso B (verrà rifiutata)"
REQ_RESP=$(curl -s -X POST "$BASE_URL/request-join" -H 'Content-Type: application/json' -d '{"requestingUserId":"'$USER_A_ID'","targetUserId":"'$USER_B_ID'"}')
REQUEST_ID=$(echo "$REQ_RESP" | jq -r '.requestId')
[[ "$REQUEST_ID" == "null" ]] && { echo "❌ Creazione richiesta fallita"; exit 1; }

# B sees incoming
echo "📥 Incoming per B prima del rifiuto"
JR_BEFORE=$(curl -s "$BASE_URL/join-requests/$USER_B_ID")
IN_COUNT=$(echo "$JR_BEFORE" | jq '.incoming | length')
if [ "$IN_COUNT" -lt 1 ]; then echo "❌ Nessuna richiesta in arrivo per B"; exit 1; fi

# B rejects
echo "⛔ B rifiuta la richiesta"
RESP_REJECT=$(curl -s -X POST "$BASE_URL/respond-join" -H 'Content-Type: application/json' -d '{"requestId":"'$REQUEST_ID'","targetUserId":"'$USER_B_ID'","approve":false}')
echo "$RESP_REJECT" | jq '.'
APPROVED=$(echo "$RESP_REJECT" | jq -r '.approved')
if [ "$APPROVED" != "false" ]; then echo "❌ Stato approvazione inatteso (atteso false)"; exit 1; fi

# Re-check incoming list (should not contain the request)
JR_AFTER=$(curl -s "$BASE_URL/join-requests/$USER_B_ID")
IN_AFTER=$(echo "$JR_AFTER" | jq '.incoming | length')
if [ "$IN_AFTER" -ne 0 ]; then echo "❌ La richiesta rifiutata è ancora visibile (incoming=$IN_AFTER)"; exit 1; fi

# Snapshot should show no couple/game for both
SNAP_A=$(curl -s "$BASE_URL/snapshot/$USER_A_ID")
SNAP_B=$(curl -s "$BASE_URL/snapshot/$USER_B_ID")
COUPLE_A=$(echo "$SNAP_A" | jq -r '.status.coupleId // empty')
COUPLE_B=$(echo "$SNAP_B" | jq -r '.status.coupleId // empty')
if [ -n "$COUPLE_A" ] || [ -n "$COUPLE_B" ]; then echo "❌ Una coppia non dovrebbe esistere dopo rifiuto"; exit 1; fi

GAME_A=$(echo "$SNAP_A" | jq -r '.gameSession.id // empty')
GAME_B=$(echo "$SNAP_B" | jq -r '.gameSession.id // empty')
if [ -n "$GAME_A" ] || [ -n "$GAME_B" ]; then echo "❌ Game session non dovrebbe essere avviata dopo rifiuto"; exit 1; fi

echo "✅ Reject flow test completato"
