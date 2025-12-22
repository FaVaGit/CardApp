@echo off
REM CardApp - Windows Batch Start Script
REM Starts both backend and frontend servers

echo ========================================
echo  CardApp - Starting Application
echo ========================================
echo.

REM Check if .NET is installed
where dotnet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: .NET SDK not found!
    echo Please install .NET 8.0 SDK from: https://dotnet.microsoft.com/download/dotnet/8.0
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules\" (
    echo Installing npm dependencies...
    call npm install
    echo.
)

echo Starting Backend API...
start "CardApp Backend" cmd /k "cd Backend\ComplicityGame.Api && dotnet run"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "CardApp Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  CardApp Started Successfully!
echo ========================================
echo.
echo  Backend API: http://localhost:5000
echo  Frontend:    http://localhost:5173
echo  API Docs:    http://localhost:5000/swagger
echo.
echo Two command windows have been opened.
echo Close those windows to stop the servers.
echo.
pause
