# CardApp - Requirements Checker and Setup Guide

Write-Host "CardApp - Checking System Requirements" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check .NET SDK
Write-Host "Checking .NET SDK..." -NoNewline
try {
    $dotnetVersion = & dotnet --version 2>$null
    if ($dotnetVersion) {
        $majorVersion = [int]($dotnetVersion.Split('.')[0])
        if ($majorVersion -ge 8) {
            Write-Host " OK - Found .NET $dotnetVersion" -ForegroundColor Green
        } else {
            Write-Host " WARNING - Found .NET $dotnetVersion (needs 8.0+)" -ForegroundColor Yellow
            $allGood = $false
        }
    } else {
        throw "Not found"
    }
} catch {
    Write-Host " NOT INSTALLED" -ForegroundColor Red
    Write-Host "   Download .NET 8.0 SDK from: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
    $allGood = $false
}

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = & node --version 2>$null
    if ($nodeVersion) {
        Write-Host " OK - Found Node.js $nodeVersion" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host " NOT INSTALLED" -ForegroundColor Red
    Write-Host "   Download Node.js LTS from: https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = & npm --version 2>$null
    if ($npmVersion) {
        Write-Host " OK - Found npm $npmVersion" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host " NOT INSTALLED" -ForegroundColor Red
    Write-Host "   npm is included with Node.js installation" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "All requirements met!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Install npm dependencies: npm install" -ForegroundColor White
    Write-Host "2. Start the application:" -ForegroundColor White
    Write-Host "   - Backend:  cd Backend\ComplicityGame.Api; dotnet run" -ForegroundColor Gray
    Write-Host "   - Frontend: npm run dev" -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "Would you like to install npm dependencies now? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host ""
        Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
        npm install
        Write-Host ""
        Write-Host "Dependencies installed!" -ForegroundColor Green
        Write-Host ""
        
        $startResponse = Read-Host "Would you like to start the application now? (y/n)"
        if ($startResponse -eq 'y' -or $startResponse -eq 'Y') {
            Write-Host ""
            Write-Host "Starting CardApp..." -ForegroundColor Cyan
            Write-Host ""
            
            Write-Host "Starting backend API..." -ForegroundColor Yellow
            $backendPath = Join-Path $PSScriptRoot "Backend\ComplicityGame.Api"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend API Server' -ForegroundColor Cyan; Write-Host ''; dotnet run"
            
            Start-Sleep -Seconds 3
            
            Write-Host "Starting frontend..." -ForegroundColor Yellow
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend Dev Server' -ForegroundColor Cyan; Write-Host ''; npm run dev"
            
            Write-Host ""
            Write-Host "CardApp is starting!" -ForegroundColor Green
            Write-Host "   Backend will be at: http://localhost:5000" -ForegroundColor White
            Write-Host "   Frontend will be at: http://localhost:5173" -ForegroundColor White
            Write-Host "   API Docs at: http://localhost:5000/swagger" -ForegroundColor White
            Write-Host ""
            Write-Host "Check the new windows for server output." -ForegroundColor Gray
        }
    }
} else {
    Write-Host ""
    Write-Host "Missing requirements detected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation Instructions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Install .NET 8.0 SDK:" -ForegroundColor White
    Write-Host "   - Visit: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Gray
    Write-Host "   - Download the SDK installer for Windows" -ForegroundColor Gray
    Write-Host "   - Run the installer and follow the prompts" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Install Node.js:" -ForegroundColor White
    Write-Host "   - Visit: https://nodejs.org/" -ForegroundColor Gray
    Write-Host "   - Download the LTS version installer" -ForegroundColor Gray
    Write-Host "   - Run the installer (npm is included)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. After installation:" -ForegroundColor White
    Write-Host "   - Restart your terminal/PowerShell" -ForegroundColor Gray
    Write-Host "   - Run this script again: .\check-requirements.ps1" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Press Enter to exit..."
$null = Read-Host
