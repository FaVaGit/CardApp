#!/bin/bash

echo "🧪 Testing Event-Driven Architecture"
echo "====================================="

BASE_URL="http://localhost:5000"

# Test health endpoint
echo "1️⃣ Testing API health..."
if curl -s "$BASE_URL/api/health" > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend not responding"
    exit 1
fi

# Test user connection
echo "2️⃣ Testing user connection and auto-creation..."
USER1_ID="test_user_$(date +%s)"
CONNECTION1_ID="conn_$(date +%s)"

RESPONSE=$(curl -X POST "$BASE_URL/api/EventDrivenGame/connect" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER1_ID\", \"connectionId\": \"$CONNECTION1_ID\"}" \
  -s)

if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ User connected successfully"
    echo "$RESPONSE" | jq '.'
else
    echo "❌ User connection failed"
    echo "$RESPONSE"
    exit 1
fi

# Test couple creation
echo "3️⃣ Testing couple creation..."
COUPLE_CODE="TEST_$(date +%s)"

RESPONSE=$(curl -X POST "$BASE_URL/api/EventDrivenGame/join-couple" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER1_ID\", \"userCode\": \"$COUPLE_CODE\"}" \
  -s)

if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Couple created successfully"
    echo "$RESPONSE" | jq '.'
else
    echo "❌ Couple creation failed"
    echo "$RESPONSE"
    exit 1
fi

# Test second user joining (should auto-start game)
echo "4️⃣ Testing second user joining and auto-game-start..."
USER2_ID="test_user2_$(date +%s)"
CONNECTION2_ID="conn2_$(date +%s)"

# Connect second user
curl -X POST "$BASE_URL/api/EventDrivenGame/connect" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER2_ID\", \"connectionId\": \"$CONNECTION2_ID\"}" \
  -s > /dev/null

# Join same couple
RESPONSE=$(curl -X POST "$BASE_URL/api/EventDrivenGame/join-couple" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER2_ID\", \"userCode\": \"$COUPLE_CODE\"}" \
  -s)

if echo "$RESPONSE" | jq -e '.gameSession' > /dev/null; then
    echo "✅ Second user joined and game auto-started"
    echo "$RESPONSE" | jq '.'
else
    echo "❌ Auto-game-start failed"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Event-driven architecture is working correctly."
echo ""
echo "📊 Check RabbitMQ management at: http://localhost:15672"
echo "   Username: admin"
echo "   Password: admin"
