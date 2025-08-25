#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Suite
 * Tests all backend endpoints to ensure frontend-backend compatibility
 */

const BASE_URL = 'http://localhost:5000';

class APITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS', error: null });
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${name} - ${error.message}`);
    }
  }

  async apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Test data generators
  generateUser() {
    const timestamp = Date.now();
    return {
      name: `TestUser_${timestamp}`,
      gameType: 'couple',
      nickname: `Nick_${timestamp}`
    };
  }

  generateCouple() {
    const timestamp = Date.now();
    return {
      name: `TestCouple_${timestamp}`,
      createdBy: this.testUserId || 'test-user',
      gameType: 'couple'
    };
  }

  async runAllTests() {
    console.log('🚀 Starting API Endpoint Testing Suite\n');
    console.log('========================================\n');

    // 1. Health Check Tests
    await this.testHealthEndpoints();

    // 2. User Management Tests
    await this.testUserEndpoints();

    // 3. Game/Couple Management Tests
    await this.testGameEndpoints();

    // 4. Admin Endpoints Tests
    await this.testAdminEndpoints();

    // 5. Frontend-Backend Mismatch Detection
    await this.testFrontendMismatches();

    this.printSummary();
  }

  async testHealthEndpoints() {
    console.log('\n📋 HEALTH ENDPOINTS');
    console.log('--------------------');

    await this.test('GET /api/health', async () => {
      const response = await this.apiCall('/api/health');
      if (!response.status || response.status !== 'healthy') {
        throw new Error('Health check returned invalid response');
      }
    });
  }

  async testUserEndpoints() {
    console.log('\n👥 USER ENDPOINTS');
    console.log('-------------------');

    let testUser = null;

    await this.test('POST /api/users/register', async () => {
      const userData = this.generateUser();
      testUser = await this.apiCall('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (!testUser.id || !testUser.personalCode) {
        throw new Error('User registration returned invalid response');
      }
      this.testUserId = testUser.id;
      this.testUserCode = testUser.personalCode;
    });

    await this.test('POST /api/users/login', async () => {
      if (!this.testUserCode) {
        throw new Error('No test user code available');
      }
      
      const loginData = { personalCode: this.testUserCode };
      const loggedUser = await this.apiCall('/api/users/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      
      if (!loggedUser.id) {
        throw new Error('User login returned invalid response');
      }
    });

    await this.test('GET /api/users', async () => {
      const users = await this.apiCall('/api/users');
      if (!Array.isArray(users)) {
        throw new Error('Users endpoint should return an array');
      }
    });

    await this.test('GET /api/users/{userId}/state', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }
      
      const userState = await this.apiCall(`/api/users/${this.testUserId}/state`);
      if (!userState.User) {
        throw new Error('User state should contain User object');
      }
    });

    await this.test('PUT /api/users/{userId}/presence', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }
      
      const updatedUser = await this.apiCall(`/api/users/${this.testUserId}/presence`, {
        method: 'PUT'
      });
      
      if (!updatedUser.id) {
        throw new Error('Presence update returned invalid response');
      }
    });

    await this.test('POST /api/users/join/{code}', async () => {
      if (!this.testUserCode) {
        throw new Error('No test user code available');
      }
      
      const joinedUser = await this.apiCall(`/api/users/join/${this.testUserCode}`, {
        method: 'POST'
      });
      
      if (!joinedUser.id) {
        throw new Error('Join by code returned invalid response');
      }
    });

    await this.test('POST /api/users/{userId}/offline', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }
      
      await this.apiCall(`/api/users/${this.testUserId}/offline`, {
        method: 'POST'
      });
    });
  }

  async testGameEndpoints() {
    console.log('\n🎮 GAME/COUPLE ENDPOINTS');
    console.log('-------------------------');

    let testCouple = null;

    await this.test('POST /api/game/couples', async () => {
      const coupleData = this.generateCouple();
      testCouple = await this.apiCall('/api/game/couples', {
        method: 'POST',
        body: JSON.stringify(coupleData)
      });
      
      if (!testCouple.id) {
        throw new Error('Couple creation returned invalid response');
      }
      this.testCoupleId = testCouple.id;
    });

    await this.test('GET /api/game/couples', async () => {
      const couples = await this.apiCall('/api/game/couples');
      if (!Array.isArray(couples)) {
        throw new Error('Couples endpoint should return an array');
      }
    });

    await this.test('GET /api/game/couples/{coupleId}', async () => {
      if (!this.testCoupleId) {
        throw new Error('No test couple ID available');
      }
      
      const couple = await this.apiCall(`/api/game/couples/${this.testCoupleId}`);
      if (!couple.id) {
        throw new Error('Get couple returned invalid response');
      }
    });

    await this.test('POST /api/game/couples/{coupleId}/join', async () => {
      if (!this.testCoupleId || !this.testUserId) {
        throw new Error('No test couple or user ID available');
      }
      
      const joinData = { userId: this.testUserId };
      const couple = await this.apiCall(`/api/game/couples/${this.testCoupleId}/join`, {
        method: 'POST',
        body: JSON.stringify(joinData)
      });
      
      if (!couple.id) {
        throw new Error('Join couple returned invalid response');
      }
    });

    await this.test('GET /api/game/couples/user/{userId}', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }
      
      const userCouples = await this.apiCall(`/api/game/couples/user/${this.testUserId}`);
      if (!Array.isArray(userCouples)) {
        throw new Error('User couples should return an array');
      }
    });

    await this.test('POST /api/game/sessions', async () => {
      if (!this.testCoupleId || !this.testUserId) {
        throw new Error('No test couple or user ID available');
      }
      
      const sessionData = {
        coupleId: this.testCoupleId,
        createdBy: this.testUserId,
        sessionType: 'couple'
      };
      
      const session = await this.apiCall('/api/game/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });
      
      if (!session.id) {
        throw new Error('Session creation returned invalid response');
      }
      this.testSessionId = session.id;
    });

    await this.test('GET /api/game/sessions/{sessionId}', async () => {
      if (!this.testSessionId) {
        throw new Error('No test session ID available');
      }
      
      const session = await this.apiCall(`/api/game/sessions/${this.testSessionId}`);
      if (!session.id) {
        throw new Error('Get session returned invalid response');
      }
    });

    await this.test('GET /api/game/cards/couple', async () => {
      const cards = await this.apiCall('/api/game/cards/couple');
      if (!Array.isArray(cards)) {
        throw new Error('Cards endpoint should return an array');
      }
    });

    await this.test('GET /api/game/cards/couple/random', async () => {
      const card = await this.apiCall('/api/game/cards/couple/random');
      if (!card.id && !card.title && !card.content) {
        throw new Error('Random card should have id, title, or content');
      }
    });

    await this.test('POST /api/game/couples/leave', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }
      
      const leaveData = { userId: this.testUserId };
      await this.apiCall('/api/game/couples/leave', {
        method: 'POST',
        body: JSON.stringify(leaveData)
      });
    });
  }

  async testAdminEndpoints() {
    console.log('\n🔧 ADMIN ENDPOINTS');
    console.log('-------------------');

    await this.test('POST /api/admin/clear-users', async () => {
      const response = await this.apiCall('/api/admin/clear-users', {
        method: 'POST'
      });
      
      if (!response.message) {
        throw new Error('Clear users should return success message');
      }
    });

    await this.test('POST /api/admin/reset-system', async () => {
      const response = await this.apiCall('/api/admin/reset-system', {
        method: 'POST'
      });
      
      if (!response.message) {
        throw new Error('Reset system should return success message');
      }
    });
  }

  async testFrontendMismatches() {
    console.log('\n🔍 FRONTEND-BACKEND MISMATCH DETECTION');
    console.log('---------------------------------------');

    // Test endpoints that frontend calls but might not exist
    const frontendEndpoints = [
      { endpoint: '/api/game/create-couple', method: 'POST' },
      { endpoint: '/api/game/join-couple', method: 'POST' },
      { endpoint: '/api/game/leave-couple', method: 'POST' },
      { endpoint: '/api/game/start-session', method: 'POST' },
      { endpoint: '/api/game/sessions/test/end', method: 'POST' },
      { endpoint: '/api/admin/force-refresh', method: 'POST' }
    ];

    for (const { endpoint, method } of frontendEndpoints) {
      await this.test(`${method} ${endpoint} (Frontend Call)`, async () => {
        try {
          await this.apiCall(endpoint, { method });
        } catch (error) {
          if (error.message.includes('HTTP 404')) {
            throw new Error(`Endpoint not found - Frontend calls ${endpoint} but backend doesn't implement it`);
          }
          // Other errors might be expected (400, 500) for test data
          console.log(`  ⚠️  ${endpoint} exists but returned: ${error.message}`);
        }
      });
    }
  }

  printSummary() {
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n🚨 FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   ❌ ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🔧 RECOMMENDATIONS:');
    
    if (this.results.failed > 0) {
      console.log('   1. Fix failed endpoints before deploying');
      console.log('   2. Update frontend calls to match backend endpoints');
      console.log('   3. Add missing backend endpoints for frontend calls');
    } else {
      console.log('   ✅ All tests passed! API is consistent.');
    }

    console.log('\n💡 USAGE:');
    console.log('   Run this test suite after any API changes');
    console.log('   Add new tests when adding new endpoints');
    console.log('   Use before merging/deploying changes');
  }
}

// Main execution
async function main() {
  const tester = new APITester();
  
  try {
    await tester.runAllTests();
    process.exit(tester.results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite failed to run:', error.message);
    process.exit(1);
  }
}

// Check if we have required dependencies
if (typeof fetch === 'undefined') {
  console.log('📦 Installing node-fetch for testing...');
  try {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
  } catch (error) {
    console.error('❌ Please install node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = APITester;
