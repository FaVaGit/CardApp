import React, { useState, useEffect } from 'react';
import IncognitoModeWarning from './IncognitoModeWarning';
import IncognitoTestButton from './IncognitoTestButton';

export function UserListCoupleManager({ 
  currentUser, 
  currentCouple, 
  partnerStatus,
  onlineUsers,
  allUsers,
  debugInfo, // Aggiungi debugInfo alle props
  backendMode, // Modalità backend
  connectionStatus, // Stato connessione
  onJoinUserByCode,
  onLeaveCouple,
  onStartGame,
  onLogout,
  onForceRefresh, // Nuova prop per forzare refresh
  onOpenSettings,
  onOpenUserList,
  onOpenMultiDeviceSimulator
}) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filtra utenti disponibili per pairing (esclude l'utente corrente)
  const availableUsers = allUsers.filter(user => 
    user.id !== currentUser.id && 
    user.gameType === currentUser.gameType &&
    user.availableForPairing &&
    user.isOnline
  );

  const handleJoinUser = (userCode) => {
    setError('');
    
    if (!userCode || userCode.length !== 6) {
      setError('Inserisci un codice valido di 6 caratteri');
      return;
    }
    
    const result = onJoinUserByCode(userCode);
    if (!result) {
      setError('Codice non valido, utente non trovato o già in coppia');
    }
  };

  const handleQuickJoin = (user) => {
    setSelectedUser(user);
    handleJoinUser(user.personalCode);
  };

  const handleCopyMyCode = async () => {
    if (currentUser?.personalCode) {
      try {
        await navigator.clipboard.writeText(currentUser.personalCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
        console.log('✅ Codice personale copiato:', currentUser.personalCode);
      } catch (err) {
        console.error('❌ Errore copia codice:', err);
        alert(`Il tuo codice: ${currentUser.personalCode}\n\nCopia manualmente questo codice.`);
      }
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
                  Coppia formata con successo!
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onLeaveCouple}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors duration-200"
                >
                  Lascia Coppia
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
                >
                  Esci
                </button>
              </div>
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
                <div className="text-xs text-green-700 mt-1">
                  Codice: {currentUser.personalCode}
                </div>
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
                  {partnerStatus?.partner?.lastSeen && (
                    <div className="text-xs text-gray-500 mt-1">
                      Ultimo accesso: {new Date(partnerStatus.partner.lastSeen).toLocaleTimeString()}
                    </div>
                  )}
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

            {/* Pulsante di backup per avviare il gioco anche se lo stato online non è sincronizzato */}
            {!partnerStatus?.bothOnline && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl text-center">
                <div className="text-blue-700 font-medium mb-2">
                  💕 Coppia formata con successo!
                </div>
                <div className="text-sm text-blue-600 mb-3">
                  {partner ? 
                    `Partner: ${partner.name} ${partnerStatus?.partner?.isOnline ? '(Online)' : '(Sincronizzazione in corso...)'}` :
                    'In attesa di sincronizzazione...'
                  }
                </div>
                <div className="space-y-3">
                  <button
                    onClick={onStartGame}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    🎮 Inizia Partita
                  </button>
                  <p className="text-xs text-blue-600">
                    {partnerStatus?.partner?.isOnline ? 
                      'Pronti per iniziare!' :
                      'Puoi iniziare anche durante la sincronizzazione - il partner si unirà automaticamente'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-4 rounded-xl text-sm text-gray-600">
              <details>
                <summary className="cursor-pointer font-medium">🔧 Debug Info Dettagliato</summary>
                <div className="mt-2 space-y-1">
                  <div><strong>Partner status:</strong> {partnerStatus?.partner?.isOnline ? 'Online' : 'Offline'}</div>
                  <div><strong>Entrambi online:</strong> {partnerStatus?.bothOnline ? 'Sì' : 'No'}</div>
                  <div><strong>Coppia ID:</strong> {currentCouple?.id}</div>
                  <div><strong>Partner ID:</strong> {partnerStatus?.partner?.userId}</div>
                  <div><strong>Partner lastSeen:</strong> {partnerStatus?.partner?.lastSeen}</div>
                  <div><strong>Current time:</strong> {new Date().toISOString()}</div>
                  <div><strong>localStorage users:</strong> {JSON.parse(localStorage.getItem('complicita_all_users') || '[]').length}</div>
                  <div><strong>localStorage couples:</strong> {JSON.parse(localStorage.getItem('complicita_all_couples') || '[]').length}</div>
                  <div><strong>Available users:</strong> {availableUsers.length}</div>
                  {partnerStatus?.partner && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded">
                      <div><strong>Partner Details:</strong></div>
                      <div>Name: {partnerStatus.partner.name}</div>
                      <div>Online: {partnerStatus.partner.isOnline ? 'Yes' : 'No'}</div>
                      <div>Last Seen: {partnerStatus.partner.lastSeen}</div>
                      <div>Time diff: {partnerStatus.partner.lastSeen ? 
                        Math.round((Date.now() - new Date(partnerStatus.partner.lastSeen).getTime()) / 1000) + 's ago' : 
                        'N/A'}</div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form principale per unirsi agli utenti online
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Trova il tuo Partner
            </h1>
            <p className="text-gray-600">
              Ciao {currentUser.name}! Scegli un partner online o inserisci il suo codice.
            </p>
            
            {/* Indicatore stato backend */}
            {backendMode && (
              <div className="mt-3 flex justify-center">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  backendMode === 'simulatedBackend' 
                    ? connectionStatus === 'connected' 
                      ? 'bg-green-100 text-green-700'
                      : connectionStatus === 'syncing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {backendMode === 'simulatedBackend' ? (
                    <>
                      🔧 Backend Simulato - {
                        connectionStatus === 'connected' ? '✅ Connesso' :
                        connectionStatus === 'syncing' ? '🔄 Sincronizzazione...' :
                        connectionStatus === 'error' ? '❌ Errore' :
                        '⏳ Connessione...'
                      }
                    </>
                  ) : (
                    '💾 LocalStorage - Modalità Standard'
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avviso modalità incognito */}
        <IncognitoModeWarning debugInfo={debugInfo} />

        {/* Il mio codice personale */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-2xl shadow-lg mb-6 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">🔑 Il Tuo Codice Personale</h3>
            <p className="text-blue-100 mb-4">
              Condividi questo codice per permettere ad altri di unirsi a te!
            </p>
            <div className="bg-white bg-opacity-20 p-6 rounded-xl mb-4">
              <div className="text-5xl font-mono font-bold mb-3 tracking-[0.3em] text-shadow-lg">
                {currentUser.personalCode}
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCopyMyCode}
                  className="px-6 py-3 bg-white text-blue-600 font-medium rounded-full hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>{copiedCode ? '✅' : '📋'}</span>
                  <span>{copiedCode ? 'Copiato!' : 'Copia Codice'}</span>
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/?text=Ciao! Unisciti a me nel Gioco della Complicità con il mio codice: ${currentUser.personalCode}`, '_blank')}
                  className="px-6 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
            <p className="text-blue-100 text-sm">
              Altri utenti possono inserire questo codice per formare una coppia con te
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lista utenti online */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              🌐 Utenti Online Disponibili ({availableUsers.length})
            </h3>
            
            {availableUsers.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {availableUsers.map(user => (
                  <div key={user.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                        <div>
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.gameType === 'couple' ? 'Modalità Coppia' : 'Modalità Famiglia'}
                          </div>
                          <div className="text-xs text-blue-600 font-mono">
                            Codice: {user.personalCode}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleQuickJoin(user)}
                        disabled={selectedUser?.id === user.id}
                        className="px-4 py-2 bg-purple-500 text-white text-sm rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        {selectedUser?.id === user.id ? '⏳' : '🤝'} Unisciti
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">😴</div>
                <p>Nessun utente online disponibile al momento</p>
                <p className="text-sm mt-2">
                  Condividi il tuo codice per invitare qualcuno!
                </p>
              </div>
            )}
          </div>

          {/* Form inserimento codice manuale */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              🔍 Inserisci Codice Partner
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice del Partner *
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  maxLength={6}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-center text-xl font-mono ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ABC123"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Inserisci il codice personale del partner
                </p>
              </div>
              
              <button
                onClick={() => handleJoinUser(joinCode)}
                disabled={!joinCode || joinCode.length !== 6}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                🤝 Forma Coppia
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h4 className="font-medium text-blue-900 mb-2">💡 Come funziona:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ogni utente ha un codice personale</li>
                <li>• Inserisci il codice del partner per formare una coppia</li>
                <li>• Oppure clicca "Unisciti" su un utente online</li>
                <li>• Una volta formata la coppia, potete iniziare a giocare!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pulsante logout */}
        <div className="mt-6 text-center">
          <button
            onClick={onLogout}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors underline"
          >
            ← Torna al Login
          </button>
        </div>

        {/* Pulsanti utility */}
        {(onOpenSettings || onOpenUserList || onOpenMultiDeviceSimulator) && (
          <div className="mt-6 bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl shadow-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
              🛠️ Strumenti Avanzati
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm flex items-center space-x-2"
                >
                  <span>⚙️</span>
                  <span>Impostazioni</span>
                </button>
              )}
              
              {onOpenUserList && (
                <button
                  onClick={onOpenUserList}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm flex items-center space-x-2"
                >
                  <span>👥</span>
                  <span>Lista Utenti</span>
                </button>
              )}
              
              {onOpenMultiDeviceSimulator && (
                <button
                  onClick={onOpenMultiDeviceSimulator}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm flex items-center space-x-2"
                >
                  <span>📱</span>
                  <span>Simula Multi-Device</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Debug info più dettagliato */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-100 p-4 rounded-xl text-sm text-gray-600">
            <details>
              <summary className="cursor-pointer font-medium">🔧 Debug Info Dettagliato</summary>
              <div className="mt-2 space-y-1">
                <div>Tutti gli utenti: {allUsers?.length || 0}</div>
                <div>Utenti online: {onlineUsers?.length || 0}</div>
                <div>Utenti disponibili: {availableUsers.length}</div>
                <div>Il mio codice: {currentUser?.personalCode}</div>
                <div>Disponibile per pairing: {currentUser?.availableForPairing ? 'Sì' : 'No'}</div>
                
                {/* Informazioni browser/incognito */}
                {debugInfo && (
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <div className="font-medium mb-1 text-amber-800">🌐 Browser Info:</div>
                    <div>Modalità incognito: {debugInfo.isIncognito ? 'Sì' : 'No'}</div>
                    <div>Window ID: {debugInfo.windowId}</div>
                    <div>Prefisso profilo: {debugInfo.profilePrefix || 'Nessuno'}</div>
                    <div>Isolamento storage: {debugInfo.storageIsolation}</div>
                    <div>Può vedere altri incognito: {debugInfo.canSeeOtherIncognitoWindows ? 'Sì' : 'No'}</div>
                    <div>Utenti storage: {debugInfo.totalUsersInStorage || 0}</div>
                    {debugInfo.isIncognito && (
                      <div className="text-amber-700 text-xs mt-1 font-medium">
                        ⚠️ Finestre incognito sono isolate tra loro
                      </div>
                    )}
                  </div>
                )}
                
                {/* Informazioni backend */}
                {backendMode && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="font-medium mb-1 text-blue-800">🔧 Backend Info:</div>
                    <div>Modalità: {backendMode === 'simulatedBackend' ? 'Backend Simulato' : 'LocalStorage'}</div>
                    {connectionStatus && <div>Stato: {connectionStatus}</div>}
                    {backendMode === 'simulatedBackend' && (
                      <div className="text-blue-700 text-xs mt-1">
                        ✅ Multi-device reale simulato - Funziona tra finestre incognito
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-2 p-2 bg-white rounded text-xs">
                  <div className="font-medium mb-1">Lista utenti completa:</div>
                  {allUsers?.map((user, i) => (
                    <div key={user.id} className="mb-1">
                      {i + 1}. {user.name} - Codice: {user.personalCode} - Online: {user.isOnline ? 'Sì' : 'No'} - Disponibile: {user.availableForPairing ? 'Sì' : 'No'} - Window: {user.windowId || 'N/A'}
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-white rounded text-xs">
                  <div className="font-medium mb-1">Storage check:</div>
                  <div>Users in localStorage: {(() => {
                    try {
                      const storageKey = debugInfo?.profilePrefix ? `${debugInfo.profilePrefix}complicita_all_users` : 'complicita_all_users';
                      return JSON.parse(localStorage.getItem(storageKey) || '[]').length;
                    } catch {
                      return 0;
                    }
                  })()}</div>
                  <button 
                    onClick={() => onForceRefresh && onForceRefresh()}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded mr-2"
                  >
                    🔄 Force Refresh
                  </button>
                  <IncognitoTestButton 
                    debugInfo={debugInfo} 
                    backendMode={backendMode}
                    connectionStatus={connectionStatus}
                  />
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
