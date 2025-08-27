#!/bin/bash

# CardApp - Modern Event-Driven Architecture
# Start script for the complete application

set -e

echo "🚀 CardApp - Event-Driven Architecture"
echo "======================================"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_DIR="Backend/ComplicityGame.Api"
BACKEND_LOG="backend.log"
FRONTEND_PORT=5174
BACKEND_PORT=5000

# Clean up function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    pkill -f "dotnet.*run" 2>/dev/null || true
    pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null || true
    sleep 2
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "dotnet.*run" 2>/dev/null || true
pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null || true
sleep 2

# Start Backend
echo "🎯 Starting Backend API..."
cd "$BACKEND_DIR"

# Check if we can build first
if ! dotnet build > /dev/null 2>&1; then
    echo "❌ Backend build failed. Please check the build errors."
    exit 1
fi

# Start backend in background
nohup dotnet run > "../../$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s "http://localhost:$BACKEND_PORT/api/EventDrivenGame/connect" > /dev/null 2>&1; then
        echo "✅ Backend started successfully on port $BACKEND_PORT"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start within 30 seconds"
        echo "Check logs: tail -20 $BACKEND_LOG"
        cleanup
        exit 1
    fi
done

# Start Frontend
echo "🎨 Starting Frontend..."

# Ensure we're in the correct directory
cd "$SCRIPT_DIR"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Start frontend with explicit output handling
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..15}; do
    # Check multiple possible ports (Vite might choose different ports)
    for port in 5174 5173 3000 4173; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            FRONTEND_PORT=$port
            echo "✅ Frontend started successfully on port $port"
            FRONTEND_URL="http://localhost:$port"
            break 2
        fi
    done
    sleep 2
    if [ $i -eq 15 ]; then
        echo "⚠️  Frontend taking longer than expected to start"
        echo "📋 Check frontend logs: tail -10 frontend.log"
        FRONTEND_URL="http://localhost:5174"
        break
    fi
done

echo ""
echo "✅ Application Started Successfully!"
echo "🔧 Backend API: http://localhost:$BACKEND_PORT"
echo "🎮 Frontend: $FRONTEND_URL"
echo ""
echo "📱 Ready to use! Open the frontend URL in your browser."
echo "👥 For couple games, open two browser tabs and use the partner codes to connect."
echo ""
echo "📋 Press Ctrl+C to stop all services"
echo ""

# Keep script running and monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "❌ Backend process died. Check logs: tail -20 $BACKEND_LOG"
        cleanup
        exit 1
    fi
    
    # Check if frontend is still running
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "❌ Frontend process died."
        cleanup
        exit 1
    fi
    
    sleep 5
done
