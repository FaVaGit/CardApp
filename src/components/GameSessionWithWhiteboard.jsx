import { useState, useEffect } from 'react';
import { SharedCanvas } from '../SharedCanvas';
import { useBackend } from '../useBackend';

export function GameSessionWithWhiteboard({ gameSession, currentUser, onLeaveSession }) {
  const [activeTab, setActiveTab] = useState('game');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  
  const {
    drawingStrokes,
    drawingNotes,
    addDrawingStroke,
    addDrawingNote,
    clearDrawing,
    undoDrawing,
    redoDrawing,
    getDrawingData
  } = useBackend();

  // Carica i dati della lavagna all'avvio
  useEffect(() => {
    if (gameSession?.id) {
      getDrawingData(gameSession.id);
    }
  }, [gameSession?.id, getDrawingData]);

  const handleAddStroke = async (strokeData) => {
    if (gameSession?.id) {
      await addDrawingStroke(gameSession.id, strokeData);
    }
  };

  const handleAddNote = async (noteData) => {
    if (gameSession?.id) {
      await addDrawingNote(gameSession.id, noteData);
    }
  };

  const handleClearCanvas = async () => {
    if (gameSession?.id) {
      await clearDrawing(gameSession.id);
    }
  };

  const handleUndo = async () => {
    if (gameSession?.id) {
      await undoDrawing(gameSession.id);
    }
  };

  const handleRedo = async () => {
    if (gameSession?.id) {
      await redoDrawing(gameSession.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header della sessione */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sessione di Gioco
              </h1>
              <p className="text-gray-600">
                {gameSession?.participants?.length || 0} partecipanti attivi
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Toggle Lavagna */}
              <button
                onClick={() => setShowWhiteboard(!showWhiteboard)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  showWhiteboard 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
                }`}
              >
                🎨 Lavagna Condivisa
                {(drawingStrokes.length > 0 || drawingNotes.length > 0) && (
                  <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                )}
              </button>
              
              {/* Esci */}
              <button
                onClick={onLeaveSession}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
              >
                Esci
              </button>
            </div>
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area di gioco principale */}
          <div className="lg:col-span-2">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Area di Gioco
              </h2>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Qui si svolge il gioco principale
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
                  Pesca una Carta 🎲
                </button>
              </div>
            </div>
          </div>

          {/* Pannello laterale */}
          <div className="space-y-4">
            {/* Tab selector */}
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('game')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'game'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🎲 Gioco
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'chat'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  💬 Chat
                </button>
              </div>
            </div>

            {/* Contenuto tab */}
            <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
              {activeTab === 'game' && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">Storico Carte</h3>
                  <p className="text-gray-600 text-sm">Nessuna carta pescata ancora</p>
                </div>
              )}
              
              {activeTab === 'chat' && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">Chat di Gruppo</h3>
                  <p className="text-gray-600 text-sm">Nessun messaggio ancora</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lavagna Condivisa */}
        {showWhiteboard && (
          <div className="mt-6">
            <SharedCanvas
              strokes={drawingStrokes}
              notes={drawingNotes}
              currentUser={currentUser}
              sessionId={gameSession?.id}
              onAddStroke={handleAddStroke}
              onAddNote={handleAddNote}
              onClearCanvas={handleClearCanvas}
              onUndo={handleUndo}
              onRedo={handleRedo}
              isReadOnly={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}