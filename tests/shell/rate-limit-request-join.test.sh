#!/usr/bin/env bash
set -euo pipefail

# Test: rate limiting on /api/event-driven/request-join
# Assumes server running locally on default port 5248 (adjust if different)
BASE_URL="http://localhost:5248/api/event-driven"

echo "[rate-limit] Creating two users"
USER_A=$(curl -s -X POST "$BASE_URL/connect-user" -H 'Content-Type: application/json' -d '{"userId":"u_rate_a","connectionId":"c1","name":"Rate A","gameType":"std"}' | jq -r '.user.id // .status.userId // ""')
USER_B=$(curl -s -X POST "$BASE_URL/connect-user" -H 'Content-Type: application/json' -d '{"userId":"u_rate_b","connectionId":"c2","name":"Rate B","gameType":"std"}' | jq -r '.user.id // .status.userId // ""')
if [[ -z "$USER_A" || -z "$USER_B" ]]; then
  echo "Failed to create users" >&2
  exit 1
fi

echo "Users: $USER_A -> $USER_B"

passes=0
fail429=0
for i in {1..6}; do
  resp=$(curl -s -o /tmp/rr.json -w '%{http_code}' -X POST "$BASE_URL/request-join" -H 'Content-Type: application/json' \
    -d "{\"requestingUserId\":\"$USER_A\",\"targetUserId\":\"$USER_B\"}")
  body=$(cat /tmp/rr.json)
  echo "Attempt $i status=$resp body=$body"
  if [[ $i -le 5 && $resp -eq 200 ]]; then
    ((passes++))
  fi
  if [[ $i -eq 6 ]]; then
    if [[ $resp -eq 429 && $(echo "$body" | jq -r '.error') == "Limite richieste pairing superato" ]]; then
      fail429=1
    fi
  fi
done

if [[ $passes -ne 5 ]]; then
  echo "Expected 5 successful attempts, got $passes" >&2
  exit 1
fi
if [[ $fail429 -ne 1 ]]; then
  echo "Expected 6th attempt to be 429 rate limited" >&2
  exit 1
fi

echo "Rate limit test PASSED"
