import React, { useState, useRef, useEffect } from 'react';
import { expandedCards } from './expandedCards';
import { ShareCardModal } from './ShareCardModal';
import { useCardSharing } from './useCardSharing';

export function MultiUserGameSession({ 
  gameSession, 
  currentUser, 
  partnerStatus,
  onLeaveSession, 
  onSendMessage, 
  onShareCard
}) {
  const [current, setCurrent] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('game'); // 'game', 'chat'
  const messagesEndRef = useRef(null);

  // Hook per la condivisione carte
  const {
    isShareModalOpen,
    cardToShare,
    openShareModal,
    closeShareModal
  } = useCardSharing();

  const categories = [
    { id: 'all', name: 'Tutte', emoji: '🎲' },
    { id: 'intimacy', name: 'Intimità', emoji: '❤️' },
    { id: 'communication', name: 'Comunicazione', emoji: '💬' },
    { id: 'fun', name: 'Divertimento', emoji: '🎉' },
    { id: 'growth', name: 'Crescita', emoji: '🌱' },
    { id: 'memories', name: 'Ricordi', emoji: '📸' },
    { id: 'future', name: 'Futuro', emoji: '🔮' }
  ];

  // Debug dello stato
  console.log('🔍 MultiUserGameSession - gameSession:', gameSession);
  console.log('🔍 MultiUserGameSession - currentUser:', currentUser);
  console.log('🔍 MultiUserGameSession - partnerStatus:', partnerStatus);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameSession?.messages]);

  const getFilteredCards = () => {
    if (selectedCategory === 'all') {
      return expandedCards;
    }
    return expandedCards.filter(card => card.category === selectedCategory);
  };

  const drawCard = () => {
    setIsDrawing(true);
    setTimeout(() => {
      const filteredCards = getFilteredCards();
      const idx = Math.floor(Math.random() * filteredCards.length);
      const selectedCard = filteredCards[idx];
      setCurrent(selectedCard);
      setIsDrawing(false);
    }, 800);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('📤 Sending message:', newMessage.trim());
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleShareCard = (card) => {
    console.log('📤 Sharing card:', card);
    onShareCard(card);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
      {/* Header */}
      <div className="bg-white bg-opacity-90 backdrop-blur-sm shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sessione Multi-Utente
              </h1>
              <p className="text-sm text-gray-600">
                {currentUser?.name} • Codice: {gameSession?.sessionCode || 'N/A'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('game')}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  activeTab === 'game'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎲 Gioco
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  activeTab === 'chat'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                💬 Chat {gameSession?.messages?.length > 0 && `(${gameSession.messages.length})`}
              </button>
              <button
                onClick={onLeaveSession}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
              >
                🚪 Esci
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Debug Info */}
        <div className="mb-4 p-4 bg-yellow-100 rounded-lg text-sm">
          <p><strong>Debug Session:</strong></p>
          <p>Session: {JSON.stringify(gameSession)}</p>
          <p>Messages count: {gameSession?.messages?.length || 0}</p>
        </div>

        {activeTab === 'game' && (
          <div className="space-y-6">
            {/* Sezione categorie */}
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                Scegli una categoria
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-xl text-center transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-purple-500 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.emoji}</div>
                    <div className="text-xs font-semibold">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sezione carta corrente */}
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-center">
                {current ? (
                  <div className="space-y-4">
                    <div className="text-4xl mb-4">{current.emoji}</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      {current.text}
                    </h2>
                    {current.description && (
                      <p className="text-gray-600 mb-6">
                        {current.description}
                      </p>
                    )}
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => openShareModal(current)}
                        className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-200"
                      >
                        📤 Condividi
                      </button>
                      <button
                        onClick={drawCard}
                        className="px-6 py-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all duration-200"
                      >
                        🎲 Nuova Carta
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="text-6xl mb-4">🎲</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Inizia il gioco!
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Pesca la prima carta per iniziare la vostra avventura
                    </p>
                    <button
                      onClick={drawCard}
                      disabled={isDrawing}
                      className={`px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full transition-all duration-200 ${
                        isDrawing
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      {isDrawing ? '🎲 Pescando...' : '🎲 Pesca Carta'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chat di Sessione</h3>
            
            {/* Messaggi */}
            <div className="h-64 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-xl">
              {gameSession?.messages?.length > 0 ? (
                gameSession.messages.map((message, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex items-start space-x-2">
                      <div className="font-semibold text-sm text-purple-600">
                        {message.senderName || message.userName || 'Utente'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'Ora'}
                      </div>
                    </div>
                    <div className="text-gray-800">{message.text || message.message}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Nessun messaggio ancora.</p>
                  <p className="text-sm">Inizia la conversazione!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input messaggio */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Scrivi un messaggio..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className={`px-6 py-2 rounded-full transition-all duration-200 ${
                  newMessage.trim()
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                📤
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal per condivisione carte */}
      {isShareModalOpen && cardToShare && (
        <ShareCardModal
          card={cardToShare}
          onClose={closeShareModal}
          onShare={handleShareCard}
        />
      )}
    </div>
  );
}
