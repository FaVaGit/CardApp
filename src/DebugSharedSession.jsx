import React from 'react';

/**
 * Componente di debug per testare le sessioni condivise
 */
export function DebugSharedSession({ onCreateSharedSession, currentUser }) {
  const testCard = {
    id: 'debug_1',
    title: 'Carta di Debug',
    emoji: '🐛',
    prompts: ['Questa è una carta di test per il debug delle sessioni condivise'],
    category: 'debug',
    color: 'from-red-400 to-orange-300'
  };

  const handleTest = async () => {
    console.log('🐛 Debug: Testing shared session creation');
    console.log('Current user:', currentUser);
    console.log('onCreateSharedSession function:', onCreateSharedSession);
    
    if (!currentUser) {
      alert('❌ Nessun utente loggato');
      return;
    }
    
    if (!onCreateSharedSession) {
      alert('❌ Funzione onCreateSharedSession non disponibile');
      return;
    }
    
    try {
      const result = await onCreateSharedSession(testCard);
      console.log('✅ Debug: Session created successfully:', result);
      alert(`✅ Sessione creata! Codice: ${result?.sessionCode || 'N/A'}`);
    } catch (error) {
      console.error('❌ Debug: Error creating session:', error);
      alert(`❌ Errore: ${error.message}`);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-red-100 border border-red-400 rounded-lg p-3 shadow-lg">
        <h3 className="font-bold text-red-800 mb-2 text-sm">🐛 Debug Sessioni</h3>
        <button
          onClick={handleTest}
          className="w-full px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
        >
          🧪 Test Creazione Sessione
        </button>
        <div className="mt-2 text-xs text-red-700">
          <div>User: {currentUser?.name || 'N/A'}</div>
          <div>Function: {onCreateSharedSession ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
}
