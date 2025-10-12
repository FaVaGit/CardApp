import React, { useState, useEffect } from 'react';
import { useBackend } from './useBackend';
import { GameSessionWithWhiteboard } from './components/GameSessionWithWhiteboard';
import { SharedWhiteboard } from './components/SharedWhiteboard';

export default function WhiteboardDemo() {
  const [mode, setMode] = useState('demo'); // 'demo' o 'full'
  const [currentUser, setCurrentUser] = useState(null);
  const [demoStrokes, setDemoStrokes] = useState([]);
  const [demoNotes, setDemoNotes] = useState([]);

  const {
    isConnected,
    isConnecting,
    error,
    drawingStrokes,
    drawingNotes,
    registerUser,
    addDrawingStroke,
    addDrawingNote,
    clearDrawing,
    logout
  } = useBackend();

  useEffect(() => {
    // Utente demo per test
    setCurrentUser({
      id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
      name: 'Utente Demo',
      personalCode: 'DEMO123'
    });
  }, []);

  const handleDemoAddStroke = (strokeData) => {
    console.log('Demo stroke added:', strokeData);
    setDemoStrokes(prev => [...prev, strokeData]);
  };

  const handleDemoAddNote = (noteData) => {
    console.log('Demo note added:', noteData);
    setDemoNotes(prev => [...prev, noteData]);
  };

  const handleDemoClear = () => {
    console.log('Demo canvas cleared');
    setDemoStrokes([]);
    setDemoNotes([]);
  };

  const handleConnectedAddStroke = async (strokeData) => {
    if (isConnected) {
      await addDrawingStroke('demo-session', strokeData);
    }
  };

  const handleConnectedAddNote = async (noteData) => {
    if (isConnected) {
      await addDrawingNote('demo-session', noteData);
    }
  };

  const handleConnectedClear = async () => {
    if (isConnected) {
      await clearDrawing('demo-session');
    }
  };

  if (mode === 'full' && currentUser) {
    const demoGameSession = {
      id: 'demo-session',
      participants: [currentUser]
    };

    return (
      <GameSessionWithWhiteboard
        gameSession={demoGameSession}
        currentUser={currentUser}
        onLeaveSession={() => setMode('demo')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Demo Lavagna Condivisa
              </h1>
              <p className="text-gray-600 mt-2">
                Testa la lavagna collaborativa con FabricJS e ModernUI
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Toggle modalità */}
              <button
                onClick={() => setMode(mode === 'demo' ? 'full' : 'demo')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                {mode === 'demo' ? '🎮 Modalità Gioco' : '🎨 Solo Lavagna'}
              </button>
            </div>
          </div>
        </div>

        {/* Status connessione */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                Backend: {isConnecting ? 'Connettendo...' : isConnected ? 'Connesso' : 'Disconnesso'}
              </span>
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                {error}
              </div>
            )}
            
            {isConnected && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Real-time attivo • {drawingStrokes.length} tratti • {drawingNotes.length} note
              </div>
            )}
          </div>
        </div>

        {/* Selezione modalità */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">🎨 Modalità Demo (Locale)</h3>
            <p className="text-gray-600 mb-4">
              Testa la lavagna senza connessione backend. I disegni sono solo locali.
            </p>
            <div className="text-sm text-gray-500">
              • Strumenti completi (pennello, penna, gomma, note)
              • Colori e dimensioni personalizzabili
              • Undo/Redo e zoom
              • Esportazione PNG
            </div>
          </div>
          
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">🎮 Modalità Real-time</h3>
            <p className="text-gray-600 mb-4">
              Lavagna sincronizzata in tempo reale con altri utenti tramite SignalR.
            </p>
            <div className="text-sm text-gray-500">
              • Sincronizzazione tramite Backend ASP.NET Core
              • Hub SignalR per aggiornamenti real-time
              • Persistenza in database
              • Multi-utente simultaneo
            </div>
          </div>
        </div>

        {/* Lavagna */}
        <div className="mb-6">
          {isConnected ? (
            <div>
              <div className="bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">
                    🌐 Modalità Real-time Attiva
                  </span>
                  <span className="text-xs text-gray-500">
                    Connesso al backend • Session ID: demo-session
                  </span>
                </div>
              </div>
              <SharedWhiteboard
                strokes={drawingStrokes}
                notes={drawingNotes}
                currentUser={currentUser}
                onAddStroke={handleConnectedAddStroke}
                onAddNote={handleConnectedAddNote}
                onClearCanvas={handleConnectedClear}
                isReadOnly={false}
                height={600}
              />
            </div>
          ) : (
            <div>
              <div className="bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700">
                    🎨 Modalità Demo Locale
                  </span>
                  <span className="text-xs text-gray-500">
                    {demoStrokes.length} tratti • {demoNotes.length} note
                  </span>
                </div>
              </div>
              <SharedWhiteboard
                strokes={demoStrokes}
                notes={demoNotes}
                currentUser={currentUser}
                onAddStroke={handleDemoAddStroke}
                onAddNote={handleDemoAddNote}
                onClearCanvas={handleDemoClear}
                isReadOnly={false}
                height={600}
              />
            </div>
          )}
        </div>

        {/* Info utente */}
        {currentUser && (
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Utente Corrente</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>ID: {currentUser.id}</span>
              <span>Nome: {currentUser.name}</span>
              <span>Codice: {currentUser.personalCode}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}