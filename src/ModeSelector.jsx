import React from 'react';

export function ModeSelector({ onModeSelect }) {
  const handleStart = () => {
    onModeSelect({
      entityType: 'couple',
      gameMode: 'dual-device',
      playMode: 'private'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-orange-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <div className="text-6xl">💕</div>
            <h1 className="text-3xl font-bold text-white">
              Gioco della Complicità
            </h1>
            <p className="text-white/80 text-lg">
              Carte pensate per rafforzare la vostra connessione di coppia
            </p>
          </div>

          <div className="bg-white/20 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">
              🌟 Caratteristiche
            </h2>
            <ul className="text-white/90 space-y-2 text-left">
              <li>• Carte per scoprirvi reciprocamente</li>
              <li>• Esperienza personalizzata per ciascuno</li>
              <li>• Sincronizzazione in tempo reale</li>
              <li>• Connessione profonda e divertimento</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-pink-600 to-red-600 text-white font-bold py-4 px-6 rounded-xl 
                       hover:from-pink-700 hover:to-red-700 transform hover:scale-105 transition-all duration-200 
                       shadow-lg hover:shadow-xl"
          >
            Inizia il Gioco 💖
          </button>
        </div>
      </div>
    </div>
  );
}
