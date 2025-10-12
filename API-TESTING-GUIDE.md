# Gioco della Complicità - API Testing Suite

## Overview

This repository contains a comprehensive API endpoint testing suite for the Gioco della Complicità application. The testing infrastructure ensures frontend-backend API consistency and validates proper error handling.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS (Port 5173)
- **Backend**: ASP.NET Core + SignalR + SQLite (Port 5000)
- **Communication**: HTTP REST + WebSocket
- **Testing**: Automated bash scripts with comprehensive validation

## Testing Infrastructure

### 🚀 Self-Contained Test Script

The main testing script `test-api-endpoints.sh` is completely self-contained and includes:

- **Automatic backend startup** if not already running
- **Comprehensive endpoint testing** (18 test cases)
- **Frontend-backend compatibility validation**
- **Detailed error reporting** with color-coded output
- **Automatic cleanup** of test resources

### Test Categories

1. **Basic Endpoint Tests** (8 tests)
   - Health checks
   - User management
   - Game/couple operations
   - Admin functions

2. **Frontend Compatibility Tests** (6 tests)
   - Validates that all frontend API calls have corresponding backend endpoints
   - Tests the exact endpoint paths used by the React application

3. **Validation Tests** (4 tests)
   - Error handling with invalid data
   - Proper HTTP status codes
   - Meaningful error messages

## Usage

### Quick Start

```bash
# Run the comprehensive test suite (no setup required)
./test-api-endpoints.sh
```

The script will automatically:
1. Check if the backend is running
2. Start the backend if needed (.NET 8.0 required)
3. Run all 18 test cases
4. Provide detailed results
5. Clean up test resources

### Manual Backend Control

If you prefer to manage the backend manually:

```bash
# Start the unified application
./start-unified.sh

# Run tests against running backend
./test-api-endpoints.sh
```

## API Endpoints

### Health Endpoints
- `GET /api/health` - Service health check

### User Management
- `POST /api/users/register` - Register new user
- `GET /api/users` - Get online users
- `POST /api/users/login` - User login
- `GET /api/users/{id}/state` - Get user state
- `POST /api/users/{id}/offline` - Set user offline

### Game/Couple Management
- `GET /api/game/couples` - Get all active couples
- `POST /api/game/couples` - Create new couple
- `POST /api/game/create-couple` - Frontend-compatible couple creation
- `POST /api/game/join-couple` - Frontend-compatible couple joining
- `POST /api/game/leave-couple` - Frontend-compatible couple leaving
- `POST /api/game/start-session` - Start game session
- `POST /api/game/sessions/{id}/end` - End game session
- `GET /api/game/cards/{type}` - Get cards by game type
- `GET /api/game/cards/{type}/random` - Get random card

### Admin Functions
- `POST /api/admin/clear-users` - Clear all users
- `POST /api/admin/reset-system` - Reset entire system
- `POST /api/admin/force-refresh` - Force data refresh

## Development Workflow

### Recommended Testing Workflow

1. **Make API changes** to backend or frontend
2. **Run the test suite**: `./test-api-endpoints.sh`
3. **Fix any issues** reported by the tests
4. **Commit changes** when all tests pass

### Continuous Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    cd CardApp
    ./test-api-endpoints.sh
```

## Test Results Interpretation

### Success Indicators
- ✅ **All tests passed**: API is production-ready
- ✅ **Green status codes**: Endpoints responding correctly
- ✅ **Validation passes**: Error handling working properly

### Failure Analysis
- ❌ **HTTP 404**: Endpoint missing or path incorrect
- ❌ **HTTP 405**: Wrong HTTP method
- ❌ **HTTP 400**: Expected validation behavior
- ❌ **HTTP 500**: Server error requiring investigation

## Prerequisites

- **.NET 8.0 SDK** (for backend)
- **Node.js 18+** (for frontend)
- **curl** (for testing)
- **bash** (Linux/macOS/WSL)

## Files Structure

```
CardApp/
├── test-api-endpoints.sh          # Main comprehensive test suite
├── simple-api-test.sh             # Lightweight test version
├── start-unified.sh               # Unified application launcher
├── Backend/
│   └── ComplicityGame.Api/         # ASP.NET Core backend
├── src/
│   ├── useUnifiedBackend.js        # React API integration
│   └── ...                        # React components
└── backup/obsolete/                # Archived legacy files
```

## Recent Improvements

### ✅ Completed (Latest Update)

1. **Self-contained testing script** - No dependencies on other scripts
2. **Automatic backend startup** - Tests can run without manual setup
3. **Frontend-backend API consistency** - All 6 critical mismatches fixed
4. **Comprehensive validation testing** - Proper error handling verification
5. **Enhanced error reporting** - Color-coded output with detailed diagnostics
6. **Automatic cleanup** - Test resources properly cleaned up

### API Endpoints Added

- `POST /api/game/create-couple` - Frontend compatibility
- `POST /api/game/join-couple` - Frontend compatibility  
- `POST /api/game/leave-couple` - Frontend compatibility
- `POST /api/game/start-session` - Frontend compatibility
- `POST /api/game/sessions/{id}/end` - Session management
- `POST /api/admin/force-refresh` - Data refresh functionality

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check .NET installation
dotnet --version

# Check port availability
netstat -tlnp | grep :5000
```

**Tests fail with connection errors**
```bash
# Verify backend health
curl http://localhost:5000/api/health

# Check firewall/proxy settings
```

**Random card endpoint returns 404**
- This is expected behavior when no cards exist in the database
- Test correctly validates this scenario

## Support

For issues or questions:
1. Run the test suite for diagnostic information
2. Check the `test-backend.log` file for backend errors
3. Verify all prerequisites are installed
4. Ensure no other services are using ports 5000 or 5173

---

**Status**: ✅ All tests passing, API fully functional and production-ready!
