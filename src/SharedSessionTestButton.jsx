import React from 'react';
import { useSharedSession } from './useSharedSession';

/**
 * Componente per testare le sessioni condivise durante lo sviluppo
 */
export function SharedSessionTestButton({ currentUser }) {
  const {
    sharedSession,
    createSharedSession,
    joinSharedSession,
    isSessionActive
  } = useSharedSession();

  const testCard = {
    id: 'test-001',
    title: 'Carta di Test',
    emoji: '🧪',
    content: [
      'Questa è una carta di test per le sessioni condivise.',
      'Come vi sentite a testare questa nuova funzionalità?',
      'Che cosa vi piace di più dell\'esperienza collaborativa?'
    ],
    category: 'test',
    color: 'from-blue-400 to-purple-300'
  };

  const handleTestCreate = async () => {
    try {
      await createSharedSession(testCard, currentUser);
      console.log('✅ Test session created');
    } catch (error) {
      console.error('❌ Test session creation failed:', error);
    }
  };

  const handleTestJoin = async () => {
    const testCode = prompt('Inserisci il codice di test (es. TEST01):');
    if (testCode) {
      try {
        await joinSharedSession(testCode, currentUser);
        console.log('✅ Test session joined');
      } catch (error) {
        console.error('❌ Test session join failed:', error);
      }
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 shadow-lg">
        <div className="text-xs font-bold text-yellow-800 mb-2">🧪 TEST MODE</div>
        <div className="space-y-2">
          <button
            onClick={handleTestCreate}
            className="w-full px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
          >
            Crea Sessione Test
          </button>
          <button
            onClick={handleTestJoin}
            className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            Unisciti Test
          </button>
          {isSessionActive && (
            <div className="text-xs text-green-700 font-bold">
              ✅ Sessione Attiva
            </div>
          )}
          {sharedSession && (
            <div className="text-xs text-blue-700">
              ID: {sharedSession.id?.substring(0, 8)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
