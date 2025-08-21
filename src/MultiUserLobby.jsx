import React, { useState } from 'react';

export function MultiUserLobby({ 
  currentUser, 
  onlineUsers, 
  allUsers, 
  onCreateSession, 
  onJoinSession, 
  onStartSoloGame 
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sessionCode, setSessionCode] = useState('');

  const otherUsers = onlineUsers.filter(user => user.id !== currentUser.id);

  const handleCreateSession = () => {
    if (selectedUsers.length > 0) {
      onCreateSession(selectedUsers);
      setShowInviteModal(false);
      setSelectedUsers([]);
    }
  };

  const handleJoinWithCode = () => {
    if (sessionCode.trim()) {
      onJoinSession(sessionCode.trim());
      setSessionCode('');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header di benvenuto */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Lobby Multi-Coppia
          </h1>
          <p className="text-lg text-gray-600">
            Ciao {currentUser.coupleNickname || `${currentUser.partnerName1} & ${currentUser.partnerName2}`}! 💕
          </p>
          <p className="text-sm text-gray-500">
            Coppie online: {otherUsers.length} | Totale coppie registrate: {allUsers.length}
          </p>
        </div>

        {/* Opzioni di gioco */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Gioco da soli */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">💕</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Gioca in Coppia</h3>
              <p className="text-gray-600 mb-4">
                Giocate da soli con le vostre carte private
              </p>
              <button
                onClick={onStartSoloGame}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Inizia Sessione Privata
              </button>
            </div>
          </div>

          {/* Crea sessione di gruppo */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Crea Gruppo</h3>
              <p className="text-gray-600 mb-4">
                Invita altre coppie per giocare insieme
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={otherUsers.length === 0}
              >
                {otherUsers.length === 0 ? 'Nessuna coppia online' : 'Invita Coppie'}
              </button>
            </div>
          </div>

          {/* Unisciti con codice */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Unisciti</h3>
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

        {/* Lista coppie online */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            🌟 Coppie Online ({otherUsers.length})
          </h3>
          
          {otherUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">😴</div>
              <p className="text-gray-600">
                Nessun'altra coppia è online al momento.<br />
                Torna più tardi o invita i tuoi amici!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherUsers.map(user => (
                <div key={user.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-gray-800">
                          {user.coupleNickname || `${user.partnerName1} & ${user.partnerName2}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatLastSeen(user.lastSeen)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.stats.cardsPlayed} carte giocate
                      </p>
                    </div>
                    <div className="text-2xl">
                      💕
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistiche globali */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">{allUsers.length}</div>
            <div className="text-sm text-gray-600">Coppie Registrate</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">{otherUsers.length}</div>
            <div className="text-sm text-gray-600">Coppie Online</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-pink-600">
              {allUsers.reduce((total, user) => total + (user.stats?.cardsPlayed || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Carte Totali Giocate</div>
          </div>
        </div>
      </div>

      {/* Modal per invitare coppie */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Invita Coppie al Gioco
            </h3>
            
            <div className="space-y-3 mb-6">
              {otherUsers.map(user => (
                <div 
                  key={user.id}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedUsers.includes(user.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">
                        {user.coupleNickname || `${user.partnerName1} & ${user.partnerName2}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatLastSeen(user.lastSeen)}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedUsers.includes(user.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedUsers.includes(user.id) && (
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
                  setSelectedUsers([]);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors duration-200"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateSession}
                disabled={selectedUsers.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                Crea Sessione ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
