import React, { useState } from 'react';

export function CoupleManager({ 
  currentUser, 
  currentCouple, 
  partnerStatus,
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase() // Join code sempre maiuscolo
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
                </div>
              ) : (
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                  <div className="text-gray-500">
                    👤 In attesa del partner
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Condividi il codice per far unire il tuo partner
                  </div>
                </div>
              )}
            </div>

            {/* Codice join se manca il partner */}
            {currentCouple.members.length === 1 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-bold text-blue-900 mb-2 text-center">
                  📋 Codice Coppia
                </h4>
                <p className="text-sm text-blue-700 mb-3 text-center">
                  Condividi questo codice con il tuo partner:
                </p>
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 text-center">
                  <div className="text-3xl font-mono font-bold text-blue-900 mb-2">
                    {currentCouple.joinCode}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(currentCouple.joinCode)}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors"
                  >
                    📋 Copia Codice
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2 text-center">
                  Il partner può usare questo codice per unirsi alla coppia
                </p>
              </div>
            )}

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
        </div>
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

  // Se non è in una coppia, mostra le opzioni per creare/unirsi
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">💕</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestione Coppia
          </h1>
          <p className="text-gray-600">
            Ciao {currentUser.name}! Crea una nuova coppia o unisciti a una esistente.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'create'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ➕ Crea Coppia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'join'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🤝 Unisciti
          </button>
        </div>

        {/* Contenuto tab */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreateCouple} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome della Coppia *
              </label>
              <input
                type="text"
                name="coupleName"
                value={formData.coupleName}
                onChange={(e) => setFormData(prev => ({ ...prev, coupleName: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  errors.coupleName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Es. Marco & Giulia"
              />
              {errors.coupleName && (
                <p className="text-red-500 text-sm mt-1">{errors.coupleName}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              💕 Crea Coppia
            </button>
          </form>
        ) : (
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
              <p className="text-xs text-gray-500 mt-1">
                Inserisci il codice di 6 caratteri fornito dal tuo partner
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🤝 Unisciti alla Coppia
            </button>
          </form>
        )}

        {/* Logout */}
        <div className="mt-6 text-center">
          <button
            onClick={onLogout}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            ← Cambia utente
          </button>
        </div>
      </div>
    </div>
  );
}
