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

# Check if ports are free
if lsof -ti :5000 > /dev/null 2>&1; then
    echo "⚠️  Port 5000 still in use"
else
    echo "✅ Port 5000 is free"
fi

if lsof -ti :5174 > /dev/null 2>&1 || lsof -ti :5173 > /dev/null 2>&1; then
    echo "⚠️  Frontend port still in use"
else
    echo "✅ Frontend ports are free"
fi

echo ""
echo "✅ All services stopped successfully"
