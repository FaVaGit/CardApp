import { useState, useEffect, useRef, useCallback } from 'react';

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
  // Rimuoviamo completamente lo stato intermedio: la UI di gioco viene montata subito.
  // Mostreremo un piccolo banner se la sessione non è ancora avviata, ma niente schermata separata.
  const [gameState, setGameState] = useState('playing'); // semplificato: sempre 'playing'
  const [couple, setCouple] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerInfo, setPartnerInfo] = useState(null); // Stores partner details (personalCode, name)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  // Flags per deduplicare i log
  const flagsRef = useRef({
    loggedWelcome: false,
    loggedWaiting: false,
    loggedCoupleFormed: false,
    loggedGameStarted: false,
  loggedSessionSync: false,
  loggedPartnerSyncDelay: false
  });
  const msgIdRef = useRef(0);
  const nextMsgId = useCallback(() => `${Date.now()}-${msgIdRef.current++}`, []);

  // Add status message helper
  const addMessage = useCallback((text, type = 'info') => {
    const message = {
      id: nextMsgId(),
      text,
      type, // 'info', 'success', 'error'
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  }, [nextMsgId]);

  // Initialize couple game and setup event-driven listeners
  useEffect(() => {
    const displayCode = user.userCode || user.personalCode || 'N/A';
    const displayName = user.nickname || user.name || 'Utente';
    console.log('🚀 Initializing Couple Game for user:', displayName, 'with code:', displayCode);
    if (!flagsRef.current.loggedWelcome) {
      flagsRef.current.loggedWelcome = true;
      setMessages(prev => [...prev, { id: nextMsgId(), text: `Benvenuto ${displayName}! Il tuo codice è: ${displayCode}`, type: 'info', timestamp: new Date().toLocaleTimeString() }]);
    }
    const hasEstablished = !!(gameSession?.id || partnerInfo);
    if (!flagsRef.current.loggedWaiting && !hasEstablished) {
      addMessage('Attendi la conferma della coppia (richiesta/approvazione).', 'info');
      flagsRef.current.loggedWaiting = true;
    }

    // Setup event-driven listeners for RabbitMQ events (via polling)
    const setupEventListeners = () => {
      // Listen for couple joined events (RabbitMQ: CoupleCreated/CoupleUpdated)
      const handleCoupleJoined = (data) => {
        console.log('💑 Received couple joined event:', data);
        if (!flagsRef.current.loggedCoupleFormed) {
          addMessage('💑 Partner si è collegato alla coppia!', 'success');
        }
        if (data?.partner) {
          setPartnerInfo(data.partner);
          if (!partnerCode) {
            setPartnerCode(data.partner.personalCode || data.partner.userCode || '');
          }
          // Extra confirmation log for clarity (only if not already logged)
          const partnerDisplay = data.partner.personalCode || data.partner.userCode;
          if (partnerDisplay && !flagsRef.current.loggedCoupleFormed) {
            addMessage(`✅ Coppia formata con ${partnerDisplay}!`, 'success');
            flagsRef.current.loggedCoupleFormed = true;
          }
        }
        
        if (gameState === 'idle') {
          addMessage('⏳ Avvio automatico della sessione in corso...', 'info');
        }
      };

      // Listen for game session started events (RabbitMQ: GameSessionStarted)
      const handleGameSessionStarted = (data) => {
        console.log('🎮 Received game session started event:', data);
        if (!flagsRef.current.loggedGameStarted) {
          addMessage('🎮 Partita avviata automaticamente!', 'success');
          flagsRef.current.loggedGameStarted = true;
        }
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
        if (!flagsRef.current.loggedCoupleFormed) {
          addMessage(`✅ Coppia formata con ${partnerData.personalCode || partnerData.userCode || 'partner'}!`, 'success');
          flagsRef.current.loggedCoupleFormed = true;
        }
      };

      // Diagnostica ritardo sincronizzazione partner
      const handlePartnerSyncDelay = (info) => {
        if (!flagsRef.current.loggedPartnerSyncDelay) {
          addMessage('⏱️ Ritardo nella sincronizzazione del partner... (diagnostica)', 'info');
          flagsRef.current.loggedPartnerSyncDelay = true;
        }
        console.warn('Partner sync delay diagnostic event:', info);
      };

      // Remove existing listeners to prevent duplicates
      apiService.off('coupleJoined', handleCoupleJoined);
      apiService.off('gameSessionStarted', handleGameSessionStarted);
      apiService.off('cardDrawn', handleCardDrawn);
      apiService.off('sessionUpdated', handleSessionUpdated);
      apiService.off('partnerUpdated', handlePartnerUpdated);
  apiService.off('partnerSyncDelay', handlePartnerSyncDelay);

      // Add listeners
      apiService.on('coupleJoined', handleCoupleJoined);
      apiService.on('gameSessionStarted', handleGameSessionStarted);
      apiService.on('cardDrawn', handleCardDrawn);
      apiService.on('sessionUpdated', handleSessionUpdated);
      apiService.on('partnerUpdated', handlePartnerUpdated);
  apiService.on('partnerSyncDelay', handlePartnerSyncDelay);

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
  apiService.off('partnerSyncDelay', listeners.handlePartnerSyncDelay);
    };
  }, [user, apiService, gameState, partnerCode, addMessage, nextMsgId]);

  // Fallback: se il service ha già sessionId ma lo stato locale no, aggiorniamo
  useEffect(() => {
    if (!gameSession?.id && apiService.sessionId) {
      setGameSession({ id: apiService.sessionId, isActive: true });
      if (!flagsRef.current.loggedSessionSync) {
        addMessage('🔁 Sessione sincronizzata dal service.', 'info');
        flagsRef.current.loggedSessionSync = true;
      }
    }
    // Synthetic emission: se abbiamo partnerInfo o sessione tramite stato esterno ma non abbiamo ancora loggato coppia / partita
    if (partnerInfo && !flagsRef.current.loggedCoupleFormed) {
      addMessage(`✅ Coppia formata con ${partnerInfo.personalCode || partnerInfo.userCode || 'partner'}!`, 'success');
      flagsRef.current.loggedCoupleFormed = true;
    }
    if (gameSession?.id && !flagsRef.current.loggedGameStarted) {
      addMessage('🎮 Partita avviata automaticamente!', 'success');
      flagsRef.current.loggedGameStarted = true;
    }
  }, [apiService.sessionId, gameSession, addMessage]);

  // Rimosso flusso manuale: la coppia si forma via UserDirectory (join request)

  // Manual start removed: session avvia solo automaticamente

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

  // (Schermata partner search rimossa) Anche la schermata di preparazione è stata eliminata.

  // Render playing screen (ora sempre mostrata). Se la sessione non è ancora pronta mostriamo un badge "In attesa".
  const renderPlaying = () => (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          💕 Gioco di Coppia
        </h2>
        {!gameSession?.id && (
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium animate-pulse">
            <span>⏳ In attesa dell'avvio della sessione...</span>
          </div>
        )}
        <p className="text-gray-600 flex flex-col items-center gap-1">
          <span>Tu: <span className="font-semibold text-gray-800">{user.name || user.Name || 'Tu'}</span> (<span className="font-mono font-bold text-blue-600">{user.userCode}</span>)</span>
          {gameSession?.id && !partnerInfo && (
            <span className="italic text-amber-600">
              {/* Se dopo avvio sessione il partner non è ancora arrivato, mostriamo placeholder solo finché non arriva un update */}
              Partner in sincronizzazione...
            </span>
          )}
          {!gameSession?.id && !partnerInfo && (
            <span>Partner: — (<span className="font-mono font-bold text-green-600">—</span>)</span>
          )}
          {partnerInfo && (
            <span>Partner: <span className="font-semibold text-gray-800">{partnerInfo?.name || partnerInfo?.Name || '—'}</span> (<span className="font-mono font-bold text-green-600">{partnerInfo?.personalCode || partnerInfo?.userCode || partnerCode || '—'}</span>)</span>
          )}
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
  {/* Schermata finding-partner rimossa: si parte direttamente in waiting-for-partner */}
  {renderPlaying()}
      
      {renderActivityLog()}
    </div>
  );
}
