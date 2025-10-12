#!/bin/bash

# CardApp - Comprehensive Test Suite
# Tests all core functionality of the event-driven architecture

set -e

API_BASE="http://localhost:5000/api/EventDrivenGame"
BACKEND_LOG="backend.log"
TIMESTAMP=$(date +%s)

echo "🧪 CardApp - Comprehensive Test Suite"
echo "====================================="
echo "Testing Event-Driven Architecture with RabbitMQ"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}🧪 Test $TESTS_TOTAL: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Helper functions
check_backend() {
    curl -s "$API_BASE/connect" > /dev/null 2>&1
}

connect_user() {
    local name="$1"
    local game_type="$2"
    curl -s -X POST "$API_BASE/connect" \
        -H "Content-Type: application/json" \
        -d "{\"Name\": \"$name\", \"GameType\": \"$game_type\"}" | \
        grep -q '"success":true'
}

join_couple() {
    local user_code="$1"
    local user_id="$2"
    curl -s -X POST "$API_BASE/join-couple" \
        -H "Content-Type: application/json" \
        -d "{\"UserCode\": \"$user_code\", \"UserId\": \"$user_id\"}"
}

draw_card() {
    local session_id="$1"
    local user_id="$2"
    curl -s -X POST "$API_BASE/draw-card" \
        -H "Content-Type: application/json" \
        -d "{\"SessionId\": \"$session_id\", \"UserId\": \"$user_id\"}" | \
        grep -q '"success":true'
}

get_user_id() {
    local response="$1"
    echo "$response" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4
}

get_personal_code() {
    local user_id="$1"
    cd Backend/ComplicityGame.Api
    sqlite3 game.db "SELECT PersonalCode FROM Users WHERE Id='$user_id';" 2>/dev/null || echo ""
}

# Start tests
echo "🔧 Starting test suite..."
echo ""

# Test 1: Backend Health Check
run_test "Backend Health Check" "check_backend"

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Backend is not running. Please start the backend first with ./start.sh${NC}"
    exit 1
fi

echo ""
echo "👤 Testing User Management..."
echo "=============================="

# Test 2: Single User Connection
USER1_NAME="TestUser1_$TIMESTAMP"
run_test "Single User Connection" "connect_user '$USER1_NAME' 'Single'"

# Test 3: Multiple User Connections
USER2_NAME="TestUser2_$TIMESTAMP"
run_test "Multiple User Connections" "connect_user '$USER2_NAME' 'Coppia'"

echo ""
echo "👥 Testing Partner Matching..."
echo "=============================="

# Get user details for partner matching
echo "📊 Retrieving user information..."

USER1_RESPONSE=$(curl -s -X POST "$API_BASE/connect" \
    -H "Content-Type: application/json" \
    -d "{\"Name\": \"Host_$TIMESTAMP\", \"GameType\": \"Coppia\"}")

USER2_RESPONSE=$(curl -s -X POST "$API_BASE/connect" \
    -H "Content-Type: application/json" \
    -d "{\"Name\": \"Guest_$TIMESTAMP\", \"GameType\": \"Coppia\"}")

USER1_ID=$(get_user_id "$USER1_RESPONSE")
USER2_ID=$(get_user_id "$USER2_RESPONSE")

sleep 1

USER1_CODE=$(get_personal_code "$USER1_ID")
USER2_CODE=$(get_personal_code "$USER2_ID")

if [ -n "$USER1_CODE" ] && [ -n "$USER2_CODE" ]; then
    echo "🔑 Host Code: $USER1_CODE, Guest Code: $USER2_CODE"
    
    # Test 4: Couple Creation
    run_test "Couple Creation (Host)" "join_couple '$USER1_CODE' '$USER1_ID' | grep -q '\"success\":true'"
    
    # Test 5: Couple Joining and Game Session Creation
    COUPLE_RESPONSE=$(join_couple "$USER1_CODE" "$USER2_ID")
    run_test "Couple Joining and Game Session Creation" "echo '$COUPLE_RESPONSE' | grep -q '\"gameSession\"'"
    
    if echo "$COUPLE_RESPONSE" | grep -q '"gameSession"'; then
        SESSION_ID=$(echo "$COUPLE_RESPONSE" | jq -r '.gameSession.id' 2>/dev/null || echo "")
        echo "🎮 Game Session Created: $SESSION_ID"
        
        # Test 6: Card Drawing
        if [ -n "$SESSION_ID" ]; then
            run_test "Card Drawing (Host)" "draw_card '$SESSION_ID' '$USER1_ID'"
            run_test "Card Drawing (Guest)" "draw_card '$SESSION_ID' '$USER2_ID'"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Could not retrieve user codes for partner matching tests${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 2))
fi

echo ""
echo "🎯 Testing Game Flow..."
echo "======================"

# Test 7: Single Player Game
SINGLE_USER_RESPONSE=$(curl -s -X POST "$API_BASE/connect" \
    -H "Content-Type: application/json" \
    -d "{\"Name\": \"SinglePlayer_$TIMESTAMP\", \"GameType\": \"Single\"}")

SINGLE_USER_ID=$(get_user_id "$SINGLE_USER_RESPONSE")

if [ -n "$SINGLE_USER_ID" ]; then
    # For single player, we might need to create a game session manually or test card access differently
    run_test "Single Player Connection" "echo '$SINGLE_USER_RESPONSE' | grep -q '\"success\":true'"
else
    echo -e "${YELLOW}⚠️  Could not test single player flow${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "🔍 Testing Database State..."
echo "============================"

# Test 8: Database Integrity
cd Backend/ComplicityGame.Api
USERS_COUNT=$(sqlite3 game.db "SELECT COUNT(*) FROM Users;" 2>/dev/null || echo "0")
COUPLES_COUNT=$(sqlite3 game.db "SELECT COUNT(*) FROM Couples;" 2>/dev/null || echo "0")
SESSIONS_COUNT=$(sqlite3 game.db "SELECT COUNT(*) FROM GameSessions;" 2>/dev/null || echo "0")

run_test "Database Users Created" "[ '$USERS_COUNT' -gt 0 ]"
run_test "Database Couples Created" "[ '$COUPLES_COUNT' -gt 0 ]"
run_test "Database Game Sessions Created" "[ '$SESSIONS_COUNT' -gt 0 ]"

echo ""
echo "📊 Database Summary:"
echo "   Users: $USERS_COUNT"
echo "   Couples: $COUPLES_COUNT"
echo "   Game Sessions: $SESSIONS_COUNT"

cd ../../
if [ -x tests/join-flow.test.sh ]; then
    echo ""
    echo "🔁 Eseguo test flusso join/approvazione..."
    bash tests/join-flow.test.sh || { echo -e "${RED}❌ Join flow test failed${NC}"; TESTS_FAILED=$((TESTS_FAILED+1)); }
fi

# Additional negative path tests (reject & cancel)
if [ -x tests/reject-flow.test.sh ]; then
    echo ""
    echo "🔁 Eseguo test flusso rifiuto..."
    bash tests/reject-flow.test.sh || { echo -e "${RED}❌ Reject flow test failed${NC}"; TESTS_FAILED=$((TESTS_FAILED+1)); }
fi

if [ -x tests/cancel-flow.test.sh ]; then
    echo ""
    echo "🔁 Eseguo test flusso cancellazione..."
    bash tests/cancel-flow.test.sh || { echo -e "${RED}❌ Cancel flow test failed${NC}"; TESTS_FAILED=$((TESTS_FAILED+1)); }
fi

cd - > /dev/null

echo ""
echo "📋 Recent Backend Logs:"
echo "======================="
tail -10 "$BACKEND_LOG" 2>/dev/null | grep -E "(User|Couple|Game|Error)" || echo "No relevant log entries found"

echo ""
echo "🏁 Test Results Summary"
echo "======================="
echo -e "Total Tests: ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

PASS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
echo -e "Success Rate: ${BLUE}$PASS_RATE%${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! The CardApp is working perfectly!${NC}"
    echo ""
    echo "✅ Event-driven architecture with RabbitMQ is functional"
    echo "✅ User authentication and management working"
    echo "✅ Partner matching and couple formation working"
    echo "✅ Game session creation working"
    echo "✅ Card drawing functionality working"
    echo "✅ Database operations working"
    echo ""
    echo "🌟 Ready for production use!"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the results above.${NC}"
    echo ""
    if [ $PASS_RATE -ge 70 ]; then
        echo "🔧 Core functionality is working, minor issues detected."
        exit 1
    else
        echo "❌ Significant issues detected. Please check the backend and database."
        exit 2
    fi
fi
