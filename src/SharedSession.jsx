import React, { useState, useEffect } from 'react';
import { CollaborativeChat } from './CollaborativeChat';
import { CollaborativeCanvas } from './CollaborativeCanvas';

/**
 * Componente principale per la sessione condivisa
 * Combina carta, chat e canvas in un'interfaccia collaborativa
 */
export function SharedSession({ 
  sharedSession, 
  messages, 
  canvasData, 
  participants, 
  currentUser, 
  isHost,
  sessionCode,
  onSendMessage, 
  onCanvasUpdate, 
  onEndSession,
  onLeaveSession 
}) {
  const [activeTab, setActiveTab] = useState('card');
  const [showSessionCode, setShowSessionCode] = useState(false);

  if (!sharedSession) return null;

  const { card } = sharedSession;
  const prompts = Array.isArray(card.prompts) ? card.prompts : [card.content];

  // Copia codice sessione
  const copySessionCode = async () => {
    if (!sessionCode) return;
    
    try {
      await navigator.clipboard.writeText(sessionCode);
      setShowSessionCode(true);
      setTimeout(() => setShowSessionCode(false), 2000);
    } catch (error) {
      console.error('Errore copia codice:', error);
    }
  };

  // Tabs disponibili
  const tabs = [
    { id: 'card', icon: '🎴', label: 'Carta', badge: null },
    { id: 'chat', icon: '💬', label: 'Chat', badge: messages.length > 0 ? messages.length : null },
    { id: 'canvas', icon: '🎨', label: 'Canvas', badge: null }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header della sessione */}
        <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                🎮 Sessione Condivisa
                {isHost && <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">HOST</span>}
              </h2>
              <p className="text-purple-100 text-sm">
                {card.title} - {participants.length} partecipant{participants.length !== 1 ? 'i' : 'e'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Codice sessione */}
              {sessionCode && (
                <button
                  onClick={copySessionCode}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm transition-colors"
                  title="Copia codice sessione"
                >
                  {showSessionCode ? '✅ Copiato!' : `📋 ${sessionCode}`}
                </button>
              )}
              
              {/* Partecipanti online */}
              <div className="flex items-center gap-1">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-bold"
                    title={participant.name}
                  >
                    {participant.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                ))}
              </div>
              
              {/* Pulsante chiudi */}
              <button
                onClick={isHost ? onEndSession : onLeaveSession}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
                title={isHost ? 'Termina sessione' : 'Abbandona sessione'}
              >
                {isHost ? '🛑' : '🚪'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Contenuto dinamico */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'card' && (
            <div className="p-6 h-full overflow-y-auto">
              {/* Carta condivisa */}
              <div className={`bg-gradient-to-br ${card.color || 'from-purple-400 to-pink-300'} p-1 rounded-2xl shadow-lg mb-6`}>
                <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-2xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">
                      {card.emoji || '🎯'}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">
                      {card.title || 'Carta Speciale'}
                    </h3>
                    <div className="space-y-4">
                      {prompts.map((prompt, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-gray-700 leading-relaxed text-left">
                            <span className="text-purple-600 font-bold text-lg">{index + 1}.</span> {prompt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Istruzioni per la sessione */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Come usare la sessione:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>💬 <strong>Chat:</strong> Discutete insieme le domande della carta</li>
                  <li>🎨 <strong>Canvas:</strong> Disegnate e prendete note insieme</li>
                  <li>🔄 <strong>Sincronizzazione:</strong> Tutto è condiviso in tempo reale</li>
                  <li>📋 <strong>Codice sessione:</strong> Condividilo con il tuo partner per unirsi</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="p-4 h-full">
              <CollaborativeChat
                messages={messages}
                participants={participants}
                currentUser={currentUser}
                onSendMessage={onSendMessage}
                isActive={true}
              />
            </div>
          )}

          {activeTab === 'canvas' && (
            <div className="p-4 h-full">
              <CollaborativeCanvas
                canvasData={canvasData}
                onCanvasUpdate={onCanvasUpdate}
                currentUser={currentUser}
                participants={participants}
                isActive={true}
              />
            </div>
          )}
        </div>

        {/* Footer con azioni rapide */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              ⏱️ Sessione iniziata: {new Date(sharedSession.createdAt).toLocaleTimeString('it-IT')}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick actions */}
              <button
                onClick={() => setActiveTab('chat')}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                💬 Chat rapida
              </button>
              
              <button
                onClick={() => setActiveTab('canvas')}
                className="px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                🎨 Disegna
              </button>

              {/* Status indicator */}
              <div className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
