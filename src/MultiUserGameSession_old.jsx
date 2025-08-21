import React, { useState, useRef, useEffect } from 'react';
import { expandedCards } from './expandedCards';
import { SharedCanvas } from './SharedCanvas';

export function MultiUserGameSession({ 
  selectedMode,
  gameSession, 
  currentUser, 
  currentFamily,
  partnerConnection,
  sharedCanvas,
  sharedNotes,
  onLeaveSession, 
  onSendMessage, 
  onShareCard, 
  onDrawCard,
  onAddCanvasStroke,
  onAddNote,
  onClearCanvas,
  getParticipantNames,
  expandedCards: cardDeck,
  allFamilyCards
}) {
  const [current, setCurrent] = useState(gameSession?.currentCard || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('game'); // 'game', 'chat', 'canvas'
  const messagesEndRef = useRef(null);

  // Seleziona il mazzo di carte appropriato
  const cards = selectedMode?.gameType === 'family' ? allFamilyCards : (cardDeck || expandedCards);

  const categories = [
    { id: 'all', name: 'Tutte', emoji: '🎲' },
    { id: 'viaggi', name: 'Viaggi', emoji: '✈️' },
    { id: 'svago', name: 'Svago', emoji: '🎮' },
    { id: 'famiglia', name: 'Famiglia', emoji: '👨‍👩‍👧‍👦' },
    { id: 'gossip', name: 'Gossip', emoji: '🗣️' },
    { id: 'cibo', name: 'Cibo', emoji: '🍕' },
    { id: 'obiettivi', name: 'Obiettivi', emoji: '🎯' },
    { id: 'natura', name: 'Natura', emoji: '🌲' },
    { id: 'cultura', name: 'Cultura', emoji: '📚' },
    { id: 'intimita', name: 'Intimità', emoji: '💕' },
    { id: 'speciali', name: 'Speciali', emoji: '🦸' },
    { id: 'jolly', name: 'Jolly', emoji: '⚡' },
    { id: 'festivita', name: 'Festività', emoji: '🎉' },
    { id: 'connessione', name: 'Connessione', emoji: '🤝' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [gameSession?.messages]);

  useEffect(() => {
    if (gameSession?.currentCard && gameSession.currentCard !== current) {
      setCurrent(gameSession.currentCard);
    }
  }, [gameSession?.currentCard]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getFilteredCards = () => {
    if (selectedCategory === 'all') return cards;
    return cards.filter(card => card.category === selectedCategory);
  };

  const drawCard = () => {
    if (onDrawCard) {
      // Usa la funzione avanzata se disponibile
      onDrawCard(selectedCategory);
    } else {
      // Fallback al metodo locale
      setIsDrawing(true);
      setTimeout(() => {
        const filteredCards = getFilteredCards();
        const idx = Math.floor(Math.random() * filteredCards.length);
        const selectedCard = filteredCards[idx];
        setCurrent(selectedCard);
        onShareCard(selectedCard);
        setIsDrawing(false);
      }, 800);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const participantNames = getParticipantNames();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4 relative">
      {/* Header della sessione */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">
                {selectedMode?.gameType === 'family' ? '�‍👩‍👧‍👦' : '💕'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Sessione {selectedMode?.gameType === 'family' ? 'Famiglia' : 'Coppia'} - {selectedMode?.type === 'dual' ? 'Dual Device' : 'Multi-Utente'}
                </h1>
                <p className="text-sm text-gray-600">
                  Partecipanti: {participantNames.join(', ')}
                </p>
                {selectedMode?.type === 'dual' && partnerConnection && (
                  <p className="text-sm text-green-600 font-medium">
                    🟢 Partner connesso
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onLeaveSession}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
              >
                Esci
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'game'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎲 Gioco
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'chat'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💬 Chat
              {gameSession?.messages?.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {gameSession.messages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'canvas'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎨 Canvas
              {(sharedCanvas?.length > 0 || sharedNotes?.length > 0) && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contenuto delle tab */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'game' && (
          <div>
            {/* Selettore categoria */}
            <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                Scegli la categoria di carte 🎯
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {categories.map(category => {
                  const cardCount = category.id === 'all' 
                    ? cards.length 
                    : cards.filter(c => c.category === category.id).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-lg mb-1">{category.emoji}</div>
                      <div>{category.name}</div>
                      <div className="text-xs opacity-70">
                        ({cardCount})
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Area principale del gioco */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Gioco della Complicità
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                {selectedMode?.gameType === 'family' ? '👨‍👩‍👧‍👦 Modalità Famiglia' : '💕 Modalità Coppia'} - Sessione Condivisa
              </p>
            </div>

            {/* Draw button */}
            <div className="text-center mb-8">
              <button
                className={`px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isDrawing ? 'animate-pulse' : 'hover:from-purple-600 hover:to-pink-600'
                }`}
                onClick={drawCard}
                disabled={isDrawing}
              >
                {isDrawing ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Pescando...
                  </span>
                ) : (
                  'Pesca una Carta 🎲'
                )}
              </button>
            </div>

            {/* Card display */}
            {current ? (
              <div className={`max-w-md mx-auto bg-gradient-to-br ${current.color} p-1 rounded-3xl shadow-2xl transform transition-all duration-700 hover:scale-105`}>
                <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-3xl">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2 animate-bounce cursor-pointer hover:scale-110 transition-transform duration-200">
                      {current.emoji}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Carta #{current.id}
                    </h2>
                    <h3 className="text-xl font-semibold text-gray-700 mt-1">
                      {current.title}
                    </h3>
                    {current.sharedBy && current.sharedBy !== currentUser?.id && (
                      <p className="text-sm text-purple-600 mt-2">
                        Condivisa da: {current.sharedByName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {current.prompts.map((p, i) => (
                      <div key={i} className="bg-white bg-opacity-50 p-4 rounded-2xl border-l-4 border-purple-400 hover:bg-opacity-70 transition-all duration-200 hover:shadow-md">
                        <p className="text-gray-800 leading-relaxed font-medium">
                          <span className="text-purple-600 font-bold text-lg">{i + 1}.</span> {p}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 italic">
                      💡 Discutete insieme le vostre risposte!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto text-center">
                <div className="bg-white bg-opacity-80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
                  <div className="text-6xl mb-4 animate-pulse">
                    {selectedMode?.gameType === 'family' ? '�‍👩‍👧‍👦' : '💕'}
                  </div>
                  <p className="text-xl text-gray-700 font-medium leading-relaxed mb-4">
                    Benvenuti nella sessione {selectedMode?.gameType === 'family' ? 'famiglia' : 'coppia'}!<br />
                    Pescate una carta per iniziare l'avventura insieme.
                  </p>
                </div>
              </div>
            )}

            {/* Cronologia carte condivise */}
            {gameSession?.sharedHistory?.length > 0 && (
              <div className="mt-8 bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  📚 Carte Giocate nella Sessione ({gameSession.sharedHistory.length})
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {gameSession.sharedHistory.slice(-6).map((card, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{card.emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-800">{card.title}</div>
                          <div className="text-xs text-purple-600">
                            da {card.sharedByName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Chat */}
        {activeTab === 'chat' && (
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-lg h-96 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 flex items-center">
                <span className="mr-2">💬</span>
                Chat di Gruppo
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {gameSession?.messages?.map((message) => (
                <div key={message.id} className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === currentUser?.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {message.senderId !== currentUser?.id && (
                      <div className="text-xs opacity-70 mb-1">
                        {message.senderName}
                      </div>
                    )}
                    <div className="text-sm">{message.message}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50"
                >
                  <span className="text-sm">📤</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Canvas */}
        {activeTab === 'canvas' && (
          <div>
            <SharedCanvas
              strokes={sharedCanvas || []}
              notes={sharedNotes || []}
              onAddStroke={onAddCanvasStroke}
              onAddNote={onAddNote}
              onClearCanvas={onClearCanvas}
              isReadOnly={false}
              participants={participantNames}
            />
          </div>
        )}
      </div>
    </div>
  );
}
