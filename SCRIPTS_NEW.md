# 📜 CardApp - Scripts Documentation

Complete guide to development and testing scripts for the modern event-driven CardApp.

## 🏗️ Architecture Overview

**Modern Event-Driven Stack**:
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: ASP.NET Core 8 + Entity Framework + SQLite
- **Events**: RabbitMQ for real-time communication
- **API**: REST with EventDrivenGameController

## 🚀 Development Scripts

### `start.sh` - Complete Application Startup
Starts both backend and frontend with health monitoring.

```bash
./start.sh
```

**Features**:
- ✅ Process cleanup and port management
- ✅ Backend build verification
- ✅ Health check with 30-second timeout
- ✅ Frontend startup with automatic port detection
- ✅ Continuous process monitoring
- ✅ Graceful shutdown with Ctrl+C

**Ports**:
- Backend: http://localhost:5000
- Frontend: http://localhost:5174 (or 5173)

### `stop.sh` - Clean Service Shutdown
Stops all running CardApp services.

```bash
./stop.sh
```

**Features**:
- 🛑 Kills backend (dotnet) processes
- 🛑 Kills frontend (vite/npm) processes
- 🔍 Port availability verification
- ✅ Clean shutdown confirmation

## 🧪 Testing Scripts

### `test-all.sh` - Comprehensive Test Suite
Complete functional testing of the entire application.

```bash
./test-all.sh
```

**Test Coverage**:
1. **Backend Health Check** - API availability
2. **User Management** - Single and multiple user connections
3. **Partner Matching** - Couple formation workflow
4. **Game Sessions** - Automatic session creation
5. **Card Drawing** - Game functionality
6. **Database Integrity** - Data persistence verification

**Output**:
- 🎯 Colored test results (green/red/yellow)
- 📊 Success rate percentage
- 📋 Database state summary
- 🏁 Overall system health report

### `test-partner-matching.sh` - Partner Workflow Test
Focused test for the core couple matching functionality.

```bash
./test-partner-matching.sh
```

**Test Scenario**:
1. Create Host and Guest users
2. Generate personal codes
3. Host creates couple with their code
4. Guest joins using host's code
5. Verify automatic game session creation
6. Test card drawing for both users

**Validates**:
- ✅ User authentication and code generation
- ✅ Couple formation with correct member count
- ✅ Automatic game session creation
- ✅ Card drawing functionality
- ✅ Database state consistency

## 📊 Script Results Interpretation

### Success Indicators
- ✅ All services start without errors
- ✅ Backend responds to health checks
- ✅ Users can connect and get personal codes
- ✅ Couples form with 2 members
- ✅ Game sessions auto-create
- ✅ Cards can be drawn successfully

### Warning Signs
- ⚠️ Services start but with warnings
- ⚠️ Partial test failures (70%+ pass rate)
- ⚠️ Manual game session creation required
- ⚠️ Port conflicts or slow startup

### Error Conditions
- ❌ Backend build failures
- ❌ Database connection issues
- ❌ API endpoint failures
- ❌ Partner matching failures
- ❌ Major test failures (<70% pass rate)

## 🔧 Development Workflow

### Daily Development
```bash
# Start development environment
./start.sh

# Run tests to verify changes
./test-all.sh

# Stop when done
./stop.sh
```

### Feature Testing
```bash
# Test specific partner matching changes
./test-partner-matching.sh

# Full regression testing
./test-all.sh
```

### CI/CD Integration
```bash
# Automated testing pipeline
./stop.sh && sleep 2
./start.sh && sleep 10
./test-all.sh
EXIT_CODE=$?
./stop.sh
exit $EXIT_CODE
```

## 📁 Legacy Scripts (Archived)

The following scripts have been archived to `scripts/legacy/`:

- ❌ `test.sh` - Old basic test
- ❌ `test-simple.sh` - Simple user test
- ❌ `test-quick.sh` - Quick functionality test
- ❌ `test-comprehensive.sh` - Old comprehensive test
- ❌ `test-simple-complete.sh` - Legacy complete test
- ❌ `test-new-architecture.sh` - Architecture transition test
- ❌ `test-complete-flow.sh` - Old flow test
- ❌ `test-complete-matching.sh` - Legacy matching test

## 🛠️ Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
lsof -i :5000  # Backend
lsof -i :5174  # Frontend

# Force kill if needed
./stop.sh
pkill -f dotnet
pkill -f vite
```

### Backend Issues
```bash
# Check backend logs
tail -20 backend.log

# Manual backend start for debugging
cd Backend/ComplicityGame.Api
dotnet build
dotnet run
```

### Database Issues
```bash
# Check database
cd Backend/ComplicityGame.Api
sqlite3 game.db
.tables
.schema Users
SELECT COUNT(*) FROM Users;
```

### Test Failures
```bash
# Run specific test components
curl -s http://localhost:5000/api/EventDrivenGame/connect

# Check database state
./test-partner-matching.sh  # More focused testing
```

## 🎯 Best Practices

### Before Code Changes
1. Run `./test-all.sh` to establish baseline
2. Make your changes
3. Run tests again to verify no regressions

### Performance Testing
- Monitor startup times (should be < 30 seconds)
- Check memory usage during tests
- Verify clean shutdown without hanging processes

### Production Deployment
1. `./stop.sh` - Clean environment
2. Update code
3. `./start.sh` - Deploy
4. `./test-all.sh` - Verify deployment
5. Monitor logs and performance

## 📋 Script Maintenance

### Adding New Tests
Add test functions to `test-all.sh`:
```bash
run_test "Test Name" "test_command_or_function"
```

### Modifying Startup
Update `start.sh` for new services or configuration changes.

### Updating Documentation
Keep this file updated when adding new scripts or changing functionality.

---

## 🏁 Summary

The CardApp script ecosystem provides:
- 🚀 **Easy Development**: One command to start everything
- 🧪 **Comprehensive Testing**: Full functionality verification
- 🔧 **Maintenance Tools**: Cleanup and troubleshooting utilities
- 📊 **Clear Feedback**: Detailed results and error reporting

All scripts are designed for reliability, clarity, and ease of use in both development and production environments.
