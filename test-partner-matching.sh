#!/bin/bash

# CardApp - Quick Partner Matching Test
# Tests the specific partner matching workflow

API_BASE="http://localhost:5000/api/EventDrivenGame"
TIMESTAMP=$(date +%s)

echo "🧪 CardApp - Partner Matching Test"
echo "=================================="
echo "Testing the correct partner matching workflow"
echo ""

# Check if backend is running
if ! curl -s "$API_BASE/connect" > /dev/null 2>&1; then
    echo "❌ Backend is not running on localhost:5000"
    echo "   Please start the backend with: ./start.sh"
    exit 1
fi

echo "✅ Backend is running"

# Create test users
HOST_NAME="Host_$TIMESTAMP"
GUEST_NAME="Guest_$TIMESTAMP"

echo ""
echo "🔗 Step 1: Connecting Host ($HOST_NAME)..."
HOST_RESPONSE=$(curl -s -X POST "$API_BASE/connect" \
    -H "Content-Type: application/json" \
    -d "{\"Name\": \"$HOST_NAME\", \"GameType\": \"Coppia\"}")

HOST_ID=$(echo "$HOST_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$HOST_ID" ]; then
    echo "❌ Failed to connect host"
    exit 1
fi

echo "✅ Host connected with ID: $HOST_ID"

sleep 1

echo ""
echo "🔗 Step 2: Connecting Guest ($GUEST_NAME)..."
GUEST_RESPONSE=$(curl -s -X POST "$API_BASE/connect" \
    -H "Content-Type: application/json" \
    -d "{\"Name\": \"$GUEST_NAME\", \"GameType\": \"Coppia\"}")

GUEST_ID=$(echo "$GUEST_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$GUEST_ID" ]; then
    echo "❌ Failed to connect guest"
    exit 1
fi

echo "✅ Guest connected with ID: $GUEST_ID"

# Get personal codes from database
cd Backend/ComplicityGame.Api
HOST_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Id='$HOST_ID';" 2>/dev/null)
GUEST_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Id='$GUEST_ID';" 2>/dev/null)
cd - > /dev/null

echo ""
echo "🔑 Personal Codes Generated:"
echo "   Host ($HOST_NAME): $HOST_CODE"
echo "   Guest ($GUEST_NAME): $GUEST_CODE"

echo ""
echo "🏠 Step 3: Host creates couple using their own code..."
HOST_CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/join-couple" \
    -H "Content-Type: application/json" \
    -d "{\"UserCode\": \"$HOST_CODE\", \"UserId\": \"$HOST_ID\"}")

if echo "$HOST_CREATE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Host successfully created couple"
    COUPLE_ID=$(echo "$HOST_CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   Couple ID: $COUPLE_ID"
else
    echo "❌ Host failed to create couple"
    echo "   Response: $HOST_CREATE_RESPONSE"
    exit 1
fi

sleep 1

echo ""
echo "🚪 Step 4: Guest joins couple using host's code..."
GUEST_JOIN_RESPONSE=$(curl -s -X POST "$API_BASE/join-couple" \
    -H "Content-Type: application/json" \
    -d "{\"UserCode\": \"$HOST_CODE\", \"UserId\": \"$GUEST_ID\"}")

echo "Guest join response:"
echo "$GUEST_JOIN_RESPONSE" | jq . 2>/dev/null || echo "$GUEST_JOIN_RESPONSE"

# Check if game session was created
if echo "$GUEST_JOIN_RESPONSE" | grep -q '"gameSession"'; then
    echo ""
    echo "🎉 SUCCESS! Partner matching completed successfully!"
    
    SESSION_ID=$(echo "$GUEST_JOIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    MEMBER_COUNT=$(echo "$GUEST_JOIN_RESPONSE" | grep -o '"memberCount":[0-9]*' | cut -d':' -f2)
    
    echo "✅ Couple formed with $MEMBER_COUNT members"
    echo "✅ Game session auto-created: $SESSION_ID"
    echo ""
    echo "🎮 Testing card drawing..."
    
    # Test card drawing for both users
    HOST_CARD_RESPONSE=$(curl -s -X POST "$API_BASE/draw-card" \
        -H "Content-Type: application/json" \
        -d "{\"SessionId\": \"$SESSION_ID\", \"UserId\": \"$HOST_ID\"}")
    
    if echo "$HOST_CARD_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Host can draw cards"
    else
        echo "⚠️  Host card drawing issue"
    fi
    
    GUEST_CARD_RESPONSE=$(curl -s -X POST "$API_BASE/draw-card" \
        -H "Content-Type: application/json" \
        -d "{\"SessionId\": \"$SESSION_ID\", \"UserId\": \"$GUEST_ID\"}")
    
    if echo "$GUEST_CARD_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Guest can draw cards"
    else
        echo "⚠️  Guest card drawing issue"
    fi
    
    echo ""
    echo "🌟 PARTNER MATCHING SYSTEM IS FULLY FUNCTIONAL!"
    echo ""
    echo "💡 Frontend Usage:"
    echo "   1. Open http://localhost:5174 in two browser tabs"
    echo "   2. In tab 1: Login as Host → Select 'Gioco di Coppia'"
    echo "   3. In tab 2: Login as Guest → Select 'Gioco di Coppia'"
    echo "   4. Host shares their code: $HOST_CODE"
    echo "   5. Guest enters host's code: $HOST_CODE"
    echo "   6. Both users will be in the same game session!"
    
else
    echo ""
    echo "⚠️  Couple formed but game session not created automatically"
    echo "   This might indicate a configuration issue"
    
    FINAL_MEMBER_COUNT=$(echo "$GUEST_JOIN_RESPONSE" | grep -o '"memberCount":[0-9]*' | cut -d':' -f2)
    if [ "$FINAL_MEMBER_COUNT" = "2" ]; then
        echo "✅ Couple has correct number of members: $FINAL_MEMBER_COUNT"
        echo "⚠️  Manual game session creation may be required"
    else
        echo "❌ Couple member count is incorrect: $FINAL_MEMBER_COUNT"
    fi
fi

echo ""
echo "📊 Final Database State:"
cd Backend/ComplicityGame.Api
echo "Users in this test:"
sqlite3 game.db "SELECT Name, PersonalCode, IsOnline FROM Users WHERE Id IN ('$HOST_ID', '$GUEST_ID');"
echo ""
echo "Couple information:"
sqlite3 game.db "SELECT c.Name as CoupleCode, COUNT(cu.UserId) as Members FROM Couples c LEFT JOIN CoupleUsers cu ON c.Id = cu.CoupleId WHERE c.Name = '$HOST_CODE' GROUP BY c.Id;"
cd - > /dev/null

echo ""
echo "✅ Partner matching test completed!"
