import { useState, useEffect } from 'react';

function ErrorBoundary({ children }) {
  const [err, setErr] = useState(null);
  useEffect(() => {
    const orig = console.error;
    console.error = (...a) => { orig(...a); if (!err && a[0] instanceof Error) setErr(a[0]); };
    return () => { console.error = orig; };
  }, [err]);
  if (err) {
    return <div className="p-6 text-sm text-red-700 bg-red-50">Errore runtime: {String(err.message || err)}<pre className="mt-2 text-xs whitespace-pre-wrap">{err.stack}</pre></div>;
  }
  return children;
}
import SimpleAuth from './SimpleAuth';
import SimpleCardGame from './SimpleCardGame';
import CoupleGame from './CoupleGame';
import EventDrivenApiService from './EventDrivenApiService';
import UserDirectory from './UserDirectory';
import TTLSettings from './TTLSettings';

/**
 * MODERNIZED APP ARCHITECTURE - Event-Driven RabbitMQ
 * 
 * Clear separation of concerns:
 * 1. Authentication with auto-user creation
 * 2. Game Type Selection using new EventDrivenGameController API
 * 3. Card Game with RabbitMQ event publishing
 * 
 * Each component uses the unified EventDrivenApiService
 * Real-time updates via RabbitMQ event system
 */
export default function SimpleApp() {
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth', 'game-selection', 'playing'
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState(null);
  const [apiService] = useState(new EventDrivenApiService());

  console.log('🚀 SimpleApp rendering...', { currentScreen, authenticatedUser, selectedGameType });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiService.disconnectUser().catch(console.error);
    };
  }, [apiService]);

  // Clear all users (admin function) - using new API
  const clearAllUsers = async () => {
    try {
      // Since we don't have an admin endpoint in EventDrivenGameController,
      // we'll just reset the app state for now
      console.log('✅ Resetting app state (admin function)');
      
      // Disconnect current user if connected
      await apiService.disconnectUser();
      
      // Reset app state
      setCurrentScreen('auth');
      setAuthenticatedUser(null);
      setSelectedGameType(null);
    } catch (error) {
      console.error('❌ Error during reset:', error);
    }
  };

  // Authentication successful - user is already connected via apiService
  const handleAuthSuccess = async (user) => {
    console.log('✅ Authentication successful:', user);
    setAuthenticatedUser(user);
    setCurrentScreen('game-selection');
  };

  // Game type selected
  const handleGameTypeSelected = (gameType, updatedUser) => {
    console.log('✅ Game type selected:', gameType, updatedUser);
    setSelectedGameType(gameType);
    setAuthenticatedUser(updatedUser);
    setCurrentScreen('playing');
  };

  // Logout with proper cleanup
  const handleLogout = async () => {
    console.log('🔄 Logging out...');
    
    try {
      // Attempt backend logout if token stored
      try {
        const stored = localStorage.getItem('complicity_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.authToken && apiService?.userId === parsed.userId) {
            await apiService.logout(parsed.authToken);
          } else {
            await apiService.disconnectUser();
          }
        } else {
          await apiService.disconnectUser();
        }
      } catch (e) {
        console.warn('Fallback disconnect:', e.message);
        await apiService.disconnectUser();
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
    
    // Clear stored auth to allow new registration
    localStorage.removeItem('complicity_auth');
    setCurrentScreen('auth');
    setAuthenticatedUser(null);
    setSelectedGameType(null);
  };

  // Back to game selection
  const handleBackToGameSelection = () => {
    console.log('🔄 Back to game selection...');
    setCurrentScreen('game-selection');
    setSelectedGameType(null);
  };

  // Render game type selection screen
  const renderGameSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎮 Seleziona Tipo di Gioco
          </h2>
          <p className="text-gray-600">
            Ciao <span className="font-mono font-bold text-blue-600">{authenticatedUser?.userCode}</span>!
          </p>
        </div>

        <div className="space-y-4">
          <TTLSettings apiService={apiService} />
          <button
            onClick={() => handleGameTypeSelected({ id: 'Single', name: 'Gioco Singolo' }, authenticatedUser)}
            className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg hover:bg-blue-600 text-lg font-semibold"
          >
            🎴 Gioco Singolo
          </button>

          <button
            onClick={() => handleGameTypeSelected({ id: 'Couple', name: 'Gioco di Coppia' }, authenticatedUser)}
            className="w-full bg-purple-500 text-white py-4 px-6 rounded-lg hover:bg-purple-600 text-lg font-semibold"
          >
            💕 Gioco di Coppia
          </button>

          <div className="pt-4 border-t border-gray-200">
            <UserDirectory
              apiService={apiService}
              currentUser={authenticatedUser}
              onSendJoin={async (targetId) => {
                try {
                  await apiService.requestJoin(targetId);
                } catch (e) { console.error(e); }
              }}
              onRespondJoin={async (requestingUserId, approve) => {
                try {
                  const jr = await apiService.listJoinRequests();
                  const incoming = jr.incoming || [];
                  const match = incoming.find(r => (r.RequestingUserId || r.requestingUserId) === requestingUserId);
                  if (match) {
                    const reqId = match.Id || match.id;
                    if (reqId) await apiService.respondJoin(reqId, approve);
                  } else {
                    console.warn('Join request not found for requestingUserId', requestingUserId, incoming);
                  }
                } catch (e) { console.error('respondJoin error', e); }
              }}
            />
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            ← Logout
          </button>
          <button
            onClick={() => { localStorage.removeItem('complicity_auth'); setAuthenticatedUser(null); setCurrentScreen('auth'); }}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm"
          >
            🔄 Nuovo Utente
          </button>
        </div>
      </div>
    </div>
  );

  // Render appropriate screen
  switch (currentScreen) {
    case 'auth':
      return (
        <ErrorBoundary>
          <SimpleAuth
            onAuthSuccess={handleAuthSuccess}
            onClearUsers={clearAllUsers}
            apiService={apiService}
          />
        </ErrorBoundary>
      );

    case 'game-selection':
  return <ErrorBoundary>{renderGameSelection()}</ErrorBoundary>;

    case 'playing':
      // Render different components based on game type
      if (selectedGameType && selectedGameType.id === 'Couple') {
        return (
          <ErrorBoundary>
            <CoupleGame
              user={authenticatedUser}
              apiService={apiService}
              onExit={handleBackToGameSelection}
            />
          </ErrorBoundary>
        );
      } else {
        return (
          <ErrorBoundary>
            <SimpleCardGame
              user={authenticatedUser}
              gameType={selectedGameType}
              apiService={apiService}
              onExit={handleBackToGameSelection}
            />
          </ErrorBoundary>
        );
      }

    default:
      return (
        <div className="min-h-screen bg-red-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              ❌ Errore
            </h1>
            <p className="text-red-600 mb-4">
              Schermata sconosciuta: {currentScreen}
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Torna al login
            </button>
          </div>
        </div>
      );
  }
}
