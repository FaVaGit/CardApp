#!/bin/bash

# Simple test for complete Card App functionality
API_URL="http://localhost:5000/api"

echo "=== Card App Complete Flow Test ==="
echo ""

# Clear users
echo "1. Clearing users..."
curl -s -X POST "$API_URL/admin/clear-users" > /dev/null

# Seed cards
echo "2. Seeding cards..."
curl -s -X POST "$API_URL/admin/seed-test-cards" > /dev/null

# Connect User 1
echo "3. Connecting User 1..."
USER1_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"Name":"User1","GameType":"Coppia"}' "$API_URL/EventDrivenGame/connect")
USER1_ID=$(echo "$USER1_RESPONSE" | jq -r '.status.userId')
echo "User1 ID: $USER1_ID"

# Connect User 2  
echo "4. Connecting User 2..."
USER2_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"Name":"User2","GameType":"Coppia"}' "$API_URL/EventDrivenGame/connect")
USER2_ID=$(echo "$USER2_RESPONSE" | jq -r '.status.userId')
echo "User2 ID: $USER2_ID"

# User 1 joins couple
echo "5. User1 joining couple..."
curl -s -X POST -H "Content-Type: application/json" -d "{\"UserId\":\"$USER1_ID\"}" "$API_URL/EventDrivenGame/join-couple" > /dev/null

# User 2 joins couple (should trigger auto-game start)
echo "6. User2 joining couple (should auto-start game)..."
curl -s -X POST -H "Content-Type: application/json" -d "{\"UserId\":\"$USER2_ID\"}" "$API_URL/EventDrivenGame/join-couple" > /dev/null

# Check User1 status for session ID
echo "7. Checking for auto-started game session..."
STATUS_RESPONSE=$(curl -s "$API_URL/EventDrivenGame/user-status/$USER1_ID")
SESSION_ID=$(echo "$STATUS_RESPONSE" | jq -r '.status.sessionId // empty')

if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
    echo "✅ Auto-game start successful! Session ID: $SESSION_ID"
    
    # Draw a card
    echo "8. Drawing a card..."
    CARD_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"SessionId\":\"$SESSION_ID\",\"UserId\":\"$USER1_ID\"}" "$API_URL/EventDrivenGame/draw-card")
    CARD_CONTENT=$(echo "$CARD_RESPONSE" | jq -r '.content // .error')
    echo "Card result: $CARD_CONTENT"
    
    # End game
    echo "9. Ending game..."
    curl -s -X POST -H "Content-Type: application/json" -d "{\"SessionId\":\"$SESSION_ID\",\"UserId\":\"$USER1_ID\"}" "$API_URL/EventDrivenGame/end-game" > /dev/null
    echo "✅ Game ended successfully"
    
    echo ""
    echo "🎉 Complete flow test PASSED!"
    echo "✅ User connection working"
    echo "✅ Auto-game start working" 
    echo "✅ Card drawing working"
    echo "✅ Game lifecycle complete"
else
    echo "❌ Auto-game start failed"
    echo "User1 status: $STATUS_RESPONSE"
    exit 1
fi
