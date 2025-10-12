# 🛠️ CardApp Scripts Documentation

## Available Scripts

### 🚀 start.sh
Main application launcher script that starts both backend and frontend services.

**Usage:**
```bash
./start.sh [OPTIONS]
```

**Options:**
- `--simple` or `-s` - Simple mode (skip build checks, faster start)
- `--cleanup` or `-c` - Only cleanup ports and exit
- `--help` or `-h` - Show help information

**Examples:**
```bash
./start.sh              # Normal start with full checks
./start.sh --simple     # Quick start without build verification
./start.sh --cleanup    # Clean up ports and exit
```

**Features:**
- ✅ Automatic port cleanup (5000, 5173-5180)
- ✅ Build verification (skippable with --simple)
- ✅ Health checking with retry logic
- ✅ Process monitoring and error detection
- ✅ Graceful shutdown with Ctrl+C

### 🛑 stop.sh
Enhanced stop script that cleanly shuts down all services and cleans up ports.

**Usage:**
```bash
./stop.sh
```

**Features:**
- ✅ Kills all backend (dotnet) processes
- ✅ Kills all frontend (npm/vite) processes
- ✅ Aggressive port cleanup (5000, 5173-5180)
- ✅ Verification of port cleanup
- ✅ Detailed feedback on cleanup status

### 🧪 test-all.sh
Comprehensive test suite for the application.

**Usage:**
```bash
./test-all.sh
```

### 👥 test-partner-matching.sh
Specific tests for partner matching functionality.

**Usage:**
```bash
./test-partner-matching.sh
```

## Port Management

The scripts automatically manage these ports:
- **5000** - Backend API
- **5173** - Frontend (preferred)
- **5174-5180** - Alternative frontend ports (cleaned up)

## Logging

Both scripts create log files:
- `backend.log` - Backend application logs
- `frontend.log` - Frontend application logs

## Migration from Old Scripts

Previously, the project had multiple scripts:
- `start.sh` (complex)
- `start-simple.sh` (basic)

These have been unified into a single `start.sh` with optional modes.

## Troubleshooting

### Port Issues
If you encounter port conflicts:
```bash
./start.sh --cleanup  # Clean up ports only
./stop.sh            # Full cleanup
```

### Build Issues
If backend build fails:
```bash
cd Backend/ComplicityGame.Api
dotnet build         # See detailed build errors
```

### Process Issues
If processes don't start:
```bash
tail -20 backend.log   # Check backend logs
tail -10 frontend.log  # Check frontend logs
```
