#!/bin/bash

echo "🚀 Starting Event-Driven Card Game Application"
echo "=============================================="

# Check if RabbitMQ is running (skip if Docker permission denied)
if docker ps 2>/dev/null | grep -q rabbitmq; then
    echo "✅ RabbitMQ already running"
elif docker ps >/dev/null 2>&1; then
    echo "📦 Starting RabbitMQ container..."
    docker run -d --name rabbitmq \
        -p 5672:5672 \
        -p 15672:15672 \
        -e RABBITMQ_DEFAULT_USER=admin \
        -e RABBITMQ_DEFAULT_PASS=admin \
        rabbitmq:3-management
    
    echo "⏳ Waiting for RabbitMQ to start..."
    sleep 10
else
    echo "⚠️  Docker not available, skipping RabbitMQ (events may not work)"
fi

# Get the script directory and navigate properly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Start Backend
echo "🎯 Starting Backend API..."
cd Backend/ComplicityGame.Api
dotnet run &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$SCRIPT_DIR"
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application Started Successfully!"
echo "📊 RabbitMQ Management: http://localhost:15672 (admin/admin)"
echo "🔧 Backend API: http://localhost:5000"
echo "🎮 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for user interrupt
wait
