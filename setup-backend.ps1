# Quick Setup Script for Real Backend (Windows PowerShell)
Write-Host "🚀 Setting up Real Backend for Gioco della Complicità..." -ForegroundColor Green

# Check if .NET is installed
$dotnetVersion = & dotnet --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ .NET SDK is not installed!" -ForegroundColor Red
    Write-Host "Please install .NET SDK from: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    Write-Host "Required version: .NET 8.0 or later" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .NET SDK found: $dotnetVersion" -ForegroundColor Green

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "Backend\ComplicityGame.Api"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath
Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Cyan

# Restore NuGet packages
Write-Host "📦 Restoring NuGet packages..." -ForegroundColor Cyan
& dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restore packages!" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Cyan
& dotnet build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Check if database exists
if (-not (Test-Path "game.db")) {
    Write-Host "🗄️ Creating database..." -ForegroundColor Cyan
    & dotnet ef database update
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Database creation failed, but continuing..." -ForegroundColor Yellow
        Write-Host "The app will create SQLite database automatically on first run." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 To start the backend server:" -ForegroundColor Cyan
Write-Host "   cd Backend\ComplicityGame.Api" -ForegroundColor White
Write-Host "   dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Backend will be available at:" -ForegroundColor Cyan
Write-Host "   HTTP:  http://localhost:5000" -ForegroundColor White
Write-Host "   HTTPS: https://localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "🎮 To start the frontend:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 The frontend will automatically detect and use the real backend!" -ForegroundColor Yellow
Write-Host ""
