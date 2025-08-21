import React, { useState } from 'react';

export function SettingsPanel({ 
  onClose, 
  onClearUsers, 
  onClearCouples, 
  onClearAll, 
  onExportData, 
  onImportData,
  currentUser,
  stats 
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [importData, setImportData] = useState('');

  const handleConfirmAction = (action) => {
    switch (action) {
      case 'clearUsers':
        onClearUsers();
        break;
      case 'clearCouples':
        onClearCouples();
        break;
      case 'clearAll':
        onClearAll();
        break;
    }
    setShowConfirmDialog(null);
  };

  const handleExport = () => {
    const exportedData = onExportData();
    const blob = new Blob([JSON.stringify(exportedData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gioco-complicita-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      onImportData(data);
      setImportData('');
      alert('Dati importati con successo!');
    } catch (error) {
      alert('Errore nell\'importazione: formato dati non valido');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">⚙️ Impostazioni</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Statistiche */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Statistiche</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-purple-600 font-medium">Utenti totali</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-pink-600 font-medium">Coppie attive</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalCouples}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-green-600 font-medium">Utenti online</div>
                <div className="text-2xl font-bold text-gray-800">{stats.onlineUsers}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-blue-600 font-medium">Sessioni attive</div>
                <div className="text-2xl font-bold text-gray-800">{stats.activeSessions}</div>
              </div>
            </div>
          </div>

          {/* Informazioni utente corrente */}
          {currentUser && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">👤 Utente Corrente</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Nome:</span> {currentUser.name}</div>
                <div><span className="font-medium">Codice:</span> {currentUser.personalCode}</div>
                <div><span className="font-medium">Stato:</span> 
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                    currentUser.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {currentUser.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div><span className="font-medium">Creato:</span> {new Date(currentUser.createdAt).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Azioni di pulizia */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">🧹 Pulizia Dati</h3>
            
            <button
              onClick={() => setShowConfirmDialog('clearUsers')}
              className="w-full p-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-left"
            >
              <div className="font-medium">🗑️ Cancella Solo Utenti</div>
              <div className="text-sm opacity-80">Rimuove tutti gli utenti mantenendo le coppie</div>
            </button>

            <button
              onClick={() => setShowConfirmDialog('clearCouples')}
              className="w-full p-3 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors duration-200 text-left"
            >
              <div className="font-medium">💔 Cancella Solo Coppie</div>
              <div className="text-sm opacity-80">Rimuove tutte le coppie mantenendo gli utenti</div>
            </button>

            <button
              onClick={() => setShowConfirmDialog('clearAll')}
              className="w-full p-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors duration-200 text-left"
            >
              <div className="font-medium">🔥 Reset Completo</div>
              <div className="text-sm opacity-80">Cancella tutti i dati: utenti, coppie, sessioni</div>
            </button>
          </div>

          {/* Backup e ripristino */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">💾 Backup & Ripristino</h3>
            
            <button
              onClick={handleExport}
              className="w-full p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors duration-200 text-left"
            >
              <div className="font-medium">📥 Esporta Dati</div>
              <div className="text-sm opacity-80">Scarica un backup di tutti i dati</div>
            </button>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                📤 Importa Dati
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Incolla qui i dati JSON del backup..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 text-sm"
              />
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="w-full p-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importa
              </button>
            </div>
          </div>

          {/* Info debug */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
            <h4 className="font-medium mb-2">🔧 Info Debug</h4>
            <div className="space-y-1">
              <div>localStorage utilizzato: ~{Math.round(JSON.stringify(localStorage).length / 1024)} KB</div>
              <div>Tab ID: {sessionStorage.getItem('tabId') || 'Non impostato'}</div>
              <div>Ultima sincronizzazione: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog di conferma */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Conferma Azione</h3>
            
            {showConfirmDialog === 'clearUsers' && (
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler cancellare tutti gli utenti? Questa azione non può essere annullata.
              </p>
            )}
            
            {showConfirmDialog === 'clearCouples' && (
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler cancellare tutte le coppie? Gli utenti rimarranno ma perderanno i loro partner.
              </p>
            )}
            
            {showConfirmDialog === 'clearAll' && (
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler fare un reset completo? Tutti i dati verranno cancellati definitivamente.
              </p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Annulla
              </button>
              <button
                onClick={() => handleConfirmAction(showConfirmDialog)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
