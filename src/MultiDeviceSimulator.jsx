import React, { useState } from 'react';

export function MultiDeviceSimulator({ onClose, currentUser, onSwitchProfile }) {
  const [selectedProfile, setSelectedProfile] = useState(currentUser?.id || '');
  const [newProfileName, setNewProfileName] = useState('');

  // Leggi i profili dal localStorage
  const getStoredProfiles = () => {
    try {
      const profiles = JSON.parse(localStorage.getItem('deviceProfiles') || '[]');
      return profiles;
    } catch {
      return [];
    }
  };

  const [profiles, setProfiles] = useState(getStoredProfiles());

  const createNewProfile = () => {
    if (!newProfileName.trim()) {
      alert('Inserisci un nome per il profilo');
      return;
    }

    const newProfile = {
      id: `profile_${Date.now()}`,
      name: newProfileName.trim(),
      createdAt: new Date().toISOString(),
      userData: null // Verrà popolato quando l'utente fa login
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('deviceProfiles', JSON.stringify(updatedProfiles));
    setNewProfileName('');
  };

  const deleteProfile = (profileId) => {
    if (profiles.length <= 1) {
      alert('Non puoi eliminare l\'ultimo profilo');
      return;
    }

    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    localStorage.setItem('deviceProfiles', JSON.stringify(updatedProfiles));

    // Se stiamo eliminando il profilo corrente, passa al primo disponibile
    if (selectedProfile === profileId && updatedProfiles.length > 0) {
      setSelectedProfile(updatedProfiles[0].id);
    }
  };

  const switchToProfile = () => {
    if (!selectedProfile) return;

    const profile = profiles.find(p => p.id === selectedProfile);
    if (profile) {
      // Salva il prefisso del profilo nel sessionStorage
      sessionStorage.setItem('currentProfileId', profile.id);
      
      if (onSwitchProfile) {
        onSwitchProfile(profile);
      }
      
      // Ricarica la pagina per applicare il nuovo profilo
      window.location.reload();
    }
  };

  const openInNewWindow = () => {
    if (!selectedProfile) return;

    const profile = profiles.find(p => p.id === selectedProfile);
    if (profile) {
      // Apri una nuova finestra con un parametro URL per il profilo
      const url = new URL(window.location.href);
      url.searchParams.set('profile', profile.id);
      
      const newWindow = window.open(
        url.toString(), 
        `profile_${profile.id}`,
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (newWindow) {
        // Focus sulla nuova finestra
        newWindow.focus();
      } else {
        alert('Il browser ha bloccato il popup. Prova ad aprire manualmente una nuova finestra.');
      }
    }
  };

  const openInIncognito = () => {
    alert(`Per simulare un dispositivo diverso in modalità incognito:

1. Apri una finestra in incognito (Ctrl+Shift+N)
2. Vai su: ${window.location.origin}
3. Registra un nuovo utente
4. Unisciti utilizzando il codice di un altro utente

Nota: La finestra incognito avrà un localStorage separato, simulando così un dispositivo completamente diverso.`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📱 Simulatore Multi-Device</h2>
              <p className="text-blue-100 mt-1">
                Simula più dispositivi su un singolo browser
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-3xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informazioni */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Come funziona</h3>
            <p className="text-blue-700 text-sm">
              Questo simulatore ti permette di testare l'app come se avessi più dispositivi. 
              Ogni "profilo" rappresenta un dispositivo diverso con i suoi dati separati.
            </p>
          </div>

          {/* Profilo corrente */}
          {currentUser && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-800 mb-2">👤 Profilo Corrente</h3>
              <div className="text-green-700 text-sm space-y-1">
                <div><span className="font-medium">Nome:</span> {currentUser.name}</div>
                <div><span className="font-medium">Codice:</span> {currentUser.personalCode}</div>
                <div><span className="font-medium">Profilo:</span> {sessionStorage.getItem('currentProfileId') || 'default'}</div>
              </div>
            </div>
          )}

          {/* Gestione profili */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">👥 Gestione Profili</h3>
            
            {/* Lista profili esistenti */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Profili esistenti:
              </label>
              
              {profiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📱</div>
                  <p>Nessun profilo trovato</p>
                  <p className="text-sm">Creane uno per iniziare</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="profile"
                          value={profile.id}
                          checked={selectedProfile === profile.id}
                          onChange={(e) => setSelectedProfile(e.target.value)}
                          className="text-purple-500"
                        />
                        <div>
                          <div className="font-medium text-gray-800">{profile.name}</div>
                          <div className="text-xs text-gray-500">
                            Creato: {new Date(profile.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                        disabled={profiles.length <= 1}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Crea nuovo profilo */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Nome del nuovo profilo..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createNewProfile()}
              />
              <button
                onClick={createNewProfile}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
              >
                Crea
              </button>
            </div>
          </div>

          {/* Azioni */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">🚀 Azioni</h3>
            
            <button
              onClick={switchToProfile}
              disabled={!selectedProfile || selectedProfile === sessionStorage.getItem('currentProfileId')}
              className="w-full p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="font-medium">🔄 Cambia a Questo Profilo</div>
              <div className="text-sm opacity-80">Ricarica l'app con il profilo selezionato</div>
            </button>

            <button
              onClick={openInNewWindow}
              disabled={!selectedProfile}
              className="w-full p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="font-medium">🪟 Apri in Nuova Finestra</div>
              <div className="text-sm opacity-80">Apre una nuova finestra con il profilo selezionato</div>
            </button>

            <button
              onClick={openInIncognito}
              className="w-full p-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-left"
            >
              <div className="font-medium">🥷 Modalità Incognito</div>
              <div className="text-sm opacity-80">Istruzioni per usare una finestra incognito</div>
            </button>
          </div>

          {/* Suggerimenti */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Suggerimenti</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Usa profili diversi per simulare utenti su dispositivi separati</li>
              <li>• Apri nuove finestre per testare sincronizzazione in tempo reale</li>
              <li>• La modalità incognito simula un dispositivo completamente nuovo</li>
              <li>• Ogni profilo mantiene i suoi dati separati (utenti, coppie, ecc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
