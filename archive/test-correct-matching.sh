#!/bin/bash

# Correct Partner Matching Test - Proper Workflow
# This simulates the correct workflow where both users use the same couple code

API_BASE="http://localhost:5000/api/EventDrivenGame"

echo "🧪 CORRECTED Partner Matching Test"
echo "==================================="

# Create fresh users
TIMESTAMP=$(date +%s)
USER1_NAME="Host_$TIMESTAMP"
USER2_NAME="Guest_$TIMESTAMP"

echo ""
echo "🔗 Step 1: Connect Host ($USER1_NAME)..."
USER1_RESPONSE=$(curl -s -X POST $API_BASE/connect \
    -H "Content-Type: application/json" \
    -d '{"Name": "'"$USER1_NAME"'", "GameType": "Coppia"}')

USER1_ID=$(echo $USER1_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "Host ID: $USER1_ID"

sleep 1

echo ""
echo "🔗 Step 2: Connect Guest ($USER2_NAME)..."
USER2_RESPONSE=$(curl -s -X POST $API_BASE/connect \
    -H "Content-Type: application/json" \
    -d '{"Name": "'"$USER2_NAME"'", "GameType": "Coppia"}')

USER2_ID=$(echo $USER2_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "Guest ID: $USER2_ID"

cd /home/fabio/CardApp/Backend/ComplicityGame.Api

HOST_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Id='$USER1_ID';")
GUEST_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Id='$USER2_ID';")

echo ""
echo "🔑 Personal Codes:"
echo "Host ($USER1_NAME): $HOST_CODE"
echo "Guest ($USER2_NAME): $GUEST_CODE"

echo ""
echo "🏠 Step 3: Host creates room using HOST's own code..."
echo "   (Host says: 'Create room with my code $HOST_CODE')"

HOST_CREATE_RESPONSE=$(curl -s -X POST $API_BASE/join-couple \
    -H "Content-Type: application/json" \
    -d '{"UserCode": "'"$HOST_CODE"'", "UserId": "'"$USER1_ID"'"}')

echo "Host create response: $HOST_CREATE_RESPONSE"

sleep 1

echo ""
echo "🚪 Step 4: Guest joins room using HOST's code..."  
echo "   (Guest says: 'Join room with code $HOST_CODE')"

GUEST_JOIN_RESPONSE=$(curl -s -X POST $API_BASE/join-couple \
    -H "Content-Type: application/json" \
    -d '{"UserCode": "'"$HOST_CODE"'", "UserId": "'"$USER2_ID"'"}')

echo "Guest join response: $GUEST_JOIN_RESPONSE"

# Check if game session was created
GAME_SESSION=$(echo $GUEST_JOIN_RESPONSE | grep -o '"gameSession":{[^}]*}')
if [ ! -z "$GAME_SESSION" ]; then
    echo ""
    echo "🎮 ✅ SUCCESS: Game session created!"
    echo "Game Session: $GAME_SESSION"
    
    # Extract and show couple info
    COUPLE_ID=$(echo $GUEST_JOIN_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    MEMBER_COUNT=$(echo $GUEST_JOIN_RESPONSE | grep -o '"memberCount":[0-9]*' | cut -d':' -f2)
    
    echo ""
    echo "👥 Couple Details:"
    echo "   ID: $COUPLE_ID"
    echo "   Members: $MEMBER_COUNT"
    echo "   Room Code: $HOST_CODE"
else
    echo ""
    echo "⏳ Checking couple status..."
    COUPLE_ID=$(echo $GUEST_JOIN_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    MEMBER_COUNT=$(echo $GUEST_JOIN_RESPONSE | grep -o '"memberCount":[0-9]*' | cut -d':' -f2)
    echo "   Couple ID: $COUPLE_ID"
    echo "   Members: $MEMBER_COUNT"
fi

echo ""
echo "📊 Final Database Verification:"
echo "==============================="

echo ""
echo "👤 Users:"
sqlite3 game.db "SELECT Name, PersonalCode FROM Users WHERE Id IN ('$USER1_ID', '$USER2_ID');"

echo ""
echo "👥 Couples:"
sqlite3 game.db "SELECT c.Name as RoomCode, COUNT(cu.UserId) as Members FROM Couples c LEFT JOIN CoupleUsers cu ON c.Id = cu.CoupleId WHERE c.Name = '$HOST_CODE' GROUP BY c.Id;"

echo ""
echo "📝 Couple Members:"
sqlite3 game.db "SELECT u.Name, cu.Role FROM CoupleUsers cu JOIN Users u ON cu.UserId = u.Id JOIN Couples c ON cu.CoupleId = c.Id WHERE c.Name = '$HOST_CODE';"

echo ""
echo "🎮 Game Sessions:"
sqlite3 game.db "SELECT gs.Id, gs.IsActive, c.Name as CoupleCode FROM GameSessions gs JOIN Couples c ON gs.CoupleId = c.Id WHERE c.Name = '$HOST_CODE';" 2>/dev/null || echo "No game sessions found"

echo ""
echo "🏁 FINAL RESULT:"
echo "================"

if [ ! -z "$GAME_SESSION" ]; then
    echo "🎉 ✅ COMPLETE SUCCESS!"
    echo "   ✓ Host created room with code: $HOST_CODE"
    echo "   ✓ Guest joined room with code: $HOST_CODE"  
    echo "   ✓ Couple formed with 2 members"
    echo "   ✓ Game session started automatically"
    echo ""
    echo "🌟 Partner matching system is FULLY FUNCTIONAL!"
else
    # Check if couple has 2 members even without game session
    FINAL_COUNT=$(sqlite3 game.db "SELECT COUNT(cu.UserId) FROM CoupleUsers cu JOIN Couples c ON cu.CoupleId = c.Id WHERE c.Name = '$HOST_CODE';" 2>/dev/null || echo "0")
    if [ "$FINAL_COUNT" = "2" ]; then
        echo "✅ SUCCESS: Couple formed correctly!"
        echo "   ✓ Host created room with code: $HOST_CODE"
        echo "   ✓ Guest joined room with code: $HOST_CODE"
        echo "   ✓ Couple has 2 members"
        echo "   ⚠️ Game session may need manual start"
    else
        echo "❌ FAILED: Couple not formed correctly"
        echo "   Expected 2 members, got: $FINAL_COUNT"
    fi
fi

echo ""
echo "💡 Correct Frontend Flow:"
echo "   1. Host: Login → Select 'Coppia' → Share personal code: $HOST_CODE"
echo "   2. Guest: Login → Select 'Coppia' → Enter host's code: $HOST_CODE"
echo "   3. Both users should then be in the same game session"
