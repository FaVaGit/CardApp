#!/bin/bash

# Simple API Test Script (assumes backend is already running)
BASE_URL="http://localhost:5000"
PASSED=0
FAILED=0
VALIDATION_PASSED=0
VALIDATION_FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -e "${BLUE}🧪 Testing: $name${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" -eq "$expected_status" ] 2>/dev/null; then
        echo -e "${GREEN}✅ PASS: $name (HTTP $status_code)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL: $name (Expected HTTP $expected_status, got HTTP $status_code)${NC}"
        FAILED=$((FAILED + 1))
    fi
}

test_validation() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -e "${PURPLE}🔍 Validation Test: $name${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    status_code="${response: -3}"
    
    if [ "$status_code" -eq "$expected_status" ] 2>/dev/null; then
        echo -e "${GREEN}✅ VALIDATION PASS: $name (HTTP $status_code)${NC}"
        VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
    else
        echo -e "${RED}❌ VALIDATION FAIL: $name (Expected HTTP $expected_status, got HTTP $status_code)${NC}"
        VALIDATION_FAILED=$((VALIDATION_FAILED + 1))
    fi
}

echo "🚀 Running Comprehensive API Tests"
echo "==================================="

# Check backend
echo -e "\n${BLUE}🔍 Checking backend...${NC}"
health_check=$(curl -s "$BASE_URL/api/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    exit 1
fi

# Basic Tests
echo -e "\n${BLUE}📋 BASIC ENDPOINT TESTS${NC}"
echo "------------------------"
test_endpoint "Health Check" "GET" "/api/health" "" "200"
test_endpoint "User Registration" "POST" "/api/users/register" '{"name":"TestUser","nickname":"test","gameType":"Single"}' "200"
test_endpoint "Get Users" "GET" "/api/users" "" "200"
test_endpoint "Get All Couples" "GET" "/api/game/couples" "" "200"
test_endpoint "Get Cards" "GET" "/api/game/cards/Single" "" "200"
test_endpoint "Get Random Card" "GET" "/api/game/cards/Single/random" "" "404"
test_endpoint "Clear Users" "POST" "/api/admin/clear-users" "" "200"
test_endpoint "Reset System" "POST" "/api/admin/reset-system" "" "200"

# Frontend Compatibility Tests
echo -e "\n${BLUE}🔗 FRONTEND COMPATIBILITY TESTS${NC}"
echo "--------------------------------"
test_endpoint "Create Couple (Frontend)" "POST" "/api/game/create-couple" '{"creatorId":"test","partnerName":"Test","gameType":"Single"}' "400"
test_endpoint "Join Couple (Frontend)" "POST" "/api/game/join-couple" '{"coupleId":"test","userId":"test"}' "404"
test_endpoint "Leave Couple (Frontend)" "POST" "/api/game/leave-couple" '{"userId":"test","coupleId":"test"}' "400"
test_endpoint "Start Session (Frontend)" "POST" "/api/game/start-session" '{"coupleId":"test","sessionType":"Standard"}' "400"
test_endpoint "End Session (Frontend)" "POST" "/api/game/sessions/test/end" "" "200"
test_endpoint "Force Refresh" "POST" "/api/admin/force-refresh" "" "200"

# Validation Tests
echo -e "\n${PURPLE}🔍 VALIDATION TESTS${NC}"
echo "-------------------"

# Create a test user for validation
user_response=$(curl -s -w "%{http_code}" -X "POST" \
    -H "Content-Type: application/json" \
    -d '{"name":"ValidUser","nickname":"valid","gameType":"Single"}' \
    "$BASE_URL/api/users/register" 2>/dev/null)
user_status="${user_response: -3}"

if [ "$user_status" -eq "200" ]; then
    user_id=$(echo "${user_response%???}" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}   ✅ Test user created: $user_id${NC}"
    
    test_validation "Create Couple - Valid User" "POST" "/api/game/create-couple" \
        '{"creatorId":"'$user_id'","partnerName":"Partner","gameType":"Single"}' "200"
    
    test_validation "Create Couple - Invalid User" "POST" "/api/game/create-couple" \
        '{"creatorId":"invalid","partnerName":"Partner","gameType":"Single"}' "400"
    
    test_validation "Leave Couple - Invalid User" "POST" "/api/game/leave-couple" \
        '{"userId":"invalid","coupleId":"test"}' "400"
    
    test_validation "Set User Offline" "POST" "/api/users/$user_id/offline" "" "200"
else
    echo -e "${RED}   ❌ Failed to create test user${NC}"
    VALIDATION_FAILED=$((VALIDATION_FAILED + 4))
fi

# Summary
echo ""
echo "========================================"
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "========================================"
echo -e "${GREEN}✅ Basic Tests Passed: $PASSED${NC}"
echo -e "${RED}❌ Basic Tests Failed: $FAILED${NC}"
echo -e "${GREEN}✅ Validation Tests Passed: $VALIDATION_PASSED${NC}"
echo -e "${RED}❌ Validation Tests Failed: $VALIDATION_FAILED${NC}"
echo "----------------------------------------"
TOTAL_PASSED=$((PASSED + VALIDATION_PASSED))
TOTAL_FAILED=$((FAILED + VALIDATION_FAILED))
echo -e "${BLUE}📊 Total Tests: $((TOTAL_PASSED + TOTAL_FAILED))${NC}"
echo -e "${GREEN}📊 Total Passed: $TOTAL_PASSED${NC}"
echo -e "${RED}📊 Total Failed: $TOTAL_FAILED${NC}"

if [ $TOTAL_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! API is fully functional!${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed, but this may be expected validation behavior${NC}"
    exit 1
fi
