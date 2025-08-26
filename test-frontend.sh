#!/bin/bash

# Quick frontend test script
echo "🎨 Testing frontend startup..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend not running on port 5000"
else
    echo "✅ Backend is running"
fi

# Start frontend in background for test
echo "🚀 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait a few seconds
sleep 5

# Check if frontend is responding
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend running on port 5173"
    FRONTEND_PORT=5173
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "✅ Frontend running on port 5174"
    FRONTEND_PORT=5174
else
    echo "❌ Frontend not responding on expected ports"
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo "🎉 Frontend test successful on port $FRONTEND_PORT"

# Cleanup
echo "🧹 Stopping test frontend..."
kill $FRONTEND_PID 2>/dev/null
sleep 2

echo "✅ Test completed"
