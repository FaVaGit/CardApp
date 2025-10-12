#!/bin/bash

# CardApp - Stop Script
# Stops all running services

echo "🛑 Stopping CardApp Services"
echo "============================="

# Kill backend processes
echo "🔥 Stopping backend..."
pkill -f "dotnet.*run" 2>/dev/null && echo "✅ Backend stopped" || echo "ℹ️  No backend processes found"

# Kill frontend processes  
echo "🔥 Stopping frontend..."
pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null && echo "✅ Frontend stopped" || echo "ℹ️  No frontend processes found"

# Wait a moment for processes to clean up
sleep 2

#!/bin/bash

# CardApp - Enhanced Stop Script
# Stops all running services and cleans up ports

echo "🛑 Stopping CardApp Services"
echo "============================="

# Kill backend processes
echo "🔥 Stopping backend..."
pkill -f "dotnet.*run" 2>/dev/null && echo "✅ Backend stopped" || echo "ℹ️  No backend processes found"

# Kill frontend processes  
echo "🔥 Stopping frontend..."
pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null && echo "✅ Frontend stopped" || echo "ℹ️  No frontend processes found"

# Clean up all application ports aggressively
echo "🧹 Cleaning up application ports..."
for port in 5000 5173 5174 5175 5176 5177 5178 5179 5180; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "  🔨 Forcing cleanup of port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

# Wait for cleanup
sleep 2

# Verify ports are free
echo "🔍 Verifying port cleanup..."
PORTS_STILL_USED=""
for port in 5000 5173 5174 5175 5176 5177 5178 5179 5180; do
    if lsof -ti:$port > /dev/null 2>&1; then
        PORTS_STILL_USED="$PORTS_STILL_USED $port"
    fi
done

if [ -n "$PORTS_STILL_USED" ]; then
    echo "⚠️  Some ports still in use:$PORTS_STILL_USED"
    echo "💡 You may need to manually kill processes or restart your terminal"
else
    echo "✅ All application ports are free"
fi

echo ""
echo "✅ Cleanup completed successfully"
echo "🚀 Ready for a fresh start with ./start-unified.sh"
