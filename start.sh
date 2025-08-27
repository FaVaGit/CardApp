#!/bin/bash

# CardApp - Start Script
# Starts both backend API and frontend React application

set -e

echo "🚀 CardApp - Starting Application"
echo "================================="

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_DIR="Backend/ComplicityGame.Api"
BACKEND_LOG="backend.log"
FRONTEND_LOG="frontend.log"
BACKEND_PORT=5000
FRONTEND_PORT=5173

# Parse command line arguments
SIMPLE_MODE=false
CLEANUP_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --simple|-s)
            SIMPLE_MODE=true
            shift
            ;;
        --cleanup|-c)
            CLEANUP_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Start the CardApp with both backend and frontend services."
            echo ""
            echo "Options:"
            echo "  --simple, -s    Simple mode (skip build checks, faster start)"
            echo "  --cleanup, -c   Only cleanup ports and exit"
            echo "  --help, -h      Show this help"
            echo ""
            echo "Examples:"
            echo "  $0              # Normal start with full checks"
            echo "  $0 --simple     # Quick start without build verification"
            echo "  $0 --cleanup    # Clean up ports and exit"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for available options"
            exit 1
            ;;
    esac
done

# Enhanced cleanup function
cleanup() {
    echo ""
    echo "�� Stopping services..."
    
    # Kill application processes
    pkill -f "dotnet.*run" 2>/dev/null || true
    pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null || true
    
    # Clean up application ports
    echo "🧹 Cleaning up ports..."
    for port in 5000 5173 5174 5175 5176 5177 5178 5179 5180; do
        lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    done
    
    sleep 2
    echo "✅ Cleanup completed"
    
    if [ "$CLEANUP_ONLY" = true ]; then
        echo "🏁 Cleanup-only mode finished"
        exit 0
    fi
    
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# If cleanup only mode, run cleanup and exit
if [ "$CLEANUP_ONLY" = true ]; then
    cleanup
fi

# Initial cleanup
echo "🧹 Initial cleanup..."
pkill -f "dotnet.*run" 2>/dev/null || true
pkill -f "vite\|npm.*start\|npm.*dev" 2>/dev/null || true
for port in 5000 5173 5174 5175 5176 5177 5178 5179 5180; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
sleep 2

# Start Backend
echo "🎯 Starting Backend API..."
cd "$BACKEND_DIR"

# Build check (skip in simple mode)
if [ "$SIMPLE_MODE" = false ]; then
    echo "🔨 Verifying backend build..."
    if ! dotnet build > /dev/null 2>&1; then
        echo "❌ Backend build failed. Run 'cd $BACKEND_DIR && dotnet build' to see errors."
        exit 1
    fi
    echo "✅ Backend build successful"
fi

# Start backend
echo "🚀 Starting backend process..."
nohup dotnet run > "../../$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend (different strategies for simple vs full mode)
if [ "$SIMPLE_MODE" = true ]; then
    echo "⏳ Waiting for backend (simple mode)..."
    sleep 5
else
    echo "⏳ Waiting for backend to start..."
    for i in {1..30}; do
        # Try to connect to swagger endpoint
        if curl -s "http://localhost:$BACKEND_PORT/swagger" > /dev/null 2>&1; then
            echo "✅ Backend started successfully on port $BACKEND_PORT"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo "❌ Backend failed to start within 30 seconds"
            echo "📋 Check logs: tail -20 $BACKEND_LOG"
            cleanup
            exit 1
        fi
    done
fi

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$SCRIPT_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Start frontend with forced port
echo "🌐 Starting frontend on port $FRONTEND_PORT..."
PORT=$FRONTEND_PORT npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
echo "⏳ Waiting for frontend to start..."
for i in {1..15}; do
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo "✅ Frontend started successfully on port $FRONTEND_PORT"
        break
    fi
    sleep 1
    if [ $i -eq 15 ]; then
        echo "⚠️  Frontend taking longer than expected"
        echo "📋 Check logs: tail -10 $FRONTEND_LOG"
        break
    fi
done

# Success message
echo ""
echo "🎉 CardApp Started Successfully!"
echo "==============================="
echo "🔧 Backend API: http://localhost:$BACKEND_PORT"
echo "🎮 Frontend: http://localhost:$FRONTEND_PORT"
echo "📚 API Docs: http://localhost:$BACKEND_PORT/swagger"
echo ""
echo "🎯 Ready to use! Open the frontend URL in your browser."
echo "�� For couple games, open two browser tabs and use partner codes."
echo ""
echo "📋 Press Ctrl+C to stop all services"
echo ""

# Monitor processes (skip in simple mode)
if [ "$SIMPLE_MODE" = false ]; then
    echo "🔍 Monitoring processes..."
    while true; do
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo "❌ Backend process died. Check logs: tail -20 $BACKEND_LOG"
            cleanup
            exit 1
        fi
        
        if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
            echo "❌ Frontend process died. Check logs: tail -10 $FRONTEND_LOG"
            cleanup
            exit 1
        fi
        
        sleep 5
    done
else
    # Simple mode - just wait
    echo "🔄 Running in simple mode - use Ctrl+C to stop"
    wait
fi
