import { useState, useRef, useEffect } from 'react';

/**
 * Simple Authentication Component
 * UPDATED: Now uses EventDrivenApiService for new event-driven backend
 */
export default function SimpleAuth({ onAuthSuccess, onClearUsers, apiService }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reuseSession, setReuseSession] = useState(null);

  // Check for stored auth data
  const reconnectAttemptedRef = useRef(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('complicity_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name && parsed?.userId && parsed?.personalCode && parsed?.authToken) {
          if (!reconnectAttemptedRef.current) {
            reconnectAttemptedRef.current = true;
            apiService.reconnect(parsed.userId, parsed.authToken)
              .then(res => {
                if (res?.invalidToken) {
                  // token invalid => clear stored session silently
                  localStorage.removeItem('complicity_auth');
                  setReuseSession(null);
                  return;
                }
                if (res && res.success !== false && res.userId) {
                  const user = {
                    id: res.userId,
                    name: parsed.name,
                    nickname: parsed.nickname,
                    gameType: 'Coppia',
                    userId: res.userId,
                    connectionId: res.connectionId,
                    userCode: res.personalCode,
                    personalCode: res.personalCode,
                    status: res
                  };
                  onAuthSuccess(user);
                } else {
                  setReuseSession(parsed); // fallback manual
                }
              })
              .catch(() => {
                setReuseSession(parsed); // fallback to manual
              });
          }
        } else if (parsed?.name && parsed?.userId) {
          setReuseSession(parsed); // legacy stored without token
        }
      }
    } catch {
      // ignora errori di parsing dello storage
    }
  }, [apiService, onAuthSuccess]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome richiesto');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use the new EventDrivenApiService
      const displayName = nickname.trim() || name.trim();
      const response = await apiService.connectUser(displayName, 'Coppia');
      
      console.log('✅ User authenticated via EventDrivenApi:', response);
      
      // Create a user object compatible with the rest of the app
      const user = {
        id: response.userId,
        name: displayName,
        nickname: nickname.trim(),
        gameType: 'Coppia',
        userId: response.userId,
        connectionId: response.connectionId,
        userCode: response.personalCode || 'N/A', // Add the personal code
        personalCode: response.personalCode || 'N/A',
        status: response
      };

      // Persist minimal auth context
      localStorage.setItem('complicity_auth', JSON.stringify({
        userId: user.userId,
        personalCode: user.personalCode,
        name: user.name,
        nickname: user.nickname,
        authToken: response.authToken
      }));
      
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
          {reuseSession && (
            <div className="mt-4 p-3 border border-green-200 bg-green-50 rounded text-sm text-green-700">
              Sessione precedente trovata per <strong>{reuseSession.name}</strong> (codice <span className="font-mono">{reuseSession.personalCode}</span>). Reinserisci il nome per riconnetterti.
            </div>
          )}
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
