import React, { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

/**
 * Couple Game Component
 * Handles all couple-specific functionality:
 * - Partner pairing
 * - Shared sessions
 * - Real-time communication
 * - Session management
 */
export default function CoupleGame({ user, onExit }) {
  const [gameState, setGameState] = useState('partner-search'); // 'partner-search', 'session-create', 'session-join', 'playing'
  const [partner, setPartner] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [gameSessionId, setGameSessionId] = useState(null); // ID della sessione di gioco
  const [currentCard, setCurrentCard] = useState(null);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);

  // Initialize SignalR connection
  useEffect(() => {
    console.log('🔄 Initializing SignalR connection for user:', user.id);
    
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/gamehub')
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    console.log('🔗 Starting SignalR connection...');
    
    newConnection.start()
      .then(() => {
        console.log('✅ SignalR Connected successfully');
        setConnection(newConnection);
        
        // Join user to SignalR groups for real-time updates
        console.log('👤 Invoking JoinHub for user:', user.id);
        return newConnection.invoke('JoinHub', user.id);
      })
      .then(() => {
        console.log('✅ JoinHub completed successfully');
        // Clear any previous error
        setError('');
      })
      .catch(err => {
        console.error('❌ SignalR Connection Error:', err);
        console.error('❌ Error details:', err.message, err.stack);
        setError('Errore di connessione. Riprova.');
      });

    return () => {
      if (newConnection) {
        console.log('🔚 Stopping SignalR connection');
        newConnection.stop();
      }
    };
  }, [user.id]);

  // Setup SignalR event handlers
  useEffect(() => {
    if (!connection) return;

    // Listen for session updates
    connection.on('SessionCreated', (session) => {
      console.log('🎮 Session created:', session);
      setCurrentSession(session);
      setGameState('playing');
    });

    connection.on('GameSessionCreated', (gameSession) => {
      console.log('🎮 Game session created:', gameSession);
      setGameSessionId(gameSession.id);
      
      // Join the game session group automatically
      if (connection) {
        console.log('🔗 Auto-joining game session group:', gameSession.id);
        connection.invoke('JoinSessionGroup', gameSession.id)
          .then(() => {
            console.log('✅ Successfully joined game session group');
          })
          .catch(error => {
            console.error('❌ Failed to join game session group:', error);
          });
      }
    });

    connection.on('PartnerJoined', (partnerInfo) => {
      console.log('👥 Partner joined:', partnerInfo);
      setPartner(partnerInfo);
    });

    connection.on('CardShared', (cardData) => {
      console.log('🃏 CardShared event received!');
      console.log('📦 Card data received:', cardData);
      console.log('🔄 Current card before update:', currentCard);
      setCurrentCard(cardData);
      console.log('✅ Card state updated via SignalR');
    });

    connection.on('MessageReceived', (message) => {
      console.log('💬 Message received:', message);
      setMessages(prev => [...prev, message]);
    });

    connection.on('JoinedSessionGroup', (sessionId) => {
      console.log('✅ Confirmed joined session group:', sessionId);
    });

    connection.on('SessionJoinError', (error) => {
      console.error('❌ Session join error:', error);
    });

    connection.on('CardShareError', (error) => {
      console.error('❌ Card share error:', error);
    });

    return () => {
      connection.off('SessionCreated');
      connection.off('PartnerJoined');
      connection.off('CardShared');
      connection.off('MessageReceived');
    };
  }, [connection]);

  // Load available partners
  const loadAvailablePartners = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users?gameType=Couple&availableForPairing=true`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const partners = await response.json();
      // Filter out current user
      const filtered = partners.filter(p => p.id !== user.id);
      setAvailablePartners(filtered);
      console.log('👥 Available partners:', filtered);
    } catch (err) {
      console.error('❌ Error loading partners:', err);
      setError('Errore nel caricamento dei partner disponibili');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new session
  const createSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/game/couples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Sessione di ${user.name}`,
          gameType: 'Couple',
          createdBy: user.id
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const couple = await response.json();
      console.log('🎮 Session created:', couple);
      
      // Join the SignalR group for this session
      if (connection) {
        console.log('🔗 Creator joining session group:', couple.id, 'Connection state:', connection.state);
        try {
          await connection.invoke('JoinSessionGroup', couple.id);
          console.log('✅ Creator successfully joined session group');
        } catch (error) {
          console.error('❌ Creator failed to join session group:', error);
        }
      } else {
        console.error('❌ No SignalR connection when creator trying to join session group');
      }
      
      // Generate session code for sharing
      const code = couple.id.substring(0, 8).toUpperCase();
      setSessionCode(code);
      setCurrentSession(couple);
      setGameState('session-create');
      
    } catch (err) {
      console.error('❌ Error creating session:', err);
      setError('Errore nella creazione della sessione');
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing session
  const joinSession = async (code) => {
    setIsLoading(true);
    try {
      // Find session by code (simplified - in production use proper session codes)
      const response = await fetch(`http://localhost:5000/api/game/couples`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const couples = await response.json();
      const session = couples.find(c => c.id.substring(0, 8).toUpperCase() === code.toUpperCase());
      
      if (!session) {
        throw new Error('Sessione non trovata');
      }
      
      // Join the session
      const joinResponse = await fetch(`http://localhost:5000/api/game/couples/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!joinResponse.ok) throw new Error(`HTTP ${joinResponse.status}`);
      
      // Join the SignalR group for this session
      if (connection) {
        console.log('🔗 Joining session group:', session.id, 'Connection state:', connection.state);
        try {
          await connection.invoke('JoinSessionGroup', session.id);
          console.log('✅ Successfully joined session group');
        } catch (error) {
          console.error('❌ Failed to join session group:', error);
        }
      } else {
        console.error('❌ No SignalR connection when trying to join session group');
      }
      
      setCurrentSession(session);
      setGameState('playing');
      
    } catch (err) {
      console.error('❌ Error joining session:', err);
      setError(err.message || 'Errore nell\'unirsi alla sessione');
    } finally {
      setIsLoading(false);
    }
  };

  // Draw a new card
  const drawCard = async () => {
    if (!currentSession) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/game/cards/Couple/random`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const card = await response.json();
      setCurrentCard(card);
      
      // Notify partner via SignalR
      if (connection && user && gameSessionId) {
        console.log('🃏 Attempting to share card via SignalR:', {
          gameSessionId: gameSessionId,
          userId: user.id,
          card: card,
          connectionState: connection.state
        });
        try {
          await connection.invoke('ShareCard', gameSessionId, user.id, card);
          console.log('✅ ShareCard invocation successful');
        } catch (signalrError) {
          console.error('❌ ShareCard invocation failed:', signalrError);
        }
      } else {
        console.warn('⚠️ Cannot share card - missing connection, user, or game session:', {
          connection: !!connection,
          user: !!user,
          gameSessionId: !!gameSessionId,
          connectionState: connection?.state
        });
      }
      
    } catch (err) {
      console.error('❌ Error drawing card:', err);
      setError('Errore nel pescare la carta');
    } finally {
      setIsLoading(false);
    }
  };

  // Start game - create game session
  const startGame = async () => {
    if (!currentSession || !connection) {
      console.error('❌ Cannot start game - missing session or connection');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🎮 Creating game session for couple:', currentSession.id);
      await connection.invoke('CreateGameSession', currentSession.id, user.id);
      console.log('✅ Game session creation request sent');
      
      // Switch to playing state
      setGameState('playing');
    } catch (err) {
      console.error('❌ Error starting game:', err);
      setError('Errore nell\'avvio del gioco');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to partner
  const sendMessage = async (messageText) => {
    if (!currentSession || !connection) return;
    
    try {
      await connection.invoke('SendMessage', currentSession.id, {
        senderId: user.id,
        senderName: user.name,
        message: messageText,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  };

  // Render partner search screen
  const renderPartnerSearch = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Trova il tuo Partner 💕
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-4xl mb-4">🆕</div>
          <h3 className="text-xl font-semibold mb-2">Crea Sessione</h3>
          <p className="text-gray-600 mb-4">Crea una nuova sessione e invita il tuo partner</p>
          <button
            onClick={createSession}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Crea Sessione'}
          </button>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold mb-2">Unisciti a Sessione</h3>
          <p className="text-gray-600 mb-4">Inserisci il codice della sessione</p>
          <input
            type="text"
            placeholder="Codice sessione"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={() => joinSession(sessionCode)}
            disabled={isLoading || !sessionCode.trim()}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Connettendo...' : 'Unisciti'}
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          loadAvailablePartners();
          setGameState('partner-list');
        }}
        className="text-blue-500 hover:text-blue-700"
      >
        🔍 Cerca partner disponibili
      </button>
    </div>
  );

  // Render session creation screen
  const renderSessionCreate = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Sessione Creata! 🎉
      </h2>
      
      <div className="bg-blue-50 rounded-lg p-8 mb-6">
        <div className="text-4xl mb-4">🔑</div>
        <h3 className="text-xl font-semibold mb-2">Codice Sessione</h3>
        <div className="text-3xl font-mono font-bold text-blue-600 mb-4">
          {sessionCode}
        </div>
        <p className="text-gray-600">
          Condividi questo codice con il tuo partner
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigator.clipboard.writeText(sessionCode)}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          📋 Copia Codice
        </button>
        <button
          onClick={startGame}
          disabled={isLoading}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Avviando...' : '▶️ Inizia Gioco'}
        </button>
      </div>
    </div>
  );

  // Render playing screen
  const renderPlaying = () => (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Gioco di Coppia 💕
        </h2>
        {partner && (
          <p className="text-gray-600">
            In gioco con: {partner.name}
          </p>
        )}
      </div>

      {currentCard ? (
        <div className="bg-pink-50 rounded-lg p-8 mb-6 text-center">
          <div className="text-4xl mb-4">🃏</div>
          <h3 className="text-xl font-semibold mb-4">
            {currentCard.content || currentCard.text || currentCard.question}
          </h3>
          <p className="text-gray-600">
            Categoria: {currentCard.category}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 mb-6 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-gray-600">
            Clicca "Pesca Carta" per iniziare
          </p>
        </div>
      )}

      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={drawCard}
          disabled={isLoading}
          className="bg-pink-500 text-white py-3 px-6 rounded-lg hover:bg-pink-600 disabled:opacity-50"
        >
          {isLoading ? 'Pescando...' : '🃏 Pesca Carta'}
        </button>
      </div>

      {/* Simple message area */}
      {messages.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2">💬 Messaggi</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {messages.slice(-3).map((msg, idx) => (
              <div key={idx} className="text-sm">
                <strong>{msg.senderName}:</strong> {msg.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Ciao, {user.nickname || user.name}! 👋
            </h1>
            <p className="text-gray-600">Gioco di Coppia</p>
          </div>
          <button
            onClick={onExit}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Indietro
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {gameState === 'partner-search' && renderPartnerSearch()}
        {gameState === 'session-create' && renderSessionCreate()}
        {gameState === 'playing' && renderPlaying()}
      </div>
    </div>
  );
}
