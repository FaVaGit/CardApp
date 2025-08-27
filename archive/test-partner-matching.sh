#!/bin/bash

# Test Partner Matching Functionality
# This script simulates two users connecting and attempting to find each other as partners

API_BASE="http://localhost:5000/api/EventDrivenGame"
BACKEND_LOG="/home/fabio/CardApp/backend.log"

echo "🧪 Testing Partner Matching Functionality"
echo "========================================"

# Check if backend is running
if ! curl -s $API_BASE/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on localhost:5000"
    echo "   Please start the backend first with ./start-simple.sh"
    exit 1
fi

echo "✅ Backend is running"

# Test User 1 Connection
echo ""
echo "🔗 Testing User 1 Connection (Alice)..."
USER1_RESPONSE=$(curl -s -X POST $API_BASE/connect \
    -H "Content-Type: application/json" \
    -d '{"Name": "Alice", "GameType": "Coppia"}')

echo "User 1 Response: $USER1_RESPONSE"

# Extract user ID and personal code from response if needed
USER1_SUCCESS=$(echo $USER1_RESPONSE | grep -o '"success":true' || echo "")
if [ -z "$USER1_SUCCESS" ]; then
    echo "❌ User 1 connection failed"
    echo "Response: $USER1_RESPONSE"
    exit 1
fi

echo "✅ User 1 (Alice) connected successfully"

# Wait a moment
sleep 2

# Test User 2 Connection
echo ""
echo "🔗 Testing User 2 Connection (Bob)..."
USER2_RESPONSE=$(curl -s -X POST $API_BASE/connect \
    -H "Content-Type: application/json" \
    -d '{"Name": "Bob", "GameType": "Coppia"}')

echo "User 2 Response: $USER2_RESPONSE"

USER2_SUCCESS=$(echo $USER2_RESPONSE | grep -o '"success":true' || echo "")
if [ -z "$USER2_SUCCESS" ]; then
    echo "❌ User 2 connection failed"
    echo "Response: $USER2_RESPONSE"
    exit 1
fi

echo "✅ User 2 (Bob) connected successfully"

# Wait for potential matching
echo ""
echo "⏳ Waiting for potential partner matching..."
sleep 3

# Check backend logs for matching activity
echo ""
echo "📋 Recent Backend Activity:"
echo "----------------------------"
tail -20 $BACKEND_LOG

# Test getting available users/partners
echo ""
echo "👥 Testing Partner Discovery..."

# Check if there's an endpoint to find partners
PARTNERS_RESPONSE=$(curl -s -X GET $API_BASE/partners 2>/dev/null || echo "Endpoint not available")
echo "Partners endpoint response: $PARTNERS_RESPONSE"

# Test finding a partner with personal code (simulate what frontend would do)
echo ""
echo "🔍 Testing Partner Search Functionality..."

# Since we need to test the actual partner matching, let's check the database
# to see what personal codes were generated
echo ""
echo "📊 Checking Database State..."
cd /home/fabio/CardApp/Backend/ComplicityGame.Api
sqlite3 game.db "SELECT Id, Name, PersonalCode, GameType, IsOnline, CreatedAt FROM Users ORDER BY CreatedAt DESC LIMIT 5;" 2>/dev/null || echo "Database query failed"

echo ""
echo "🔄 Testing Partner Code Exchange..."

# In a real scenario, users would exchange personal codes and use them to connect
# Let's simulate this by getting the personal codes and trying to match

# Get Alice's personal code
ALICE_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Name='Alice' ORDER BY CreatedAt DESC LIMIT 1;" 2>/dev/null || echo "")
BOB_CODE=$(sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Name='Bob' ORDER BY CreatedAt DESC LIMIT 1;" 2>/dev/null || echo "")

if [ ! -z "$ALICE_CODE" ] && [ ! -z "$BOB_CODE" ]; then
    echo "🔑 Alice's Personal Code: $ALICE_CODE"
    echo "🔑 Bob's Personal Code: $BOB_CODE"
    
    # Test if there's an endpoint to request partner by code
    echo ""
    echo "🤝 Testing Partner Request (Bob requesting Alice)..."
    PARTNER_REQUEST=$(curl -s -X POST $API_BASE/join-couple \
        -H "Content-Type: application/json" \
        -d "{\"UserCode\": \"$ALICE_CODE\", \"UserId\": \"$(sqlite3 game.db "SELECT Id FROM Users WHERE Name='Bob' ORDER BY CreatedAt DESC LIMIT 1;")\"}" 2>/dev/null || echo "Request failed")
    
    echo "Partner request response: $PARTNER_REQUEST"
    
    sleep 2
    
    # Check final state
    echo ""
    echo "🎯 Final Database State:"
    echo "------------------------"
    sqlite3 game.db "SELECT Name, PersonalCode, GameType, IsOnline, PartnerCode FROM Users WHERE Name IN ('Alice', 'Bob') ORDER BY CreatedAt DESC;" 2>/dev/null || echo "Database query failed"
else
    echo "❌ Could not retrieve personal codes from database"
fi

echo ""
echo "🏁 Test Complete!"
echo "=================="
echo "Check the backend logs and database state above to verify partner matching functionality."
echo ""
echo "💡 Frontend Testing:"
echo "   1. Open http://localhost:5174 in two browser tabs/windows"
echo "   2. Enter different names (Alice, Bob) in each tab"
echo "   3. Exchange the personal codes between tabs"
echo "   4. Enter partner's code to attempt matching"
echo ""
echo "📝 Expected Behavior:"
echo "   - Two users should be able to connect successfully"
echo "   - Each user should receive a unique personal code"
echo "   - Users should be able to find each other using personal codes"
echo "   - A couple/game session should be created when both users connect"
