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
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth', 'lobby', 'playing'
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState(null); // null / Single / auto 'Couple'
  const [apiService] = useState(new EventDrivenApiService());
  const [purging, setPurging] = useState(false);
  const [joinCounts, setJoinCounts] = useState({ incoming: 0, outgoing: 0 });
  const [toasts, setToasts] = useState([]);

  const pushToast = (text, tone='info') => {
    const id = Date.now()+Math.random();
    setToasts(t => [...t, { id, text, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  console.log('🚀 SimpleApp rendering...', { currentScreen, authenticatedUser, selectedGameType });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiService.disconnectUser().catch(console.error);
    };
  }, [apiService]);

  // Auto switch to playing when backend starts a game session (e.g., dopo accept join coppia)
  useEffect(() => {
    const handler = (payload) => {
      console.log('🎮 gameSessionStarted event ricevuto:', payload);
      // Se non c'è un game type scelto, assumiamo Couple
      setSelectedGameType(prev => prev || { id: 'Couple', name: 'Gioco di Coppia' });
      setCurrentScreen('playing');
      pushToast('Partita di coppia avviata!','success');
    };
    apiService.on('gameSessionStarted', handler);
    return () => apiService.off('gameSessionStarted', handler);
  }, [apiService]);

  useEffect(() => {
    const coupleHandler = (data) => {
      if (currentScreen === 'game-selection') pushToast('Coppia formata, avvio in corso...','info');
    };
    apiService.on('coupleJoined', coupleHandler);
    return () => apiService.off('coupleJoined', coupleHandler);
  }, [apiService, currentScreen]);

  // Clear all users (admin function) - using new API
  const clearAllUsers = async () => {
    try {
      if (purging) return;
      if (!window.confirm('Sei sicuro di voler eliminare TUTTI gli utenti? Operazione distruttiva.')) return;
      setPurging(true);
      console.log('🧹 Avvio purge utenti (admin)...');
      const res = await apiService.purgeAllUsers();
      if (!res.success) {
        console.warn('Purge backend fallita, fallback a reset locale:', res.error);
        await apiService.disconnectUser();
      } else {
        console.log('✅ Purge backend completata');
      }
      // Reset stato app comunque
      localStorage.removeItem('complicity_auth');
      setCurrentScreen('auth');
      setAuthenticatedUser(null);
      setSelectedGameType(null);
    } catch (error) {
      console.error('❌ Error during reset:', error);
  } finally { setPurging(false); }
  };

  // Authentication successful - user is already connected via apiService
  const handleAuthSuccess = async (user) => {
    console.log('✅ Authentication successful:', user);
  setAuthenticatedUser(user);
  setCurrentScreen('lobby');
  };

  // Game type selected
  const handleGameTypeSelected = (gameType, updatedUser) => {
    console.log('✅ Game type selected:', gameType, updatedUser);
    setSelectedGameType(gameType);
    setAuthenticatedUser(updatedUser);
    if (gameType.id === 'Couple' || gameType.id === 'Coppia') {
      // Rimani in game-selection: la sessione di coppia partirà dopo join approvata
      return;
    }
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
  const handleBackToLobby = () => {
    console.log('🔄 Back to lobby...');
    setCurrentScreen('lobby');
    setSelectedGameType(null);
  };

  // Render game type selection screen
  const renderLobby = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎮 Lobby di Gioco
          </h2>
          <p className="text-gray-600 space-x-1">
            <span>Ciao</span>
            <span className="font-semibold text-gray-800">{authenticatedUser?.name || authenticatedUser?.Name || 'Utente'}</span>
            <span>(codice:</span>
            <span className="font-mono font-bold text-blue-600">{authenticatedUser?.userCode}</span>
            <span>)</span>
          </p>
        </div>

        <div className="space-y-4">
          <TTLSettings apiService={apiService} />
          <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3 leading-relaxed">
            <p className="mb-1"><span className="font-semibold">Gioco di Coppia:</span> invia una richiesta cliccando "Richiedi" accanto a un utente online. Quando l'altro accetta la sessione parte per entrambi automaticamente.</p>
            <p className="mb-0"><span className="font-semibold">Gioco Singolo:</span> premi il pulsante qui sotto per iniziare subito in modalità singola.</p>
          </div>
          <button
            onClick={() => handleGameTypeSelected({ id: 'Single', name: 'Gioco Singolo' }, authenticatedUser)}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 text-base font-semibold"
          >🎴 Avvia Gioco Singolo</button>

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
                showCounts={true}
                onCountsChange={setJoinCounts}
            />
              {(
                <div className="mt-4 p-3 rounded-md border border-purple-200 bg-purple-50 text-xs text-purple-800 flex flex-col gap-1">
                  <div><span className="font-semibold">Stato Coppia</span></div>
                  <div>Richieste ricevute: <span className="font-mono">{joinCounts.incoming}</span> • inviate: <span className="font-mono">{joinCounts.outgoing}</span></div>
                  <div className="text-[11px] text-purple-600">Accetta o invia una richiesta per avviare automaticamente la partita.</div>
                </div>
              )}
              {toasts.length>0 && (
                <div className="fixed bottom-4 right-4 space-y-2 z-50">
                  {toasts.map(t => (
                    <div key={t.id} className={`px-3 py-2 rounded shadow text-sm text-white ${t.tone==='success'?'bg-green-600':t.tone==='error'?'bg-red-600':'bg-gray-800'}`}>{t.text}</div>
                  ))}
                </div>
              )}
          </div>

          <button onClick={handleLogout} className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">← Logout</button>
          <button
            onClick={() => { localStorage.removeItem('complicity_auth'); setAuthenticatedUser(null); setCurrentScreen('auth'); }}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm"
          >
            🔄 Nuovo Utente
          </button>
          <button
            onClick={clearAllUsers}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 text-sm"
            title="Pulisce tutti gli utenti dal sistema (admin/debug)"
          >
            🧹 Pulisci Utenti
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
  return <ErrorBoundary>{renderLobby()}</ErrorBoundary>;

    case 'playing':
      // Render different components based on game type
      if (selectedGameType && selectedGameType.id === 'Couple') {
        return (
          <ErrorBoundary>
            <CoupleGame
              user={authenticatedUser}
              apiService={apiService}
              onExit={handleBackToLobby}
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
              onExit={handleBackToLobby}
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
