import React, { useState, useEffect } from 'react';

export function AdvancedLobby({ 
  currentUser, 
  allUsers, 
  onlineUsers,
  gameMode,
  entityType,
  playMode,
  partnerStatus,
  onCreateSession, 
  onJoinSession, 
  onStartSoloGame,
  onChangeMode 
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [sessionCode, setSessionCode] = useState('');

  // Filtra utenti per tipo di entità (coppie o famiglie)
  const relevantUsers = onlineUsers.filter(user => 
    user.entityType === entityType && user.id !== currentUser.id
  );

  const handleCreateSession = () => {
    if (selectedEntities.length > 0) {
      onCreateSession(selectedEntities);
      setShowInviteModal(false);
      setSelectedEntities([]);
    }
  };

  const handleJoinWithCode = () => {
    if (sessionCode.trim()) {
      onJoinSession(sessionCode.trim());
      setSessionCode('');
    }
  };

  const toggleEntitySelection = (entityId) => {
    setSelectedEntities(prev => 
      prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ora online';
    if (diffMinutes < 60) return `${diffMinutes} min fa`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h fa`;
    return 'Offline';
  };

  const getDisplayName = (user) => {
    return user.nickname || user.memberNames?.join(' & ') || 'Sconosciuto';
  };

  const getEntityInfo = () => {
    const info = {
      couple: {
        title: 'Coppie',
        emoji: '💑',
        color: 'from-pink-500 to-rose-500',
        bgColor: 'from-pink-50 to-rose-50'
      },
      family: {
        title: 'Famiglie',
        emoji: '👨‍👩‍👧‍👦',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'from-green-50 to-emerald-50'
      }
    };
    return info[entityType];
  };

  const entityInfo = getEntityInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header principale */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Lobby {entityInfo.title}
          </h1>
          <div className="flex items-center justify-center space-x-4 text-lg text-gray-600">
            <div className="flex items-center space-x-2">
              <span>{gameMode === 'dual-device' ? '📱📱' : '📱'}</span>
              <span>{gameMode === 'dual-device' ? 'Due Dispositivi' : 'Dispositivo Singolo'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{entityInfo.emoji}</span>
              <span>Modalità {entityInfo.title}</span>
            </div>
          </div>
        </div>

        {/* Info utente corrente */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{entityInfo.emoji}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Benvenut{entityType === 'family' ? 'a' : 'i'} {getDisplayName(currentUser)}!
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Membri: {currentUser.memberNames?.join(', ')}</span>
                  {currentUser.stats && (
                    <span>Carte giocate: {currentUser.stats.cardsPlayed}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onChangeMode()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                Cambia Modalità
              </button>
            </div>
          </div>
        </div>

        {/* Partner Status per Dual-Device */}
        {gameMode === 'dual-device' && partnerStatus && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl shadow-lg mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
              📱📱 Stato Partner
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border-2 ${
                partnerStatus.partner1.isOnline 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    partnerStatus.partner1.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">
                    {partnerStatus.partner1.name}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {partnerStatus.partner1.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border-2 ${
                partnerStatus.partner2.isOnline 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    partnerStatus.partner2.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">
                    {partnerStatus.partner2.name}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {partnerStatus.partner2.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
            
            {partnerStatus.bothOnline && (
              <div className="mt-4 p-3 bg-green-100 rounded-xl text-center">
                <div className="text-green-700 font-medium">
                  🎉 Entrambi i partner sono online! Pronti per giocare insieme!
                </div>
              </div>
            )}
            
            {!partnerStatus.bothOnline && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-bold text-blue-900 mb-2">📋 Codice Coppia</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Condividi questo codice con il tuo partner per permettergli di accedere:
                </p>
                <div className="bg-white p-3 rounded-lg border-2 border-blue-200 text-center">
                  <div className="text-2xl font-mono font-bold text-blue-900">
                    {currentUser.id}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(currentUser.id)}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors"
                  >
                    📋 Copia Codice
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Il partner può usare questo codice per accedere dal suo dispositivo
                </p>
              </div>
            )}
          </div>
        )}

        {/* Opzioni di gioco */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Gioco privato */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Sessione Privata
              </h3>
              <p className="text-gray-600 mb-4">
                {entityType === 'couple' 
                  ? 'Giocate da soli come coppia' 
                  : 'Giocate da soli come famiglia'
                }
              </p>
              <button
                onClick={onStartSoloGame}
                className={`w-full px-6 py-3 bg-gradient-to-r ${entityInfo.color} text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
                disabled={gameMode === 'dual-device' && !partnerStatus?.bothOnline}
              >
                {gameMode === 'dual-device' && !partnerStatus?.bothOnline
                  ? 'Aspetta il partner...'
                  : 'Inizia Sessione Privata'
                }
              </button>
            </div>
          </div>

          {/* Crea sessione multi */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Crea Gruppo
              </h3>
              <p className="text-gray-600 mb-4">
                Invita altre {entityInfo.title.toLowerCase()} per giocare insieme
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={relevantUsers.length === 0}
              >
                {relevantUsers.length === 0 
                  ? `Nessun${entityType === 'family' ? 'a famiglia' : 'a coppia'} online` 
                  : `Invita ${entityInfo.title}`
                }
              </button>
            </div>
          </div>

          {/* Unisciti con codice */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Unisciti
              </h3>
              <p className="text-gray-600 mb-4">
                Hai ricevuto un codice sessione?
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Inserisci codice..."
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleJoinWithCode}
                  className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  disabled={!sessionCode.trim()}
                >
                  Unisciti
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista entità online */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            🌟 {entityInfo.title} Online ({relevantUsers.length})
          </h3>
          
          {relevantUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">😴</div>
              <p className="text-gray-600">
                Nessun{entityType === 'family' ? "a famiglia" : "a coppia"} è online al momento.<br />
                Torna più tardi o invita i tuoi amici!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relevantUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`bg-gradient-to-r ${entityInfo.bgColor} p-4 rounded-xl border border-opacity-50`}
                  style={{ borderColor: entityInfo.color.split(' ')[1] }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-gray-800">
                          {getDisplayName(user)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatLastSeen(user.lastSeen)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Membri: {user.memberNames?.length || 0} | 
                        Carte: {user.stats?.cardsPlayed || 0}
                      </p>
                      {user.gameMode === 'dual-device' && (
                        <div className="text-xs text-blue-600 mt-1">
                          📱📱 Dual-Device
                        </div>
                      )}
                    </div>
                    <div className="text-2xl">
                      {entityInfo.emoji}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistiche globali */}
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl text-center">
            <div className={`text-2xl font-bold bg-gradient-to-r ${entityInfo.color} bg-clip-text text-transparent`}>
              {allUsers.filter(u => u.entityType === entityType).length}
            </div>
            <div className="text-sm text-gray-600">{entityInfo.title} Registrate</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">{relevantUsers.length}</div>
            <div className="text-sm text-gray-600">{entityInfo.title} Online</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">
              {allUsers
                .filter(u => u.entityType === entityType)
                .reduce((total, user) => total + (user.stats?.cardsPlayed || 0), 0)
              }
            </div>
            <div className="text-sm text-gray-600">Carte Totali</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600">
              {allUsers
                .filter(u => u.entityType === entityType && u.gameMode === 'dual-device')
                .length
              }
            </div>
            <div className="text-sm text-gray-600">Dual-Device</div>
          </div>
        </div>
      </div>

      {/* Modal per invitare entità */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Invita {entityInfo.title} al Gioco
            </h3>
            
            <div className="space-y-3 mb-6">
              {relevantUsers.map(user => (
                <div 
                  key={user.id}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedEntities.includes(user.id)
                      ? `border-purple-500 bg-purple-50`
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => toggleEntitySelection(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">
                        {getDisplayName(user)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatLastSeen(user.lastSeen)} • {user.memberNames?.length || 0} membri
                      </div>
                      {user.gameMode === 'dual-device' && (
                        <div className="text-xs text-blue-600">📱📱 Dual-Device</div>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedEntities.includes(user.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedEntities.includes(user.id) && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedEntities([]);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors duration-200"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateSession}
                disabled={selectedEntities.length === 0}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${entityInfo.color} text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none`}
              >
                Crea Sessione ({selectedEntities.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
