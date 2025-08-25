@echo off
REM 🎮 Gioco della Complicità - Avvio per Windows

echo 🎮 Avvio Gioco della Complicità...
echo ==================================

REM Pulizia processi esistenti
echo 🧹 Pulizia processi esistenti...
taskkill /F /IM "dotnet.exe" 2>nul
taskkill /F /IM "node.exe" 2>nul

REM Aspetta un po'
timeout /t 2 /nobreak >nul

REM Avvia backend
echo 🔧 Avvio backend ASP.NET Core...
cd Backend\ComplicityGame.Api
start /B dotnet run
cd ..\..

REM Aspetta backend
echo ⏳ Attendo backend...
timeout /t 8 /nobreak >nul

REM Verifica che npm install sia stato fatto
if not exist "node_modules" (
    echo 📦 Installazione dipendenze...
    npm install
)

REM Avvia frontend
echo 🎨 Avvio frontend React + Vite...
start /B npm run dev

REM Aspetta frontend
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Servizi avviati con successo!
echo.
echo 📱 Frontend: http://localhost:5173
echo ⚙️  Backend:  http://localhost:5000
echo.
echo 💡 Apri il browser su http://localhost:5173
echo.
echo 🛑 Premi un tasto per terminare i servizi...
pause >nul

REM Cleanup al termine
echo 🛑 Terminazione servizi...
taskkill /F /IM "dotnet.exe" 2>nul
taskkill /F /IM "node.exe" 2>nul

echo 👋 Arrivederci!
