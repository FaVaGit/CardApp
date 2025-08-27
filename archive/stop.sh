#!/bin/bash

echo "🧹 Stopping All Services"
echo "========================"

# Stop Node.js processes
echo "🛑 Stopping Frontend (npm/vite)..."
pkill -f "npm.*dev" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Stop .NET processes
echo "🛑 Stopping Backend (.NET)..."
pkill -f "dotnet.*run" 2>/dev/null
pkill -f "ComplicityGame.Api" 2>/dev/null

# Stop RabbitMQ Docker container
echo "🛑 Stopping RabbitMQ..."
docker stop rabbitmq 2>/dev/null
docker rm rabbitmq 2>/dev/null

echo "✅ All services stopped"
