@echo off
REM 🎮 Gioco della Complicità - Unified Backend (Windows)
REM Script per avviare l'applicazione con architettura unificata

echo 🎮 Gioco della Complicità - Unified Backend
echo ===========================================
echo 📋 Architettura: React Frontend + ASP.NET Core Backend
echo.

REM Verifica prerequisiti
echo 🔍 Verifica prerequisiti...
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ .NET SDK non trovato. Scaricalo da: https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js/npm non trovato. Scaricalo da: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Prerequisiti verificati

REM Verifica struttura progetto
if not exist "Backend\ComplicityGame.Api" (
    echo ❌ Directory backend non trovata: Backend\ComplicityGame.Api
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ package.json non trovato nella directory root
    pause
    exit /b 1
)

REM Pulizia processi esistenti
echo 🧹 Pulizia processi esistenti...
taskkill /F /IM "dotnet.exe" /T 2>nul
taskkill /F /IM "node.exe" /T 2>nul
timeout /t 2 /nobreak >nul

REM Avvia backend
echo 🔧 Avvio backend ASP.NET Core...
echo    📍 Porta: 5000
echo    📂 Directory: Backend\ComplicityGame.Api
cd Backend\ComplicityGame.Api
start "Backend ASP.NET Core" /B dotnet run
cd ..\..

REM Aspetta backend
echo ⏳ Attendo che il backend sia pronto...
timeout /t 8 /nobreak >nul

REM Verifica dipendenze npm
if not exist "node_modules" (
    echo 📦 Installazione dipendenze npm...
    npm install
)

REM Avvia frontend
echo 🎨 Avvio frontend React + Vite...
echo    📍 Porta: 5173
echo    ⚛️  Framework: React con architettura unificata
start "Frontend React" npm run dev

REM Aspetta frontend
timeout /t 5 /nobreak >nul

echo.
echo 🎉 SERVIZI AVVIATI CON SUCCESSO!
echo.
echo ┌─────────────────────────────────────────────────┐
echo │                    ENDPOINTS                    │
echo ├─────────────────────────────────────────────────┤
echo │ 📱 Frontend:     http://localhost:5173           │
echo │ ⚙️  Backend API:  http://localhost:5000           │
echo │ 🔍 Health Check: http://localhost:5000/api/health │
echo │ 🎮 SignalR Hub:  ws://localhost:5000/gamehub      │
echo └─────────────────────────────────────────────────┘
echo.
echo 🏗️  ARCHITETTURA UNIFICATA:
echo    • Frontend: React + Vite + Tailwind CSS
echo    • Backend: ASP.NET Core + SignalR + SQLite
echo    • Comunicazione: HTTP REST + WebSocket
echo.
echo 💡 Il browser si aprirà automaticamente su http://localhost:5173
echo.
echo 📋 CONTROLLI ADMIN DISPONIBILI:
echo    • Clear Users: Rimuove tutti gli utenti
echo    • Refresh: Aggiorna tutti i dati
echo    • Debug: Mostra informazioni di debug
echo    • Sync: Sincronizza dati con il backend
echo.

REM Apri browser automaticamente
timeout /t 3 /nobreak >nul
echo 🌐 Apertura browser...
start http://localhost:5173

echo.
echo 🛑 Chiudi questa finestra per terminare tutti i servizi
echo.
echo Premi un tasto per continuare o chiudi la finestra...
pause >nul
