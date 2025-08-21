import React, { useState, useEffect } from 'react';
import { expandedCards } from './expandedCards';

export function PartnerManagement({ 
  currentUser,
  allUsers,
  onlineUsers,
  currentCouple,
  partnerStatus,
  gameSession,
  connectionStatus,
  onJoinUserByCode,
  onCreateGameSession,
  onLeaveCouple,
  onSendMessage,
  onShareCard,
  onRefreshData,
  onUpdatePartnerStatus,
  onLogout,
  onBack
}) {
  const [activeTab, setActiveTab] = useState(currentCouple ? 'couple' : 'join');
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  // Reset error quando cambia tab
  useEffect(() => {
    setError('');
  }, [activeTab]);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    
    if (!joinCode.trim() || joinCode.length !== 6) {
      setError('Inserisci un codice valido di 6 caratteri');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const result = await onJoinUserByCode(joinCode.toUpperCase());
      if (result) {
        setActiveTab('couple');
        setJoinCode('');
      } else {
        setError('Utente non trovato o non disponibile');
      }
    } catch (error) {
      setError('Errore durante il join');
      console.error('Join error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartGameSession = async () => {
    try {
      await onCreateGameSession('couple');
      setActiveTab('game');
    } catch (error) {
      setError('Errore durante la creazione della sessione');
      console.error('Session creation error:', error);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      await onSendMessage(chatMessage);
      setChatMessage('');
    } catch (error) {
      console.error('Message send error:', error);
    }
  };

  const handleShareRandomCard = async () => {
    // Prendi una carta casuale dal database
    const randomCard = expandedCards[Math.floor(Math.random() * expandedCards.length)];
    const randomPrompt = randomCard.prompts[Math.floor(Math.random() * randomCard.prompts.length)];
    
    const cardToShare = {
      id: `${randomCard.id}_${Date.now()}`,
      content: randomPrompt,
      title: randomCard.title,
      emoji: randomCard.emoji,
      category: randomCard.category,
      color: randomCard.color,
      type: "conversation"
    };

    try {
      await onShareCard(cardToShare);
    } catch (error) {
      console.error('Card share error:', error);
    }
  };

  // Status indicator
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'syncing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connesso';
      case 'syncing': return 'Sincronizzazione...';
      case 'error': return 'Errore connessione';
      default: return 'Disconnesso';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">👥 Gestione Partner</h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-300">
                {currentUser?.name} ({currentUser?.personalCode})
              </span>
              <span className={`text-xs ${getStatusColor()}`}>
                ● {getStatusText()}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">              <button
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('Current User:', currentUser);
                  console.log('Current Couple:', currentCouple);
                  console.log('Game Session:', gameSession);
                  console.log('Online Users:', onlineUsers);
                  console.log('Partner Status:', partnerStatus);
                  console.log('Connection Status:', connectionStatus);
                  if (window.simulatedBackend) {
                    console.log('Backend Stats:', window.simulatedBackend.getStats());
                    console.log('Local Data Users:', window.simulatedBackend.localData.users.size);
                    console.log('LocalStorage Data:', localStorage.getItem('complicita_shared_data'));
                  }
                  alert('Debug info logged to console');
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                🐛 Debug
              </button>
            <button
              onClick={() => {
                if (window.simulatedBackend) {
                  console.log('🔄 Forcing sync...');
                  window.simulatedBackend.syncWithLocalStorage();
                  // Force refresh users and partner status
                  setTimeout(async () => {
                    console.log('🔄 Refreshing user data...');
                    if (onRefreshData) {
                      await onRefreshData();
                    }
                    // Force partner status update if in couple
                    if (currentCouple && typeof onUpdatePartnerStatus === 'function') {
                      console.log('👥 Forcing partner status update...');
                      onUpdatePartnerStatus();
                    }
                  }, 500);
                  alert('Sync forzato! Controlla console per dettagli.');
                } else {
                  alert('Backend simulato non disponibile');
                }
              }}
              className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
            >
              🔄 Sync
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Logout
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
            >
              ← Indietro
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'join' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🤝 Unisciti ad un Partner
          </button>
          <button
            onClick={() => setActiveTab('couple')}
            disabled={!currentCouple}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'couple' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white disabled:opacity-50'
            }`}
          >
            💑 Coppia ({currentCouple ? '✓' : '✗'})
          </button>
          <button
            onClick={() => setActiveTab('game')}
            disabled={!gameSession}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'game' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white disabled:opacity-50'
            }`}
          >
            🎮 Sessione ({gameSession ? '✓' : '✗'})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'users' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 Utenti ({onlineUsers?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'join' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🤝 Unisciti ad un Partner</h2>
            <p className="text-gray-300 mb-6">
              Inserisci il codice del partner per creare una coppia e iniziare a giocare insieme.
            </p>
            
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Codice Partner (6 caratteri)
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono"
                  disabled={isJoining}
                />
              </div>
              
              <button
                type="submit"
                disabled={isJoining || joinCode.length !== 6}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isJoining ? 'Connessione in corso...' : 'Unisciti al Partner'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-600/20 border border-blue-600 rounded-lg">
              <h3 className="font-semibold text-blue-300 mb-2">💡 Il tuo codice di join</h3>
              <p className="text-blue-200 text-sm mb-2">
                Condividi questo codice con il tuo partner:
              </p>
              <div className="text-2xl font-mono text-center bg-blue-900/50 py-2 rounded mb-3">
                {currentUser?.personalCode}
              </div>
              
              {/* Quick Test Button */}
              <button
                onClick={async () => {
                  if (window.confirm('Vuoi creare un partner di test per simulare una coppia?')) {
                    try {
                      // Crea un partner simulato
                      const testPartner = {
                        name: `TestPartner_${Date.now().toString().slice(-4)}`,
                        gameType: currentUser.gameType
                      };
                      
                      // Simula registrazione partner (questo dovrebbe essere fatto in un'altra tab normalmente)
                      console.log('🧪 Creazione partner di test:', testPartner.name);
                      alert(`Partner di test creato! In un vero scenario, apriresti una nuova tab e useresti il codice: ${currentUser.personalCode}`);
                    } catch (error) {
                      console.error('Errore creazione partner test:', error);
                    }
                  }
                }}
                className="w-full py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
              >
                🧪 Test: Simula Partner
              </button>
            </div>
          </div>
        )}

        {activeTab === 'couple' && currentCouple && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">💑 {currentCouple.name}</h2>
              <button
                onClick={onLeaveCouple}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Lascia Coppia
              </button>
            </div>

            {/* Partner Status */}
            {partnerStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-400 mb-2">Tu</h3>
                  <p className="text-gray-300">{partnerStatus.currentUser?.name}</p>
                  <p className="text-xs text-green-400">● Online</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-400 mb-2">Partner</h3>
                  <p className="text-gray-300">{partnerStatus.partner?.name}</p>
                  <p className={`text-xs ${partnerStatus.partner?.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {partnerStatus.partner?.isOnline ? '● Online' : '● Offline'}
                  </p>
                  {partnerStatus.partner?.lastSeen && !partnerStatus.partner?.isOnline && (
                    <p className="text-xs text-gray-500">
                      Ultimo accesso: {new Date(partnerStatus.partner.lastSeen).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Game Session Actions */}              <div className="space-y-4">
                {!gameSession ? (
                  <button
                    onClick={handleStartGameSession}
                    disabled={!partnerStatus?.bothOnline}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {partnerStatus?.bothOnline 
                      ? '🎮 Inizia Sessione di Gioco' 
                      : '⏳ In attesa che il partner sia online'
                    }
                  </button>
                ) : (
                  <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                    <h3 className="font-semibold text-green-300 mb-2">🎮 Sessione Attiva</h3>
                    <p className="text-green-200 text-sm mb-3">
                      La sessione di gioco è attiva! Passa alla tab "Sessione" per giocare.
                    </p>
                    <button
                      onClick={() => setActiveTab('game')}
                      className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Vai alla Sessione →
                    </button>
                  </div>
                )}
                
                {/* Debug button for partner status */}
                <button
                  onClick={async () => {
                    console.log('🔄 Forcing partner status refresh...');
                    if (onRefreshData) {
                      await onRefreshData();
                    }
                    if (onUpdatePartnerStatus) {
                      setTimeout(() => onUpdatePartnerStatus(), 200);
                    }
                    alert('Partner status refresh forzato!');
                  }}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  🔄 Refresh Partner Status
                </button>
              </div>
          </div>
        )}

        {activeTab === 'couple' && !currentCouple && (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">💔 Nessuna Coppia</h2>
            <p className="text-gray-300 mb-6">
              Non sei ancora in una coppia. Unisciti ad un partner per iniziare a giocare insieme.
            </p>
            <button
              onClick={() => setActiveTab('join')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🤝 Trova un Partner
            </button>
          </div>
        )}

        {activeTab === 'game' && gameSession && (
          <div className="space-y-6">
            {/* Game Session Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎮 Sessione di Gioco</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Sessione ID</p>
                  <p className="font-mono text-sm">{gameSession.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tipo</p>
                  <p className="capitalize">{gameSession.sessionType}</p>
                </div>
              </div>

              {/* Current Card */}
              {gameSession.currentCard && (
                <div className={`bg-gradient-to-br ${gameSession.currentCard.color || 'from-purple-600 to-pink-600'} rounded-lg p-6 mb-4 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{gameSession.currentCard.emoji || '🃏'}</span>
                      <div>
                        <h3 className="font-semibold">{gameSession.currentCard.title || 'Carta Condivisa'}</h3>
                        <p className="text-xs opacity-75 capitalize">{gameSession.currentCard.category}</p>
                      </div>
                    </div>
                    <span className="text-xs opacity-75">
                      {new Date(gameSession.currentCard.sharedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-lg leading-relaxed mb-3">{gameSession.currentCard.content}</p>
                  <p className="text-xs opacity-75">
                    Condivisa da {gameSession.currentCard.sharedByName}
                  </p>
                </div>
              )}

              {/* Card History */}
              {gameSession.sharedHistory && gameSession.sharedHistory.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-300 mb-3">📚 Carte Condivise ({gameSession.sharedHistory.length})</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {gameSession.sharedHistory.slice(-3).map((card, index) => (
                      <div key={card.id || index} className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span>{card.emoji || '🃏'}</span>
                          <span className="text-gray-300 truncate flex-1">{card.content}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(card.sharedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleShareRandomCard}
                  className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  🃏 Condividi Carta
                </button>
                <button
                  onClick={() => alert('Canvas feature coming soon!')}
                  className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  🎨 Canvas
                </button>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">💬 Chat</h3>
              
              {/* Messages */}
              <div className="bg-gray-700 rounded-lg p-4 mb-4 h-64 overflow-y-auto">
                {gameSession.messages && gameSession.messages.length > 0 ? (
                  gameSession.messages.map((msg, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-blue-300">{msg.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nessun messaggio ancora. Inizia la conversazione!
                  </p>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendChatMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Invia
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'game' && !gameSession && (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">🎮 Nessuna Sessione</h2>
            <p className="text-gray-300 mb-6">
              Non c'è una sessione di gioco attiva. Crea una coppia e avvia una sessione per iniziare a giocare.
            </p>
            <button
              onClick={() => setActiveTab('couple')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              💑 Gestisci Coppia
            </button>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">👥 Utenti Online ({onlineUsers?.length || 0})</h2>
            
            {onlineUsers && onlineUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineUsers.map(user => (
                  <div key={user.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">
                        {user.name}
                        {user.id === currentUser?.id && ' (tu)'}
                      </h3>
                      <span className="text-xs text-green-400">● Online</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Codice: <span className="font-mono">{user.personalCode}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Tipo: {user.gameType}
                    </p>
                    {user.id !== currentUser?.id && user.availableForPairing && (
                      <button
                        onClick={() => {
                          setJoinCode(user.personalCode);
                          setActiveTab('join');
                        }}
                        className="mt-2 w-full py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        🤝 Unisciti
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nessun utente online al momento</p>
                <p className="text-sm text-gray-600">
                  Gli utenti appariranno qui quando si connettono
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
