import React, { useState, useEffect } from 'react';

export function ImprovedCoupleManager({ 
  currentUser, 
  currentCouple, 
  partnerStatus,
  onlineUsers,
  allUsers,
  onCreateCouple, 
  onJoinCouple, 
  onStartGame,
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState(currentCouple ? 'couple' : 'create');
  const [formData, setFormData] = useState({
    coupleName: '',
    joinCode: ''
  });
  const [errors, setErrors] = useState({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'joinCode' ? value.toUpperCase() : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCreateCouple = (e) => {
    e.preventDefault();
    
    if (!formData.coupleName.trim()) {
      setErrors({ coupleName: 'Il nome della coppia è obbligatorio' });
      return;
    }
    
    onCreateCouple(formData.coupleName.trim());
  };

  const handleJoinCouple = (e) => {
    e.preventDefault();
    
    if (!formData.joinCode.trim() || formData.joinCode.length !== 6) {
      setErrors({ joinCode: 'Inserisci un codice valido di 6 caratteri' });
      return;
    }
    
    const result = onJoinCouple(formData.joinCode.trim());
    if (!result) {
      setErrors({ joinCode: 'Codice non valido o coppia non trovata' });
    }
  };

  const handleCopyCode = async () => {
    if (currentCouple?.joinCode) {
      try {
        await navigator.clipboard.writeText(currentCouple.joinCode);
        setCopiedCode(true);
        // Show feedback for longer
        setTimeout(() => setCopiedCode(false), 3000);
        
        // Optional: Show a toast notification
        console.log('✅ Codice coppia copiato:', currentCouple.joinCode);
      } catch (err) {
        console.error('❌ Errore copia codice:', err);
        // Fallback: show alert
        alert(`Codice coppia: ${currentCouple.joinCode}\n\nCopia manualmente questo codice.`);
      }
    }
  };

  const handleInviteUser = (userToInvite) => {
    // Per ora, mostra solo il codice da condividere
    // In futuro si potrebbe implementare un sistema di notifiche
    setShowInviteModal(userToInvite);
  };

  // Filtra utenti online escludendo l'utente corrente
  const availablePartners = onlineUsers.filter(user => 
    user.id !== currentUser.id && 
    user.gameType === currentUser.gameType
  );

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
                  {currentMember?.role === 'member' && ' Ti sei unito/a con successo!'}
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

          {/* Codice coppia in evidenza */}
          {currentCouple.members.length === 1 && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-2xl shadow-lg mb-6 text-white">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">🔗 Codice Coppia</h3>
                <p className="text-blue-100 mb-4">
                  Condividi questo codice con il tuo partner per iniziare insieme!
                </p>
                <div className="bg-white bg-opacity-20 p-6 rounded-xl mb-4">
                  <div className="text-5xl font-mono font-bold mb-3 tracking-[0.3em] text-shadow-lg">
                    {currentCouple.joinCode}
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleCopyCode}
                      className="px-6 py-3 bg-white text-blue-600 font-medium rounded-full hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>{copiedCode ? '✅' : '📋'}</span>
                      <span>{copiedCode ? 'Copiato!' : 'Copia Codice'}</span>
                    </button>
                    <button
                      onClick={() => window.open(`https://wa.me/?text=Ciao! Unisciti alla nostra coppia nel Gioco della Complicità con il codice: ${currentCouple.joinCode}`, '_blank')}
                      className="px-6 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>💬</span>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="font-medium">📱 Via SMS</div>
                    <div className="text-blue-100 text-xs mt-1">
                      "Codice coppia: {currentCouple.joinCode}"
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="font-medium">💬 Via Chat</div>
                    <div className="text-blue-100 text-xs mt-1">
                      Copia e incolla il codice
                    </div>
                  </div>
                </div>
                <p className="text-blue-100 text-sm">
                  Il partner può inserire questo codice per unirsi automaticamente
                </p>
              </div>
            </div>
          )}

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
              {partner ? (
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
                  {partnerStatus?.partner?.lastSeen && (
                    <div className="text-xs text-gray-500 mt-1">
                      Ultimo accesso: {new Date(partnerStatus.partner.lastSeen).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                  <div className="text-gray-500">
                    👤 In attesa del partner
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Condividi il codice qui sopra
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

            {/* Opzione per cambiare coppia */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setActiveTab('join')}
                className="text-blue-600 text-sm hover:text-blue-800 transition-colors underline"
              >
                🔄 Cambia/Unisciti a un'altra coppia
              </button>
            </div>
          </div>

          {/* Partner online disponibili */}
          {availablePartners.length > 0 && currentCouple.members.length === 1 && (
            <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                🌐 Partner Online Disponibili
              </h3>
              <div className="grid gap-3">
                {availablePartners.map(user => (
                  <div key={user.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-gray-500">
                        ({user.gameType === 'couple' ? 'Coppia' : 'Famiglia'})
                      </span>
                    </div>
                    <button
                      onClick={() => handleInviteUser(user)}
                      className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors"
                    >
                      💌 Invita
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-4 rounded-xl text-sm text-gray-600">
              <details>
                <summary className="cursor-pointer font-medium">🔧 Debug Info</summary>
                <div className="mt-2 space-y-1">
                  <div>Tutti gli utenti: {allUsers?.length || 0}</div>
                  <div>Utenti online: {onlineUsers?.length || 0}</div>
                  <div>Partner disponibili: {availablePartners.length}</div>
                  <div>Codice coppia: {currentCouple?.joinCode}</div>
                  <div>Partner status: {partnerStatus?.partner?.isOnline ? 'Online' : 'Offline'}</div>
                  <div>Entrambi online: {partnerStatus?.bothOnline ? 'Sì' : 'No'}</div>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Modal invito */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-center">
                💌 Invita {showInviteModal.name}
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                Condividi questo codice con {showInviteModal.name} per invitarlo/a alla tua coppia:
              </p>
              <div className="bg-blue-50 p-4 rounded-xl text-center mb-4">
                <div className="text-2xl font-mono font-bold text-blue-900 mb-2">
                  {currentCouple.joinCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors"
                >
                  {copiedCode ? '✅ Copiato!' : '📋 Copia'}
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Form per cambiare coppia se richiesto
  if (activeTab === 'join' && currentCouple) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔄</div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cambia Coppia
            </h1>
            <p className="text-gray-600">
              Ciao {currentUser.name}! Inserisci un nuovo codice per unirti a un'altra coppia.
            </p>
          </div>

          <form onSubmit={handleJoinCouple} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuovo Codice Coppia *
              </label>
              <input
                type="text"
                name="joinCode"
                value={formData.joinCode}
                onChange={handleInputChange}
                maxLength={6}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-center text-xl font-mono ${
                  errors.joinCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ABC123"
              />
              {errors.joinCode && (
                <p className="text-red-500 text-sm mt-1">{errors.joinCode}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🤝 Unisciti alla Nuova Coppia
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('couple')}
                className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all duration-200"
              >
                ← Torna alla Coppia Attuale
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Form principale per creare/unirsi a una coppia
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">💕</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestione Coppia
          </h1>
          <p className="text-gray-600">
            Ciao {currentUser.name}! Crea una nuova coppia o unisciti a una esistente.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'create'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ➕ Crea Coppia
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'join'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🤝 Unisciti
          </button>
        </div>

        {/* Partner online disponibili */}
        {availablePartners.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-bold text-blue-900 mb-2 text-center">
              🌐 Partner Online ({availablePartners.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availablePartners.slice(0, 3).map(user => (
                <div key={user.id} className="flex justify-between items-center text-sm">
                  <span className="text-blue-700">• {user.name}</span>
                  <span className="text-blue-500">Online</span>
                </div>
              ))}
              {availablePartners.length > 3 && (
                <div className="text-center text-blue-600 text-xs">
                  +{availablePartners.length - 3} altri online
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form create */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateCouple} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome della Coppia *
              </label>
              <input
                type="text"
                name="coupleName"
                value={formData.coupleName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  errors.coupleName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="es. Marco & Laura"
              />
              {errors.coupleName && (
                <p className="text-red-500 text-sm mt-1">{errors.coupleName}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ➕ Crea Coppia
            </button>
          </form>
        )}

        {/* Form join */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinCouple} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice Coppia *
              </label>
              <input
                type="text"
                name="joinCode"
                value={formData.joinCode}
                onChange={handleInputChange}
                maxLength={6}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-center text-xl font-mono ${
                  errors.joinCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ABC123"
              />
              {errors.joinCode && (
                <p className="text-red-500 text-sm mt-1">{errors.joinCode}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🤝 Unisciti alla Coppia
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onLogout}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors underline"
          >
            ← Torna al Login
          </button>
        </div>
      </div>
    </div>
  );
}
