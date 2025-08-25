import React, { useState } from 'react';

export function PartnerManagementUnified({ 
  currentUser,
  onlineUsers,
  allCouples,
  availablePartners,
  onCreateCouple,
  onJoinCouple,
  onLeaveCouple,
  clearAllUsers,
  forceRefreshData,
  getDebugInfo,
  syncData
}) {
  const [activeTab, setActiveTab] = useState('create');
  const [partnerName, setPartnerName] = useState('');
  const [selectedCoupleId, setSelectedCoupleId] = useState('');
  const [gameType, setGameType] = useState('Single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const handleCreateCouple = async (e) => {
    e.preventDefault();
    if (!partnerName.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onCreateCouple(partnerName.trim(), gameType);
      setPartnerName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCouple = async (e) => {
    e.preventDefault();
    if (!selectedCoupleId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onJoinCouple(selectedCoupleId);
      setSelectedCoupleId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearUsers = async () => {
    try {
      await clearAllUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefresh = async () => {
    try {
      await forceRefreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSync = async () => {
    try {
      await syncData();
    } catch (err) {
      setError(err.message);
    }
  };

  const availableCouples = allCouples.filter(couple => 
    couple.users.length < 2 && 
    !couple.users.find(user => user.id === currentUser?.id)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Partner Management</h1>
              <p className="text-gray-600">
                Benvenuto, {currentUser?.name || currentUser?.nickname}
              </p>
              <p className="text-sm text-gray-500">
                Codice personale: <span className="font-mono">{currentUser?.personalCode}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearUsers}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                title="Clear All Users"
              >
                Clear Users
              </button>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                title="Force Refresh Data"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                title="Show Debug Info"
              >
                Debug
              </button>
              <button
                onClick={handleSync}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                title="Sync Data"
              >
                Sync
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Crea Coppia
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'join'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Unisciti a Coppia
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'status'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stato
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Create Couple Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Crea una nuova coppia
                  </h2>
                  <form onSubmit={handleCreateCouple} className="space-y-4">
                    <div>
                      <label htmlFor="partnerName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome del Partner
                      </label>
                      <input
                        type="text"
                        id="partnerName"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Inserisci il nome del tuo partner"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo di Gioco
                      </label>
                      <select
                        id="gameType"
                        value={gameType}
                        onChange={(e) => setGameType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      >
                        <option value="Single">Single</option>
                        <option value="Couple">Couple</option>
                        <option value="Group">Group</option>
                      </select>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !partnerName.trim()}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creazione...' : 'Crea Coppia'}
                    </button>
                  </form>
                </div>

                {/* Available Partners */}
                {availablePartners.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      Partner Disponibili ({availablePartners.length})
                    </h3>
                    <div className="space-y-2">
                      {availablePartners.map(partner => (
                        <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">{partner.name || partner.nickname}</p>
                            <p className="text-sm text-gray-500">Tipo: {partner.gameType}</p>
                          </div>
                          <button
                            onClick={() => setPartnerName(partner.name || partner.nickname)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            Seleziona
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Join Couple Tab */}
            {activeTab === 'join' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Unisciti a una coppia esistente
                  </h2>
                  
                  {availableCouples.length > 0 ? (
                    <form onSubmit={handleJoinCouple} className="space-y-4">
                      <div>
                        <label htmlFor="coupleSelect" className="block text-sm font-medium text-gray-700 mb-1">
                          Seleziona una coppia
                        </label>
                        <select
                          id="coupleSelect"
                          value={selectedCoupleId}
                          onChange={(e) => setSelectedCoupleId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        >
                          <option value="">Seleziona una coppia...</option>
                          {availableCouples.map(couple => (
                            <option key={couple.id} value={couple.id}>
                              {couple.name} - {couple.gameType} ({couple.users.length}/2)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isLoading || !selectedCoupleId}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Unione...' : 'Unisciti alla Coppia'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nessuna coppia disponibile al momento</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Prova a creare una nuova coppia o attendi che altri utenti ne creino una
                      </p>
                    </div>
                  )}
                </div>

                {/* All Couples */}
                {allCouples.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      Tutte le Coppie ({allCouples.length})
                    </h3>
                    <div className="space-y-2">
                      {allCouples.map(couple => (
                        <div key={couple.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{couple.name}</p>
                              <p className="text-sm text-gray-500">
                                Tipo: {couple.gameType} | 
                                Membri: {couple.users.length}/2 |
                                Stato: {couple.isActive ? 'Attiva' : 'Inattiva'}
                              </p>
                              {couple.users.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-400">Membri:</p>
                                  <ul className="text-sm">
                                    {couple.users.map(user => (
                                      <li key={user.id} className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        {user.name || user.nickname} ({user.role})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            {couple.users.length < 2 && !couple.users.find(user => user.id === currentUser?.id) && (
                              <button
                                onClick={() => setSelectedCoupleId(couple.id)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                              >
                                Seleziona
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Stato Attuale
                </h2>
                
                {/* User Info */}
                <div className="bg-blue-50 rounded-md p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Informazioni Utente</h3>
                  <div className="text-sm text-blue-700">
                    <p><strong>Nome:</strong> {currentUser?.name}</p>
                    <p><strong>Nickname:</strong> {currentUser?.nickname || 'Non impostato'}</p>
                    <p><strong>Codice Personale:</strong> {currentUser?.personalCode}</p>
                    <p><strong>Tipo di Gioco:</strong> {currentUser?.gameType}</p>
                    <p><strong>Stato:</strong> {currentUser?.isOnline ? 'Online' : 'Offline'}</p>
                    <p><strong>Disponibile per Accoppiamento:</strong> {currentUser?.availableForPairing ? 'Sì' : 'No'}</p>
                  </div>
                </div>

                {/* Online Users */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">
                    Utenti Online ({onlineUsers.length})
                  </h3>
                  {onlineUsers.length > 0 ? (
                    <div className="space-y-2">
                      {onlineUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            <div>
                              <p className="font-medium">{user.name || user.nickname}</p>
                              <p className="text-sm text-gray-500">
                                {user.gameType} | {user.availableForPairing ? 'Disponibile' : 'Non disponibile'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{user.personalCode}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nessun altro utente online</p>
                  )}
                </div>

                {/* Debug Info */}
                {showDebug && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="font-medium text-gray-700 mb-2">Debug Information</h3>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(getDebugInfo(), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
