#!/bin/bash

# 🚀 AVVIO SUPER RAPIDO - Gioco della Complicità

echo "🎮 Avvio del Gioco della Complicità..."

# Termina processi esistenti
pkill -f "dotnet run" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true

# Avvia backend
echo "🔧 Avvio backend..."
cd Backend/ComplicityGame.Api
dotnet run > /dev/null 2>&1 &

# Aspetta backend
sleep 5

# Torna alla root e avvia frontend
cd ../../
echo "🎨 Avvio frontend..."
npm run dev > /dev/null 2>&1 &

# Aspetta frontend
sleep 3

echo ""
echo "🎉 TUTTO PRONTO!"
echo ""
echo "👉 Apri il browser su: http://localhost:5173"
echo ""
echo "Per fermare tutto, chiudi questo terminale o premi Ctrl+C"

# Mantieni attivo
while true; do
    sleep 1
done
