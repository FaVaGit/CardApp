#!/bin/bash

# Quick Setup Script for Real Backend
echo "🚀 Setting up Real Backend for Gioco della Complicità..."

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK is not installed!"
    echo "Please install .NET SDK from: https://dotnet.microsoft.com/download"
    echo "Required version: .NET 8.0 or later"
    exit 1
fi

echo "✅ .NET SDK found: $(dotnet --version)"

# Navigate to backend directory
cd "$(dirname "$0")/Backend/ComplicityGame.Api" || {
    echo "❌ Backend directory not found!"
    exit 1
}

echo "📁 Working directory: $(pwd)"

# Restore NuGet packages
echo "📦 Restoring NuGet packages..."
dotnet restore

if [ $? -ne 0 ]; then
    echo "❌ Failed to restore packages!"
    exit 1
fi

# Build the project
echo "🔨 Building the project..."
dotnet build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Check if database exists, if not create it
if [ ! -f "game.db" ]; then
    echo "🗄️ Creating database..."
    dotnet ef database update
    
    if [ $? -ne 0 ]; then
        echo "⚠️ Database creation failed, but continuing..."
        echo "The app will create SQLite database automatically on first run."
    fi
fi

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "🎯 To start the backend server:"
echo "   cd Backend/ComplicityGame.Api"
echo "   dotnet run"
echo ""
echo "🌐 Backend will be available at:"
echo "   HTTP:  http://localhost:5000"
echo "   HTTPS: https://localhost:5001"
echo ""
echo "🎮 To start the frontend:"
echo "   npm run dev"
echo ""
echo "💡 The frontend will automatically detect and use the real backend!"
echo ""
