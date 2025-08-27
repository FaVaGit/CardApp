#!/bin/bash

# Comprehensive Partner Matching Test - Fresh Users
# This script tests the complete partner matching flow with new users

API_BASE="http://localhost:5000/api/EventDrivenGame"
BACKEND_LOG="/home/fabio/CardApp/backend.log"

echo "🧪 Comprehensive Partner Matching Test (Fresh Users)"
echo "====================================================="

# Check if backend is running
if ! curl -s $API_BASE/connect > /dev/null 2>&1; then
    echo "❌ Backend is not running on localhost:5000"
    exit 1
fi

echo "✅ Backend is running"

# Create fresh user names with timestamps to avoid conflicts
TIMESTAMP=$(date +%s)
USER1_NAME="TestUser1_$TIMESTAMP"
USER2_NAME="TestUser2_$TIMESTAMP"

echo ""
echo "🔗 Step 1: Connect User 1 ($USER1_NAME)..."
USER1_RESPONSE=$(curl -s -X POST $API_BASE/connect \
    -H "Content-Type: application/json" \
    -d '{"Name": "'"$USER1_NAME"'", "GameType": "Coppia"}')

echo "User 1 Response: $USER1_RESPONSE"

# Extract User1 ID from response
USER1_ID=$(echo $USER1_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "User 1 ID: $USER1_ID"

if [ -z "$USER1_ID" ]; then
    echo "❌ Failed to get User 1 ID"
    exit 1
fi

sleep 2

echo ""
echo "🔗 Step 2: Connect User 2 ($USER2_NAME)..."
USER2_RESPONSE=$(curl -s -X POST $API_BASE/connect \
    -H "Content-Type: application/json" \
    -d '{"Name": "'"$USER2_NAME"'", "GameType": "Coppia"}')

echo "User 2 Response: $USER2_RESPONSE"

# Extract User2 ID from response
USER2_ID=$(echo $USER2_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "User 2 ID: $USER2_ID"

if [ -z "$USER2_ID" ]; then
    echo "❌ Failed to get User 2 ID"
    exit 1
fi

sleep 2

echo ""
echo "📊 Step 3: Get Personal Codes from Database..."
cd /home/fabio/CardApp/Backend/ComplicityGame.Api

USER1_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Id='$USER1_ID';" 2>/dev/null || echo "")
USER2_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Id='$USER2_ID';" 2>/dev/null || echo "")

echo "🔑 $USER1_NAME Personal Code: $USER1_CODE"
echo "🔑 $USER2_NAME Personal Code: $USER2_CODE"

if [ -z "$USER1_CODE" ] || [ -z "$USER2_CODE" ]; then
    echo "❌ Failed to get personal codes"
    exit 1
fi

echo ""
echo "🤝 Step 4: User 1 creates/joins couple using User 2's code..."
COUPLE1_RESPONSE=$(curl -s -X POST $API_BASE/join-couple \
    -H "Content-Type: application/json" \
    -d '{"UserCode": "'"$USER2_CODE"'", "UserId": "'"$USER1_ID"'"}')

echo "Couple creation response: $COUPLE1_RESPONSE"

# Extract couple ID
COUPLE_ID=$(echo $COUPLE1_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Couple ID: $COUPLE_ID"

sleep 2

echo ""
echo "🤝 Step 5: User 2 joins the couple using User 1's code..."
COUPLE2_RESPONSE=$(curl -s -X POST $API_BASE/join-couple \
    -H "Content-Type: application/json" \
    -d '{"UserCode": "'"$USER1_CODE"'", "UserId": "'"$USER2_ID"'"}')

echo "Couple join response: $COUPLE2_RESPONSE"

# Check if game session was created
GAME_SESSION=$(echo $COUPLE2_RESPONSE | grep -o '"gameSession":{[^}]*}')
if [ ! -z "$GAME_SESSION" ]; then
    echo "🎮 ✅ Game session created automatically!"
    echo "Game Session: $GAME_SESSION"
else
    echo "⏳ Waiting for game session creation..."
fi

sleep 2

echo ""
echo "📊 Step 6: Verify Final State..."
echo "================================"

echo ""
echo "🔍 Database State:"
echo "------------------"
sqlite3 game.db "SELECT Name, PersonalCode, IsOnline FROM Users WHERE Id IN ('$USER1_ID', '$USER2_ID');"

echo ""
echo "👥 Couple Information:"
echo "----------------------"
if [ ! -z "$COUPLE_ID" ]; then
    sqlite3 game.db "SELECT c.Id, c.Name, COUNT(cu.UserId) as Members FROM Couples c LEFT JOIN CoupleUsers cu ON c.Id = cu.CoupleId WHERE c.Id = '$COUPLE_ID' GROUP BY c.Id;"
    
    echo ""
    echo "📝 Couple Members:"
    echo "------------------"
    sqlite3 game.db "SELECT u.Name, u.PersonalCode, cu.Role FROM CoupleUsers cu JOIN Users u ON cu.UserId = u.Id WHERE cu.CoupleId = '$COUPLE_ID';"
fi

echo ""
echo "🎮 Game Sessions:"
echo "-----------------"
sqlite3 game.db "SELECT Id, CoupleId, IsActive, CreatedAt FROM GameSessions ORDER BY CreatedAt DESC LIMIT 3;"

echo ""
echo "📋 Recent Backend Logs:"
echo "-----------------------"
tail -15 /home/fabio/CardApp/backend.log | grep -E "(User|Couple|Game|Error)" || tail -10 /home/fabio/CardApp/backend.log

echo ""
echo "🏁 Test Summary"
echo "==============="
echo "✅ Both users connected successfully"
echo "✅ Personal codes generated: $USER1_CODE, $USER2_CODE"
echo "✅ Couple formation attempted"

if [ ! -z "$GAME_SESSION" ]; then
    echo "✅ 🎉 COMPLETE SUCCESS: Game session created automatically!"
    echo ""
    echo "🌟 Partner matching system is working correctly!"
    echo "   - Users can connect and get personal codes"
    echo "   - Users can form couples using partner codes" 
    echo "   - Game sessions are created when couples are complete"
else
    echo "⚠️  Partial success: Couple formed but no auto-game session"
    echo "   Manual game start may be required"
fi

echo ""
echo "💡 Frontend Usage:"
echo "  1. Open http://localhost:5174 in two browser tabs"
echo "  2. Enter names and authenticate in both tabs" 
echo "  3. Select 'Gioco di Coppia' in both tabs"
echo "  4. Exchange personal codes between tabs"
echo "  5. Enter partner's code to form couple and start game"
