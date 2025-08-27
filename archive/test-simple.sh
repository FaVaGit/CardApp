#!/bin/bash

# 🧪 SIMPLIFIED EVENT-DRIVEN ARCHITECTURE TEST
# ===========================================
# Quick and reliable test of all critical endpoints

BASE_URL="http://localhost:5000"
API_BASE="$BASE_URL/api/EventDrivenGame"

echo "🚀 Testing Event-Driven Architecture"
echo "===================================="

# Test 1: Health Check
echo ""
echo "1️⃣ Backend Health Check"
curl -s "$BASE_URL/api/health" | jq '.'
echo ""

# Test 2: Connect User 1
echo "2️⃣ Connect User 1"
USER1_RESPONSE=$(curl -s -X POST "$API_BASE/connect" \
  -H "Content-Type: application/json" \
  -d '{"userId":"TestUser001","connectionId":"conn_001"}')
echo "$USER1_RESPONSE" | jq '.'
echo ""

# Test 3: Connect User 2
echo "3️⃣ Connect User 2"
USER2_RESPONSE=$(curl -s -X POST "$API_BASE/connect" \
  -H "Content-Type: application/json" \
  -d '{"userId":"TestUser002","connectionId":"conn_002"}')
echo "$USER2_RESPONSE" | jq '.'
echo ""

# Test 4: User 1 creates couple
echo "4️⃣ User 1 Creates Couple"
COUPLE_CODE="TEST$(date +%s | tail -c 4)"
COUPLE1_RESPONSE=$(curl -s -X POST "$API_BASE/join-couple" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"TestUser001\",\"userCode\":\"$COUPLE_CODE\"}")
echo "$COUPLE1_RESPONSE" | jq '.'
echo ""

# Test 5: User 2 joins couple (auto-game start)
echo "5️⃣ User 2 Joins Couple (Auto-Game Start)"
COUPLE2_RESPONSE=$(curl -s -X POST "$API_BASE/join-couple" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"TestUser002\",\"userCode\":\"$COUPLE_CODE\"}")
echo "$COUPLE2_RESPONSE" | jq '.'
echo ""

# Extract game session ID
GAME_SESSION_ID=$(echo "$COUPLE2_RESPONSE" | jq -r '.gameSession.id // empty')

if [ -n "$GAME_SESSION_ID" ] && [ "$GAME_SESSION_ID" != "null" ]; then
  echo "🎮 Game Session ID: $GAME_SESSION_ID"
  
  # Test 6: Draw Card (User 1)
  echo ""
  echo "6️⃣ User 1 Draws Card"
  CARD1_RESPONSE=$(curl -s -X POST "$API_BASE/draw-card" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$GAME_SESSION_ID\",\"userId\":\"TestUser001\"}")
  echo "$CARD1_RESPONSE" | jq '.'
  echo ""
  
  # Test 7: Draw Card (User 2)  
  echo "7️⃣ User 2 Draws Card"
  CARD2_RESPONSE=$(curl -s -X POST "$API_BASE/draw-card" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$GAME_SESSION_ID\",\"userId\":\"TestUser002\"}")
  echo "$CARD2_RESPONSE" | jq '.'
  echo ""
  
  # Test 8: End Game
  echo "8️⃣ End Game Session"
  END_RESPONSE=$(curl -s -X POST "$API_BASE/end-game" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$GAME_SESSION_ID\"}")
  echo "$END_RESPONSE" | jq '.'
  echo ""
else
  echo "⚠️  Game did not auto-start, testing manual start..."
  
  # Extract couple ID and start game manually
  COUPLE_ID=$(echo "$COUPLE1_RESPONSE" | jq -r '.couple.id // empty')
  if [ -n "$COUPLE_ID" ] && [ "$COUPLE_ID" != "null" ]; then
    echo ""
    echo "6️⃣ Manual Game Start"
    GAME_START_RESPONSE=$(curl -s -X POST "$API_BASE/start-game" \
      -H "Content-Type: application/json" \
      -d "{\"coupleId\":\"$COUPLE_ID\"}")
    echo "$GAME_START_RESPONSE" | jq '.'
    
    GAME_SESSION_ID=$(echo "$GAME_START_RESPONSE" | jq -r '.gameSession.id // empty')
    if [ -n "$GAME_SESSION_ID" ] && [ "$GAME_SESSION_ID" != "null" ]; then
      echo ""
      echo "7️⃣ Draw Card After Manual Start"
      CARD_RESPONSE=$(curl -s -X POST "$API_BASE/draw-card" \
        -H "Content-Type: application/json" \
        -d "{\"sessionId\":\"$GAME_SESSION_ID\",\"userId\":\"TestUser001\"}")
      echo "$CARD_RESPONSE" | jq '.'
    fi
  fi
fi

# Test 9: User Status
echo ""
echo "9️⃣ Check User Status"
STATUS_RESPONSE=$(curl -s -X GET "$API_BASE/user-status/TestUser001")
echo "$STATUS_RESPONSE" | jq '.'
echo ""

# Test 10: Disconnect Users
echo "🔌 Disconnect Users"
DISCONNECT1=$(curl -s -X POST "$API_BASE/disconnect" \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"conn_001"}')
echo "User 1: $DISCONNECT1" | jq '.'

DISCONNECT2=$(curl -s -X POST "$API_BASE/disconnect" \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"conn_002"}')
echo "User 2: $DISCONNECT2" | jq '.'
echo ""

# Test 11: Admin Clear
echo "🧹 Admin Clear Users"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/clear-users")
echo "$ADMIN_RESPONSE" | jq '.'
echo ""

echo "✅ All tests completed!"
echo ""
echo "🔗 Useful Links:"
echo "   Frontend: http://localhost:5173 or http://localhost:5174"
echo "   Backend API: $BASE_URL"
echo "   RabbitMQ Admin: http://localhost:15672 (guest/guest)"
