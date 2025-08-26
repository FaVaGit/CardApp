import React, { useState } from 'react';

/**
 * Simple Authentication Component
 * COMPLETELY DECOUPLED from game types, couples, sessions
 * Single responsibility: Register/Login users
 */
export default function SimpleAuth({ onAuthSuccess, onClearUsers }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome richiesto');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simple registration - NO game type, NO couples, NO complexity
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          nickname: nickname.trim() || name.trim(),
          gameType: 'Single', // Default to simplest case
          availableForPairing: false // Keep it simple
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const user = await response.json();
      console.log('✅ User authenticated:', user);
      
      // Notify parent with the authenticated user
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('❌ Authentication failed:', err);
      setError(`Errore di autenticazione: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎮 Gioco della Complicità
          </h1>
          <p className="text-gray-600">
            Accedi per iniziare
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Il tuo nome"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              Nickname (opzionale)
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Come vuoi essere chiamato"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '🔄 Accesso in corso...' : '🚀 Accedi'}
          </button>
        </form>

        {/* Admin actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClearUsers}
            className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            🧹 Pulisci tutti gli utenti (Debug)
          </button>
        </div>
      </div>
    </div>
  );
}
