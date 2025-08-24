import React, { useState } from 'react';

export function MultiUserLobby({ 
  currentUser, 
  partnerStatus,
  onCreatePartnership,
  onJoinUserByCode,
  onCreateSession
}) {
  const [partnerCode, setPartnerCode] = useState('');

  const handleJoinPartner = () => {
    if (partnerCode.trim()) {
      onJoinUserByCode(partnerCode.trim());
      setPartnerCode('');
    }
  };

  const handleCreatePartnershipAction = () => {
    const targetCode = prompt('Inserisci il codice del partner con cui vuoi creare una partnership:');
    if (targetCode && targetCode.trim()) {
      onCreatePartnership(targetCode.trim());
    }
  };

  // Debug del partner status
  console.log('🔍 MultiUserLobby - partnerStatus:', partnerStatus);
  console.log('🔍 MultiUserLobby - currentUser:', currentUser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header di benvenuto */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Lobby Multi-Coppia
          </h1>
          <p className="text-lg text-gray-600">
            Ciao {currentUser?.name || 'Utente'}! 💕
          </p>
          {currentUser?.personalCode && (
            <div className="mt-4 p-4 bg-white bg-opacity-70 rounded-lg inline-block">
              <p className="text-sm text-gray-600">Il tuo codice:</p>
              <p className="text-2xl font-bold text-purple-600">{currentUser.personalCode}</p>
              <p className="text-xs text-gray-500">Condividi questo codice con il tuo partner</p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-yellow-100 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User: {JSON.stringify(currentUser)}</p>
          <p>Partner Status: {JSON.stringify(partnerStatus)}</p>
        </div>

        {/* Stato Partnership */}
        <div className="mb-8">
          {partnerStatus?.hasPartner ? (
            <div className="bg-green-100 border border-green-300 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">👫</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Partnership Attiva</h3>
              <p className="text-green-700 mb-4">
                Sei in partnership con: <strong>{partnerStatus.partnerName}</strong>
              </p>
              <button
                onClick={onCreateSession}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🎮 Crea Sessione di Gioco
              </button>
            </div>
          ) : (
            <div className="bg-yellow-100 border border-yellow-300 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">Nessuna Partnership</h3>
              <p className="text-yellow-700 mb-4">
                Crea una partnership per giocare con un partner
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <button
                  onClick={handleCreatePartnershipAction}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  💕 Crea Partnership
                </button>
                
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Codice partner"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-full focus:outline-none focus:border-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinPartner()}
                  />
                  <button
                    onClick={handleJoinPartner}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-r-full hover:shadow-lg transition-all duration-200"
                  >
                    🤝 Unisciti
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informazioni aggiuntive */}
        <div className="text-center">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Come funziona</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. 💕 Crea una partnership con un altro utente usando il suo codice</p>
              <p>2. 🎮 Una volta in partnership, potete creare sessioni di gioco insieme</p>
              <p>3. 🎲 Condividete carte e giocate in tempo reale</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
