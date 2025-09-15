#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:5000/api/EventDrivenGame"
ADMIN_URL="http://localhost:5000/api/Admin"

echo "🔄 Pulizia utenti precedenti (cancel-flow)..."
curl -s -X POST "$ADMIN_URL/clear-users" -H 'Content-Type: application/json' >/dev/null || true
sleep 1

echo "👤 Connect User A (Richiedente)"
RESP_A=$(curl -s -X POST "$BASE_URL/connect" -H 'Content-Type: application/json' -d '{"Name":"Miki"}')
USER_A_ID=$(echo "$RESP_A" | jq -r '.status.userId')

echo "👤 Connect User B (Target)"
RESP_B=$(curl -s -X POST "$BASE_URL/connect" -H 'Content-Type: application/json' -d '{"Name":"Vale"}')
USER_B_ID=$(echo "$RESP_B" | jq -r '.status.userId')

if [[ -z "$USER_A_ID" || -z "$USER_B_ID" ]]; then
  echo "❌ Creazione utenti fallita"; exit 1; fi

# A requests join with B
echo "📨 A richiede join verso B (poi verrà cancellata)"
REQ_RESP=$(curl -s -X POST "$BASE_URL/request-join" -H 'Content-Type: application/json' -d '{"requestingUserId":"'$USER_A_ID'","targetUserId":"'$USER_B_ID'"}')
REQUEST_ID=$(echo "$REQ_RESP" | jq -r '.requestId')
[[ "$REQUEST_ID" == "null" ]] && { echo "❌ Creazione richiesta fallita"; exit 1; }

# B sees incoming
echo "📥 Incoming per B prima della cancellazione"
JR_BEFORE=$(curl -s "$BASE_URL/join-requests/$USER_B_ID")
IN_COUNT=$(echo "$JR_BEFORE" | jq '.incoming | length')
if [ "$IN_COUNT" -lt 1 ]; then echo "❌ Nessuna richiesta in arrivo per B"; exit 1; fi

# A cancels request
echo "🗑️  A cancella la richiesta"
# Endpoint richiede requestingUserId + targetUserId (requestId non necessario)
CANCEL_RESP=$(curl -s -X POST "$BASE_URL/cancel-join" -H 'Content-Type: application/json' -d '{"requestingUserId":"'$USER_A_ID'","targetUserId":"'$USER_B_ID'"}')
echo "$CANCEL_RESP" | jq '.'
SUCCESS_CANCEL=$(echo "$CANCEL_RESP" | jq -r '.success')
if [ "$SUCCESS_CANCEL" != "true" ]; then echo "❌ Cancel join non riuscito"; exit 1; fi

# B re-check incoming (should be 0)
JR_AFTER=$(curl -s "$BASE_URL/join-requests/$USER_B_ID")
IN_AFTER=$(echo "$JR_AFTER" | jq '.incoming | length')
if [ "$IN_AFTER" -ne 0 ]; then echo "❌ La richiesta cancellata è ancora visibile (incoming=$IN_AFTER)"; exit 1; fi

# Snapshots - ensure no couple/game
SNAP_A=$(curl -s "$BASE_URL/snapshot/$USER_A_ID")
SNAP_B=$(curl -s "$BASE_URL/snapshot/$USER_B_ID")
COUPLE_A=$(echo "$SNAP_A" | jq -r '.status.coupleId // empty')
COUPLE_B=$(echo "$SNAP_B" | jq -r '.status.coupleId // empty')
if [ -n "$COUPLE_A" ] || [ -n "$COUPLE_B" ]; then echo "❌ Una coppia non dovrebbe esistere dopo cancellazione"; exit 1; fi

echo "✅ Cancel flow test completato"
