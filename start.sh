#!/bin/bash

# CardApp - Main Start Script
# Modern event-driven architecture startup

set -e

echo "🚀 CardApp - Start Application"
echo "=============================="

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
            echo "Options:"
            echo "  --simple, -s    Simple mode (faster start, minimal checks)"
            echo "  --cleanup, -c   Only cleanup ports and processes, then exit"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Default mode includes build verification and health checks."
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Enhanced cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping CardApp services..."
    
    # Kill specific processes
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
    if ! dotnet build --verbosity quiet > /dev/null 2>&1; then
        echo "❌ Backend build failed. Run 'dotnet build' to see errors."
        cd "$SCRIPT_DIR"
        exit 1
    fi
    echo "✅ Backend build successful"
fi

# Start backend process
echo "🚀 Starting backend process..."
nohup dotnet run > "../../$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend with appropriate strategy
if [ "$SIMPLE_MODE" = true ]; then
    echo "⏳ Waiting for backend (simple mode - 5 seconds)..."
    sleep 5
else
    echo "⏳ Waiting for backend to respond..."
    for i in {1..30}; do
        if curl -s "http://localhost:$BACKEND_PORT/swagger" > /dev/null 2>&1; then
            echo "✅ Backend ready on port $BACKEND_PORT"
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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start frontend with fixed port
echo "🌐 Starting frontend on port $FRONTEND_PORT..."
PORT=$FRONTEND_PORT npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..15}; do
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo "✅ Frontend ready on port $FRONTEND_PORT"
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
echo "🎮 Frontend:    http://localhost:$FRONTEND_PORT"
echo "📚 API Docs:    http://localhost:$BACKEND_PORT/swagger"
echo ""
echo "🎯 Ready! Open the frontend URL in your browser."
echo "👥 For couple games: open two tabs, create accounts, and use partner codes."
echo ""
echo "📋 Press Ctrl+C to stop all services"
echo ""

# Process monitoring (skip in simple mode)
if [ "$SIMPLE_MODE" = false ]; then
    echo "🔍 Monitoring processes..."
    while true; do
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo "❌ Backend process died unexpectedly"
            echo "📋 Check logs: tail -20 $BACKEND_LOG"
            cleanup
            exit 1
        fi
        
        if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
            echo "❌ Frontend process died unexpectedly"
            echo "📋 Check logs: tail -10 $FRONTEND_LOG"
            cleanup
            exit 1
        fi
        
        sleep 5
    done
else
    echo "🔄 Simple mode - press Ctrl+C to stop"
    wait
fi
