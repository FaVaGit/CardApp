import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Simple Card Game Component
 * COMPLETELY DECOUPLED from authentication and couples
 * Single responsibility: Display and manage card game
 */
export default function SimpleCardGame({ user, gameType, onExit }) {
  const [currentCard, setCurrentCard] = useState(null);
  const [cardHistory, setCardHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Card deck - simple Italian relationship cards
  const cardDeck = useMemo(() => [
    {
      id: 1,
      text: "Qual è il tuo ricordo più bello insieme?",
      category: "Ricordi"
    },
    {
      id: 2,
      text: "Cosa apprezzi di più del tuo partner?",
      category: "Apprezzamento"
    },
    {
      id: 3,
      text: "Qual è il tuo sogno per il futuro?",
      category: "Futuro"
    },
    {
      id: 4,
      text: "Come ti senti quando siamo insieme?",
      category: "Emozioni"
    },
    {
      id: 5,
      text: "Qual è stata la tua giornata più felice?",
      category: "Felicità"
    },
    {
      id: 6,
      text: "Cosa vorresti fare insieme questo weekend?",
      category: "Attività"
    },
    {
      id: 7,
      text: "Qual è il tuo posto preferito nel mondo?",
      category: "Viaggi"
    },
    {
      id: 8,
      text: "Come descrivi l'amore?",
      category: "Amore"
    },
    {
      id: 9,
      text: "Qual è la tua paura più grande?",
      category: "Vulnerabilità"
    },
    {
      id: 10,
      text: "Cosa ti rende orgoglioso/a di noi?",
      category: "Orgoglio"
    }
  ], []);

  // Get random card
  const drawNewCard = useCallback(() => {
    setIsLoading(true);
    
    // Simulate brief loading for UX
    setTimeout(() => {
      const availableCards = cardDeck.filter(card => 
        !cardHistory.some(historyCard => historyCard.id === card.id)
      );
      
      if (availableCards.length === 0) {
        // Reset if all cards have been used
        setCardHistory([]);
        setCurrentCard(cardDeck[Math.floor(Math.random() * cardDeck.length)]);
      } else {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        setCurrentCard(randomCard);
        setCardHistory(prev => [...prev, randomCard]);
      }
      
      setIsLoading(false);
    }, 500);
  }, [cardHistory, cardDeck]);

  // Initialize with first card
  useEffect(() => {
    drawNewCard();
  }, [drawNewCard]);

  const getCategoryColor = (category) => {
    const colors = {
      'Ricordi': 'bg-blue-500',
      'Apprezzamento': 'bg-green-500',
      'Futuro': 'bg-purple-500',
      'Emozioni': 'bg-pink-500',
      'Felicità': 'bg-yellow-500',
      'Attività': 'bg-indigo-500',
      'Viaggi': 'bg-teal-500',
      'Amore': 'bg-red-500',
      'Vulnerabilità': 'bg-orange-500',
      'Orgoglio': 'bg-cyan-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎮 Gioco della Complicità
          </h1>
          <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
            <span>👤 {user.nickname || user.name}</span>
            <span>•</span>
            <span>🎯 {gameType.name}</span>
            <span>•</span>
            <span>📊 Carta {cardHistory.length + 1}</span>
          </div>
        </div>

        {/* Current Card */}
        <div className="mb-8">
          {isLoading ? (
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-gray-600">Pescando una nuova carta...</p>
            </div>
          ) : currentCard ? (
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-8 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(currentCard.category)} text-white`}>
                  {currentCard.category}
                </span>
                <span className="text-pink-200 text-sm">#{currentCard.id}</span>
              </div>
              <p className="text-xl font-medium leading-relaxed">
                {currentCard.text}
              </p>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <div className="text-4xl mb-4">🃏</div>
              <p className="text-gray-600">Nessuna carta disponibile</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={drawNewCard}
            disabled={isLoading}
            className="flex-1 bg-pink-500 text-white py-3 px-6 rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? '🔄 Attendere...' : '🎲 Nuova Carta'}
          </button>
          
          <button
            onClick={() => setCardHistory([])}
            className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            🔄 Reset
          </button>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800">{cardHistory.length}</div>
              <div className="text-sm text-gray-600">Carte pescate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{cardDeck.length - cardHistory.length}</div>
              <div className="text-sm text-gray-600">Carte rimanenti</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{cardDeck.length}</div>
              <div className="text-sm text-gray-600">Totale carte</div>
            </div>
          </div>
        </div>

        {/* Exit */}
        <div className="text-center">
          <button
            onClick={onExit}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Torna alla selezione gioco
          </button>
        </div>
      </div>
    </div>
  );
}
