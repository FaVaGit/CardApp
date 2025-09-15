#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:5000/api/EventDrivenGame"
ADMIN_URL="http://localhost:5000/api/Admin"

echo "🔄 Pulizia utenti precedenti..."
curl -s -X POST "$ADMIN_URL/clear-users" -H 'Content-Type: application/json' >/dev/null || true
sleep 1

echo "👤 Connect User A"
RESP_A=$(curl -s -X POST "$BASE_URL/connect" -H 'Content-Type: application/json' -d '{"Name":"Alice"}')
echo "$RESP_A" | jq '.'
USER_A_ID=$(echo "$RESP_A" | jq -r '.status.userId')
AUTH_A=$(echo "$RESP_A" | jq -r '.authToken')

echo "👤 Connect User B"
RESP_B=$(curl -s -X POST "$BASE_URL/connect" -H 'Content-Type: application/json' -d '{"Name":"Bob"}')
echo "$RESP_B" | jq '.'
USER_B_ID=$(echo "$RESP_B" | jq -r '.status.userId')
AUTH_B=$(echo "$RESP_B" | jq -r '.authToken')

[[ -z "$USER_A_ID" || -z "$USER_B_ID" ]] && { echo "❌ Failed to create users"; exit 1; }

echo "📋 Fetch available users for A (should list only B)"
AVAIL_A=$(curl -s "$BASE_URL/available-users/$USER_A_ID")
echo "$AVAIL_A" | jq '.'
COUNT_A=$(echo "$AVAIL_A" | jq '.users | length')
if [ "$COUNT_A" -ne 1 ]; then
	echo "❌ Attesi 1 utente (B) ma trovati $COUNT_A"; exit 1; fi

echo "📨 A richiede join verso B"
REQ_RESP=$(curl -s -X POST "$BASE_URL/request-join" -H 'Content-Type: application/json' -d '{"requestingUserId":"'$USER_A_ID'","targetUserId":"'$USER_B_ID'"}')
echo "$REQ_RESP" | jq '.'
REQUEST_ID=$(echo "$REQ_RESP" | jq -r '.requestId')
[[ "$REQUEST_ID" == "null" ]] && { echo "❌ Join request creation failed"; exit 1; }

echo "📥 Controllo richieste in arrivo per B"
JR_B=$(curl -s "$BASE_URL/join-requests/$USER_B_ID")
echo "$JR_B" | jq '.'
IN_COUNT=$(echo "$JR_B" | jq '.incoming | length')
if [ "$IN_COUNT" -lt 1 ]; then echo "❌ Nessuna richiesta in arrivo per B"; exit 1; fi

echo "✅ B approva la richiesta"
RESP_APPROVE=$(curl -s -X POST "$BASE_URL/respond-join" -H 'Content-Type: application/json' -d '{"requestId":"'$REQUEST_ID'","targetUserId":"'$USER_B_ID'","approve":true}')
echo "$RESP_APPROVE" | jq '.'
COUPLE_ID=$(echo "$RESP_APPROVE" | jq -r '.coupleId')
GAME_ID=$(echo "$RESP_APPROVE" | jq -r '.gameSession.id // empty')

[[ -z "$COUPLE_ID" || "$COUPLE_ID" == "null" ]] && { echo "❌ Couple not formed"; exit 1; }
echo "👥 Couple ID: $COUPLE_ID"
[ -n "$GAME_ID" ] && echo "🎮 Game session avviata: $GAME_ID" || echo "ℹ️ Nessuna game session (non critico)"

echo "🔁 Snapshot utente A"
SNAP_A=$(curl -s "$BASE_URL/snapshot/$USER_A_ID")
echo "$SNAP_A" | jq '{coupleId: .status.coupleId, gameSession: .gameSession, partner: .partnerInfo}'
SNAP_COUPLE=$(echo "$SNAP_A" | jq -r '.status.coupleId // empty')
if [ -z "$SNAP_COUPLE" ]; then echo "❌ Snapshot non riporta coupleId"; exit 1; fi

echo "✅ Test completato"