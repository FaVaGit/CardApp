import React, { useState, useEffect, useRef } from 'react';

/**
 * Modern Couple Game Component - Event-Driven Architecture
 * 
 * Uses EventDrivenApiService with RabbitMQ backend
 * Features:
 * - Auto-couple matching with user codes
 * - Automatic game session creation
 * - Card drawing with event publishing
 * - Real-time partner status updates
 */
export default function CoupleGame({ user, apiService, onExit }) {
  const [gameState, setGameState] = useState('finding-partner'); // 'finding-partner', 'waiting-for-partner', 'playing', 'game-over'
  const [couple, setCouple] = useState(null);
  const [currentCouple, setCurrentCouple] = useState(null); // Track current couple for real-time updates
  const [gameSession, setGameSession] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerInfo, setPartnerInfo] = useState(null); // Stores partner details (personalCode, name)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const msgIdRef = useRef(0);
  const nextMsgId = () => `${Date.now()}-${msgIdRef.current++}`;

  // Add status message helper
  const addMessage = (text, type = 'info') => {
    const message = {
      id: nextMsgId(),
      text,
      type, // 'info', 'success', 'error'
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  };

  // Initialize couple game and setup event-driven listeners
  useEffect(() => {
    const displayCode = user.userCode || user.personalCode || 'N/A';
    const displayName = user.nickname || user.name || 'Utente';
    console.log('🚀 Initializing Couple Game for user:', displayName, 'with code:', displayCode);
    // Avoid duplicate welcome message
    setMessages(prev => {
      if (prev.some(m => m.text.startsWith(`Benvenuto ${displayName}!`))) return prev;
      return [...prev, { id: nextMsgId(), text: `Benvenuto ${displayName}! Il tuo codice è: ${displayCode}`, type: 'info', timestamp: new Date().toLocaleTimeString() }];
    });
    addMessage('Inserisci il codice del tuo partner per iniziare.', 'info');

    // Setup event-driven listeners for RabbitMQ events (via polling)
    const setupEventListeners = () => {
      // Listen for couple joined events (RabbitMQ: CoupleCreated/CoupleUpdated)
      const handleCoupleJoined = (data) => {
        console.log('💑 Received couple joined event:', data);
        addMessage('💑 Partner si è collegato alla coppia!', 'success');
        if (data?.partner) {
          setPartnerInfo(data.partner);
          if (!partnerCode) {
            setPartnerCode(data.partner.personalCode || data.partner.userCode || '');
          }
          // Extra confirmation log for clarity (only if not already logged)
          const partnerDisplay = data.partner.personalCode || data.partner.userCode;
          if (partnerDisplay) {
            addMessage(`✅ Coppia formata con ${partnerDisplay}!`, 'success');
          }
        }
        
        if (gameState === 'waiting-for-partner') {
          addMessage('⏳ Entrambi i partner collegati, avvio automatico...', 'info');
          // The backend should auto-start the game session here
        }
      };

      // Listen for game session started events (RabbitMQ: GameSessionStarted)
      const handleGameSessionStarted = (data) => {
        console.log('🎮 Received game session started event:', data);
        setGameState('playing');
        addMessage('🎮 Partita avviata automaticamente!', 'success');
        
        // Optionally fetch the game session details
        if (data.sessionId) {
          setGameSession({ id: data.sessionId, isActive: true });
        }
      };

      // Listen for card drawn events (RabbitMQ: CardDrawn)
      const handleCardDrawn = (cardData) => {
        console.log('🎴 Received card drawn event from partner:', cardData);
        if (cardData.card) {
          addMessage(`🎴 Partner ha pescato una carta`, 'info');
        }
      };

      // Listen for session updates (NEW - for card synchronization)
      const handleSessionUpdated = (updateData) => {
        console.log('🔄 Session updated:', updateData);
        
        if (updateData.type === 'cardDrawn' && updateData.card) {
          // Update current card for both partners
          setCurrentCard(updateData.card);
          
          // Add to activity log ONLY for partner actions (avoid duplicates)
          if (updateData.drawnBy !== user.userId) {
            addMessage(`🎴 Partner ha pescato: ${updateData.card.content}`, 'success');
          }
          // For own actions, the immediate response in handleDrawCard handles the message
        }
      };

      // Listen for partner updates (NEW - for partner info synchronization)
      const handlePartnerUpdated = (partnerData) => {
        console.log('👥 Partner updated:', partnerData);
        if (!partnerData) return;
        setPartnerInfo(partnerData);
        // Update partnerCode for second user (who didn't type it)
        if (!partnerCode) {
          setPartnerCode(partnerData.personalCode || partnerData.userCode || '');
        }
        addMessage(`✅ Coppia formata con ${partnerData.personalCode || partnerData.userCode || 'partner'}!`, 'success');
      };

      // Remove existing listeners to prevent duplicates
      apiService.off('coupleJoined', handleCoupleJoined);
      apiService.off('gameSessionStarted', handleGameSessionStarted);
      apiService.off('cardDrawn', handleCardDrawn);
      apiService.off('sessionUpdated', handleSessionUpdated);
      apiService.off('partnerUpdated', handlePartnerUpdated);

      // Add listeners
      apiService.on('coupleJoined', handleCoupleJoined);
      apiService.on('gameSessionStarted', handleGameSessionStarted);
      apiService.on('cardDrawn', handleCardDrawn);
      apiService.on('sessionUpdated', handleSessionUpdated);
      apiService.on('partnerUpdated', handlePartnerUpdated);

  return { handleCoupleJoined, handleGameSessionStarted, handleCardDrawn, handleSessionUpdated, handlePartnerUpdated };
    };

    const listeners = setupEventListeners();

    // Cleanup event listeners on unmount
    return () => {
      apiService.off('coupleJoined', listeners.handleCoupleJoined);
      apiService.off('gameSessionStarted', listeners.handleGameSessionStarted);
      apiService.off('cardDrawn', listeners.handleCardDrawn);
      apiService.off('sessionUpdated', listeners.handleSessionUpdated);
      apiService.off('partnerUpdated', listeners.handlePartnerUpdated);
    };
  }, [user, apiService]); // Removed gameState dependency to prevent re-setup

  // Handle partner code input
  const handleJoinCouple = async () => {
    if (!partnerCode.trim()) {
      setError('Inserisci il codice del partner');
      return;
    }

    if (partnerCode.trim() === (user.userCode || user.personalCode)) {
      setError('Non puoi utilizzare il tuo stesso codice!');
      return;
    }

    setIsLoading(true);
    setError('');
    addMessage(`Tentativo di collegamento con partner: ${partnerCode}`, 'info');

    try {
      // Use the new event-driven API to join/create couple
      const response = await apiService.joinCouple(partnerCode.trim());
      
      if (response.success) {
        setCouple(response.couple);
        addMessage(`✅ Coppia formata con ${partnerCode}!`, 'success');
        if (partnerCode && !partnerInfo) {
          setPartnerInfo({ personalCode: partnerCode });
        }
        
        // Check if game auto-started
        if (response.gameSession) {
          setGameSession(response.gameSession);
          setGameState('playing');
          addMessage('🎮 Partita iniziata automaticamente!', 'success');
        } else {
          setGameState('waiting-for-partner');
          addMessage('⏳ In attesa che il partner si colleghi...', 'info');
        }
      } else {
        setError('Errore nella formazione della coppia');
        addMessage('❌ Errore nel collegamento con il partner', 'error');
      }
    } catch (error) {
      console.error('❌ Error joining couple:', error);
      setError(`Errore: ${error.message}`);
      addMessage(`❌ Errore: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle starting game manually (if not auto-started)
  const handleStartGame = async () => {
    if (!couple?.id) {
      setError('Nessuna coppia disponibile');
      return;
    }

    setIsLoading(true);
    setError('');
    addMessage('🎮 Avvio partita...', 'info');

    try {
      const session = await apiService.startGame(couple.id);
      setGameSession(session);
      setGameState('playing');
      addMessage('✅ Partita avviata!', 'success');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      setError(`Errore nell'avvio della partita: ${error.message}`);
      addMessage(`❌ Errore nell'avvio: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drawing a card
  const handleDrawCard = async () => {
    if (!gameSession?.id) {
      setError('Nessuna sessione di gioco attiva');
      return;
    }

    setIsLoading(true);
    setError('');
    addMessage('🎴 Pescando carta...', 'info');

    try {
      const card = await apiService.drawCard(gameSession.id);
      
      // Update card immediately as fallback (sync will handle partner updates)
      if (card) {
        setCurrentCard(card);
        addMessage(`✅ Carta pescata: ${card.content || card.title || 'Carta'} 🎴`, 'success');
        console.log('🎴 Card draw successful:', card);
      }
      
      // The sessionUpdated event will handle partner synchronization
    } catch (error) {
      console.error('❌ Error drawing card:', error);
      setError(`Errore nel pescare la carta: ${error.message}`);
      addMessage(`❌ Errore nella pesca: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ending the game
  const handleEndGame = async () => {
    if (!gameSession?.id) {
      onExit();
      return;
    }

    setIsLoading(true);
    addMessage('🔚 Terminando partita...', 'info');

    try {
      await apiService.endGame(gameSession.id);
      addMessage('✅ Partita terminata!', 'success');
    } catch (error) {
      console.error('❌ Error ending game:', error);
      addMessage(`❌ Errore nella chiusura: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      onExit();
    }
  };

  // Render partner search screen
  const renderPartnerSearch = () => (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🤝 Trova il tuo Partner
        </h2>
        <p className="text-gray-600">
          Il tuo codice: <span className="font-mono font-bold text-blue-600">{user.userCode}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Codice del Partner
          </label>
          <input
            type="text"
            value={partnerCode}
            onChange={(e) => {
              setPartnerCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="Inserisci codice..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={handleJoinCouple}
          disabled={isLoading || !partnerCode.trim()}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '🔄 Collegamento...' : '🤝 Collega Partner'}
        </button>

        <button
          onClick={onExit}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
        >
          ← Torna al Menu
        </button>
      </div>
    </div>
  );

  // Render waiting for partner screen
  const renderWaitingForPartner = () => (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ⏳ In Attesa del Partner
        </h2>
        <p className="text-gray-600">
          Coppia formata! Partner: <span className="font-mono font-bold text-green-600">{partnerInfo?.personalCode || partnerInfo?.userCode || partnerCode}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-center text-gray-600">
          In attesa che il partner si colleghi per iniziare automaticamente la partita...
        </div>

        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? '🔄 Avvio...' : '🎮 Forza Avvio Partita'}
        </button>

        <button
          onClick={onExit}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
        >
          ← Torna al Menu
        </button>
      </div>
    </div>
  );

  // Render playing screen
  const renderPlaying = () => (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          💕 Gioco di Coppia
        </h2>
        <p className="text-gray-600">
          Tu: <span className="font-mono font-bold text-blue-600">{user.userCode}</span> • 
          Partner: <span className="font-mono font-bold text-green-600">{partnerInfo?.personalCode || partnerInfo?.userCode || partnerCode || '—'}</span>
        </p>
        <p className="text-sm text-gray-500">
          Sessione: {gameSession?.id}
        </p>
      </div>

      {/* Current Card Display */}
      {currentCard ? (
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white mb-6">
          <h3 className="text-xl font-bold mb-2">Carta #{currentCard.id}</h3>
          <p className="text-purple-100 text-lg">{currentCard.content}</p>
          {currentCard.category && (
            <span className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-sm">
              {currentCard.category}
            </span>
          )}
          {currentCard.level && (
            <span className="inline-block mt-3 ml-2 px-3 py-1 bg-white/10 rounded-full text-sm">
              Livello {currentCard.level}
            </span>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 rounded-xl p-6 text-center mb-6">
          <p className="text-gray-600">Clicca "Pesca Carta" per iniziare!</p>
        </div>
      )}

      {/* Game Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleDrawCard}
          disabled={isLoading}
          className="bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 disabled:opacity-50 text-lg font-semibold"
        >
          {isLoading ? '🔄 Pescando...' : '🎴 Pesca Carta'}
        </button>

        <button
          onClick={handleEndGame}
          disabled={isLoading}
          className="bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 disabled:opacity-50 text-lg font-semibold"
        >
          {isLoading ? '🔄 Terminando...' : '🔚 Termina Partita'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
    </div>
  );

  // Render activity log
  const renderActivityLog = () => (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">📋 Log Attività</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessuna attività</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 font-mono">{message.timestamp}</span>
                <span className={`flex-1 ${
                  message.type === 'success' ? 'text-green-600' :
                  message.type === 'error' ? 'text-red-600' :
                  'text-gray-700'
                }`}>
                  {message.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      {gameState === 'finding-partner' && renderPartnerSearch()}
      {gameState === 'waiting-for-partner' && renderWaitingForPartner()}
      {gameState === 'playing' && renderPlaying()}
      
      {renderActivityLog()}
    </div>
  );
}
