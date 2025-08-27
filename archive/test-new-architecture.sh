#!/bin/bash

echo "🧪 Testing New RabbitMQ Event-Driven Architecture"
echo "================================================="

BASE_URL="http://localhost:5000"

# Test 1: Connect user
echo "1️⃣ Testing user connection..."
USER1_ID="user123"
CONNECTION1_ID="conn123"

curl -X POST "$BASE_URL/api/EventDrivenGame/connect" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER1_ID\", \"connectionId\": \"$CONNECTION1_ID\"}" \
  -s | jq '.'

echo ""

# Test 2: Join/Create couple
echo "2️⃣ Testing couple creation/joining..."
COUPLE_CODE="ABC123"

curl -X POST "$BASE_URL/api/EventDrivenGame/join-couple" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER1_ID\", \"userCode\": \"$COUPLE_CODE\"}" \
  -s | jq '.'

echo ""

# Test 3: Connect second user
echo "3️⃣ Testing second user connection..."
USER2_ID="user456"
CONNECTION2_ID="conn456"

curl -X POST "$BASE_URL/api/EventDrivenGame/connect" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER2_ID\", \"connectionId\": \"$CONNECTION2_ID\"}" \
  -s | jq '.'

echo ""

# Test 4: Second user joins same couple
echo "4️⃣ Testing second user joining couple (should auto-start game)..."

curl -X POST "$BASE_URL/api/EventDrivenGame/join-couple" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER2_ID\", \"userCode\": \"$COUPLE_CODE\"}" \
  -s | jq '.'

echo ""

# Test 5: Check user status
echo "5️⃣ Testing user status retrieval..."

curl -X GET "$BASE_URL/api/EventDrivenGame/user-status/$USER1_ID" \
  -s | jq '.'

echo ""

echo "✅ Architecture test completed!"
echo ""
echo "📊 Check RabbitMQ management at: http://localhost:15672"
echo "   Username: admin"
echo "   Password: admin"
