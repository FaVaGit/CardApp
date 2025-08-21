import React, { useState, useEffect } from 'react';

export function PartnerSelector({ 
  currentUser, 
  currentCouple, 
  partnerStatus,
  onlineUsers,
  pendingInvites,
  sentInvites,
  onSendInvite,
  onAcceptInvite,
  onRejectInvite,
  onStartGame,
  onLogout 
}) {
  const [showInvites, setShowInvites] = useState(false);

  // Se l'utente è già in una coppia, mostra la dashboard della coppia
  if (currentCouple) {
    const currentMember = currentCouple.members.find(m => m.userId === currentUser.id);
    const partner = currentCouple.members.find(m => m.userId !== currentUser.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header coppia */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  💕 {currentCouple.name}
                </h1>
                <p className="text-gray-600">
                  Benvenuto/a, {currentUser.name}!
                </p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
              >
                Esci
              </button>
            </div>
          </div>

          {/* Stato membri */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              👥 Membri della Coppia
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Utente corrente */}
              <div className="p-4 rounded-xl border-2 border-green-400 bg-green-50">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="font-medium">
                    {currentUser.name} (Tu)
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">Online</div>
                {currentMember?.role === 'creator' && (
                  <div className="text-xs text-green-700 mt-1">👑 Creatore</div>
                )}
              </div>
              
              {/* Partner */}
              {partner && (
                <div className={`p-4 rounded-xl border-2 ${
                  partnerStatus?.partner?.isOnline 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      partnerStatus?.partner?.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className="font-medium">
                      {partner.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {partnerStatus?.partner?.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              )}
            </div>

            {/* Stato pronto per giocare */}
            {partnerStatus?.bothOnline && (
              <div className="mt-6 p-4 bg-green-100 rounded-xl text-center">
                <div className="text-green-700 font-medium mb-3">
                  🎉 Entrambi online! Pronti per giocare insieme!
                </div>
                <button
                  onClick={onStartGame}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  🎮 Inizia Partita
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Se non è in una coppia, mostra selezione partner
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🤝 Trova il tuo Partner
              </h1>
              <p className="text-gray-600">
                Ciao {currentUser.name}! Seleziona un partner per iniziare a giocare insieme.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {pendingInvites.length > 0 && (
                <button
                  onClick={() => setShowInvites(!showInvites)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>💌</span>
                  <span>Inviti ({pendingInvites.length})</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
              >
                Esci
              </button>
            </div>
          </div>
        </div>

        {/* Inviti ricevuti */}
        {showInvites && pendingInvites.length > 0 && (
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              💌 Inviti Ricevuti
            </h3>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">👤</div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {invite.fromUserName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Ti ha invitato a giocare insieme
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAcceptInvite(invite)}
                      className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200"
                    >
                      ✅ Accetta
                    </button>
                    <button
                      onClick={() => onRejectInvite(invite)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors duration-200"
                    >
                      ❌ Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Utenti online disponibili */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🟢 Utenti Online ({onlineUsers.filter(u => u.id !== currentUser.id).length})
          </h3>
          
          {onlineUsers.filter(u => u.id !== currentUser.id && u.gameType === currentUser.gameType).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">😴</div>
              <p className="text-gray-600">
                Nessun altro utente online al momento.<br/>
                Condividi l'app con il tuo partner!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineUsers
                .filter(u => u.id !== currentUser.id && u.gameType === currentUser.gameType)
                .map((user) => {
                  const alreadyInvited = sentInvites.some(invite => 
                    invite.toUserId === user.id && invite.status === 'pending'
                  );
                  
                  return (
                    <div key={user.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-2xl">👤</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {user.name}
                          </p>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <p className="text-sm text-gray-600">
                              Online ora
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onSendInvite(user)}
                        disabled={alreadyInvited}
                        className={`w-full py-2 rounded-full font-medium transition-all duration-200 ${
                          alreadyInvited
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                        }`}
                      >
                        {alreadyInvited ? '✉️ Invito Inviato' : '🤝 Invita a Giocare'}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Info utili */}
        <div className="mt-6 bg-blue-50 p-4 rounded-xl">
          <h4 className="font-bold text-blue-900 mb-2">💡 Come funziona:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Seleziona un utente online per inviare un invito</li>
            <li>• Il partner riceverà l'invito e potrà accettare o rifiutare</li>
            <li>• Una volta accettato, verrete automaticamente associati in coppia</li>
            <li>• Potrete iniziare a giocare quando entrambi siete online</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
