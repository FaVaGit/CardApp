import React, { useState } from 'react';
import { FloatingParticles } from './FloatingParticles';
import { useConfetti, ConfettiEffect } from './ConfettiEffect';
import { useMultiUser } from './useMultiUser';
import { MultiUserLoginForm } from './MultiUserLoginForm';
import { MultiUserLobby } from './MultiUserLobby';
import { MultiUserGameSession } from './MultiUserGameSession';
import { HistoryModal } from './HistoryModal';
import { expandedCards } from './expandedCards';

// Manteniamo anche la versione single-user per compatibilità
import { useAuth, useHistory } from './useAuth';
import { LoginForm } from './LoginForm';

export default function App() {
  const [gameMode, setGameMode] = useState('multi'); // 'multi' o 'single'
  const [appView, setAppView] = useState('lobby'); // 'lobby', 'single-game', 'multi-game'
  const [current, setCurrent] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { showConfetti, triggerConfetti } = useConfetti();
  
  // Multi-user hooks
  const { 
    currentUser: multiUser, 
    allUsers, 
    onlineUsers, 
    gameSession, 
    isLoading: multiLoading,
    registerCouple, 
    loginCouple, 
    logout: multiLogout,
    createGameSession,
    joinGameSession,
    leaveGameSession,
    sendMessage,
    shareCard,
    getParticipantNames 
  } = useMultiUser();
  
  // Single-user hooks (per compatibilità)
  const { user: singleUser, login: singleLogin, logout: singleLogout, isLoading: singleLoading } = useAuth();
  const { history, addToHistory, clearHistory, getStats } = useHistory();

  // Filtra le carte per categoria
  const getFilteredCards = () => {
    if (selectedCategory === 'all') return expandedCards;
    return expandedCards.filter(card => card.category === selectedCategory);
  };

  const categories = [
    { id: 'all', name: 'Tutte', emoji: '🎲' },
    { id: 'viaggi', name: 'Viaggi', emoji: '✈️' },
    { id: 'svago', name: 'Svago', emoji: '�' },
    { id: 'famiglia', name: 'Famiglia', emoji: '👨‍👩‍👧‍👦' },
    { id: 'gossip', name: 'Gossip', emoji: '🗣️' },
    { id: 'cibo', name: 'Cibo', emoji: '�' },
    { id: 'obiettivi', name: 'Obiettivi', emoji: '🎯' },
    { id: 'natura', name: 'Natura', emoji: '🌲' },
    { id: 'cultura', name: 'Cultura', emoji: '📚' },
    { id: 'intimita', name: 'Intimità', emoji: '💕' },
    { id: 'speciali', name: 'Speciali', emoji: '🦸' },
    { id: 'jolly', name: 'Jolly', emoji: '⚡' },
    { id: 'festivita', name: 'Festività', emoji: '�' },
    { id: 'connessione', name: 'Connessione', emoji: '🤝' }
  ];

  function drawCard() {
    setIsDrawing(true);
    setTimeout(() => {
      const filteredCards = getFilteredCards();
      const idx = Math.floor(Math.random() * filteredCards.length);
      const selectedCard = filteredCards[idx];
      setCurrent(selectedCard);
      addToHistory({ ...selectedCard, originalId: selectedCard.id });
      setIsDrawing(false);
      triggerConfetti();
    }, 800);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4 flex flex-col items-center relative overflow-hidden">
      {/* Floating particles background */}
      <FloatingParticles />
      
      {/* Confetti effect */}
      <ConfettiEffect show={showConfetti} />

      {/* Header con controlli utente */}
      <div className="w-full max-w-4xl mb-6 z-10">
        <div className="flex justify-between items-center bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">👋</div>
            <div>
              <p className="font-semibold text-gray-800">
                Ciao {user.partnerName1} & {user.partnerName2}!
              </p>
              {user.coupleNickname && (
                <p className="text-sm text-purple-600">
                  aka "{user.coupleNickname}" ✨
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <span>📖</span>
              <span>Storia ({history.length})</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
            >
              Esci
            </button>
          </div>
        </div>
      </div>

      {/* Selettore categoria */}
      <div className="w-full max-w-4xl mb-6 z-10">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
            Scegli la categoria di carte 🎯
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {categories.map(category => (
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
                  ({expandedCards.filter(c => category.id === 'all' ? true : c.category === category.id).length})
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-center text-sm text-gray-600">
            Categoria attiva: <strong>{categories.find(c => c.id === selectedCategory)?.name}</strong> 
            {' '}({getFilteredCards().length} carte disponibili)
          </div>
        </div>
      </div>

      {/* Header principale */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Gioco della Complicità
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          ❤️ 150 carte per rafforzare il vostro legame ❤️
        </p>
      </div>

      {/* Draw button */}
      <button
        className={`mb-8 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95 z-10 ${
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

      {/* Card display */}
      {current ? (
        <div 
          className={`max-w-md w-full bg-gradient-to-br ${current.color} p-1 rounded-3xl shadow-2xl transform transition-all duration-700 animate-fade-in z-10 hover:scale-105`}
        >
          <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-3xl">
            <div className="text-center mb-4">
              <div className="text-6xl mb-2 animate-bounce cursor-pointer hover:scale-110 transition-transform duration-200">{current.emoji}</div>
              <h2 className="text-2xl font-bold text-gray-800">
                Carta #{current.id}
              </h2>
              <h3 className="text-xl font-semibold text-gray-700 mt-1">
                {current.title}
              </h3>
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
            <div className="mt-6 text-center space-y-3">
              <button 
                onClick={drawCard}
                disabled={isDrawing}
                className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 hover:from-purple-500 hover:to-pink-500"
              >
                Pesca un'altra carta ✨
              </button>
              <p className="text-sm text-gray-600 italic">
                💡 Prendetevi il vostro tempo per godervi il momento!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md text-center z-10">
          <div className="bg-white bg-opacity-80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-opacity-90">
            <div className="text-6xl mb-4 animate-pulse cursor-pointer hover:scale-110 transition-transform duration-200">💝</div>
            <p className="text-xl text-gray-700 font-medium leading-relaxed mb-4">
              Clicca su <span className="font-bold text-purple-600">"Pesca una Carta"</span> per iniziare la vostra avventura romantica!
            </p>
            <div className="text-4xl animate-bounce mb-4">⬆️</div>
            <p className="text-sm text-gray-600 italic">
              ✨ 40 carte uniche vi aspettano ✨
            </p>
          </div>
        </div>
      )}

      {/* Footer sparkles */}
      <div className="mt-8 flex flex-col items-center space-y-2 z-10">
        <div className="flex space-x-2 text-2xl animate-pulse">
          <span>✨</span>
          <span>💖</span>
          <span>✨</span>
        </div>
        <p className="text-sm text-gray-600 text-center px-4">
          Creato con ❤️ per le coppie che vogliono rafforzare il loro legame
        </p>
      </div>

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        stats={getStats()}
        onClearHistory={() => {
          clearHistory();
          setShowHistory(false);
        }}
      />
    </div>
  );
}
