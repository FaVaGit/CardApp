#!/bin/bash

echo "🚀 Starting Card Game Application (Simple Mode)"
echo "==============================================="

# Get the script directory and navigate properly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "dotnet.*run" 2>/dev/null || true
pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null || true
sleep 2

# Start Backend
echo "🎯 Starting Backend API..."
cd Backend/ComplicityGame.Api
nohup dotnet run > ../../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Check if backend is running
if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start, check backend.log"
    exit 1
fi

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$SCRIPT_DIR"
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application Started Successfully!"
echo "🔧 Backend API: http://localhost:5000"
echo "🎮 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "dotnet.*run" 2>/dev/null || true
    pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
