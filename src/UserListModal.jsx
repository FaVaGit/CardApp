import React, { useState, useMemo } from 'react';

export function UserListModal({ 
  isOpen, 
  onClose, 
  allUsers, 
  onlineUsers, 
  currentUser,
  onJoinUser,
  onDeleteUser,
  onViewUserDetails 
}) {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'online', 'offline', 'coupled', 'single'

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];

    return allUsers.filter(user => {
      // Filtro per nome
      const matchesName = user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         user.personalCode.toLowerCase().includes(searchFilter.toLowerCase());

      // Filtro per stato
      let matchesStatus = true;
      const isOnline = onlineUsers.some(ou => ou.id === user.id);
      const hasCoupleCode = user.coupleCode && user.coupleCode !== user.personalCode;

      switch (statusFilter) {
        case 'online':
          matchesStatus = isOnline;
          break;
        case 'offline':
          matchesStatus = !isOnline;
          break;
        case 'coupled':
          matchesStatus = hasCoupleCode;
          break;
        case 'single':
          matchesStatus = !hasCoupleCode;
          break;
        case 'all':
        default:
          matchesStatus = true;
      }

      return matchesName && matchesStatus;
    });
  }, [allUsers, onlineUsers, searchFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!allUsers) return { total: 0, online: 0, coupled: 0, single: 0 };

    const total = allUsers.length;
    const online = allUsers.filter(user => 
      onlineUsers.some(ou => ou.id === user.id)
    ).length;
    const coupled = allUsers.filter(user => 
      user.coupleCode && user.coupleCode !== user.personalCode
    ).length;
    const single = total - coupled;

    return { total, online, coupled, single };
  }, [allUsers, onlineUsers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">👥 Lista Utenti</h2>
              <p className="text-purple-100 mt-1">
                {filteredUsers.length} di {stats.total} utenti
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-3xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {/* Statistiche rapide */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div className="bg-white p-3 rounded-lg">
              <div className="text-purple-600 font-medium">Totali</div>
              <div className="text-xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-green-600 font-medium">Online</div>
              <div className="text-xl font-bold text-gray-800">{stats.online}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-pink-600 font-medium">In Coppia</div>
              <div className="text-xl font-bold text-gray-800">{stats.coupled}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-blue-600 font-medium">Singoli</div>
              <div className="text-xl font-bold text-gray-800">{stats.single}</div>
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Ricerca per nome */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔍 Cerca per nome o codice
              </label>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Inserisci nome o codice..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filtro stato */}
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📊 Filtra per stato
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tutti</option>
                <option value="online">Solo Online</option>
                <option value="offline">Solo Offline</option>
                <option value="coupled">In Coppia</option>
                <option value="single">Singoli</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista utenti */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🤷‍♂️</div>
              <p>Nessun utente trovato con i filtri applicati</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const isOnline = onlineUsers.some(ou => ou.id === user.id);
                const isCurrentUser = currentUser && user.id === currentUser.id;
                const hasCoupleCode = user.coupleCode && user.coupleCode !== user.personalCode;
                const partner = hasCoupleCode ? 
                  allUsers.find(u => u.personalCode === user.coupleCode && u.id !== user.id) : 
                  null;

                return (
                  <div key={user.id} className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                    isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Avatar e stato */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>

                        {/* Info utente */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-800">{user.name}</h3>
                            {isCurrentUser && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Tu
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Codice: <span className="font-mono bg-gray-100 px-1 rounded">{user.personalCode}</span></div>
                            
                            {hasCoupleCode && partner && (
                              <div className="flex items-center space-x-1">
                                <span>💕 Partner: {partner.name}</span>
                                <span className={`w-2 h-2 rounded-full ${
                                  onlineUsers.some(ou => ou.id === partner.id) ? 'bg-green-500' : 'bg-gray-400'
                                }`}></span>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500">
                              Creato: {new Date(user.createdAt).toLocaleDateString()}
                              {user.lastSeen && (
                                <span className="ml-2">
                                  • Ultimo accesso: {new Date(user.lastSeen).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Azioni */}
                      <div className="flex items-center space-x-2">
                        {!isCurrentUser && !hasCoupleCode && isOnline && (
                          <button
                            onClick={() => onJoinUser && onJoinUser(user)}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200 text-sm"
                          >
                            Unisciti
                          </button>
                        )}
                        
                        <button
                          onClick={() => onViewUserDetails && onViewUserDetails(user)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200 text-sm"
                        >
                          Dettagli
                        </button>
                        
                        {!isCurrentUser && onDeleteUser && (
                          <button
                            onClick={() => onDeleteUser(user)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200 text-sm"
                          >
                            Elimina
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Aggiornato: {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
