import React, { useState } from 'react';

/**
 * Simple Game Type Selector
 * COMPLETELY DECOUPLED from authentication and couples
 * Single responsibility: Choose game type
 */
export default function GameTypeSelector({ user, onGameTypeSelected, onLogout }) {
  const [selectedGameType, setSelectedGameType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const gameTypes = [
    {
      id: 'Single',
      name: 'Gioco Singolo',
      description: 'Esplora le carte da solo',
      icon: '🃏',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'Couple',
      name: 'Gioco di Coppia',
      description: 'Condividi le carte con il tuo partner',
      icon: '💕',
      color: 'bg-pink-500 hover:bg-pink-600'
    }
  ];

  const handleGameTypeSelection = async (gameType) => {
    setIsLoading(true);
    
    try {
      // Update user's game type preference
      const response = await fetch(`http://localhost:5000/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          nickname: user.nickname,
          gameType: gameType.id,
          availableForPairing: gameType.id === 'Couple'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      console.log('✅ Game type selected:', gameType.id, updatedUser);
      
      // Notify parent with the game type choice
      onGameTypeSelected(gameType, updatedUser);
      
    } catch (err) {
      console.error('❌ Game type selection failed:', err);
      alert(`Errore nella selezione: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ciao, {user.nickname || user.name}! 👋
          </h1>
          <p className="text-gray-600">
            Scegli il tipo di gioco che preferisci
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {gameTypes.map((gameType) => (
            <div
              key={gameType.id}
              className="border-2 border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => !isLoading && handleGameTypeSelection(gameType)}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">{gameType.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {gameType.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {gameType.description}
                </p>
                <button
                  disabled={isLoading}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors disabled:opacity-50 ${gameType.color}`}
                >
                  {isLoading ? '🔄 Attendi...' : 'Seleziona'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Torna al login
          </button>
        </div>
      </div>
    </div>
  );
}
