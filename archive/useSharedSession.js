import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook per gestire una sessione condivisa in tempo reale
 * Permette a due utenti di vedere la stessa carta e interagire tramite chat e canvas
 */
export function useSharedSession(backendService = null) {
  const [sharedSession, setSharedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [canvasData, setCanvasData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [sessionCode, setSessionCode] = useState(null);
  const connectionRef = useRef(null);

  // Genera un codice sessione univoco
  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Crea una nuova sessione condivisa
  const createSharedSession = useCallback(async (card, currentUser) => {
    try {
      console.log('🎮 Starting shared session creation...');
      console.log('Backend service:', backendService);
      console.log('Backend connected:', backendService?.isConnected);
      console.log('Backend connection:', backendService?.connection);

      const code = generateSessionCode();
      const sessionData = {
        id: `shared_${Date.now()}`,
        code: code,
        card: card,
        host: currentUser,
        createdAt: new Date().toISOString(),
        type: 'shared_card',
        status: 'waiting' // waiting, active, completed
      };

      console.log('🎮 Session data prepared:', sessionData);

      // Invia al backend per creare la sessione
      if (backendService && backendService.isConnected && backendService.connection) {
        console.log('📡 Invoking CreateSharedSession...');
        await backendService.connection.invoke('CreateSharedSession', sessionData);
        console.log('✅ CreateSharedSession invoked successfully');
      } else {
        console.warn('⚠️ Backend not available, creating session locally only');
        console.log('Backend service available:', !!backendService);
        console.log('Backend connected:', backendService?.isConnected);
        console.log('Backend connection available:', !!backendService?.connection);
        
        // Modalità locale: simula la creazione della sessione
        console.log('🏠 Creating session in local mode');
      }

      // Imposta lo stato locale indipendentemente dal backend
      setSharedSession(sessionData);
      setIsHost(true);
      setSessionCode(code);
      setParticipants([currentUser]);
      setMessages([]);
      setCanvasData(null);

      console.log('🎮 Shared session created locally:', code);
      return { sessionCode: code, session: sessionData };
    } catch (error) {
      console.error('❌ Errore creazione sessione condivisa:', error);
      throw error;
    }
  }, [backendService]);

  // Partecipa a una sessione esistente tramite codice
  const joinSharedSession = useCallback(async (code, currentUser) => {
    try {
      console.log('🚪 Starting shared session join...');
      console.log('Session code:', code);
      console.log('User:', currentUser);

      if (backendService && backendService.isConnected && backendService.connection) {
        console.log('📡 Invoking JoinSharedSession...');
        await backendService.connection.invoke('JoinSharedSession', code, currentUser);
        console.log('✅ JoinSharedSession invoked successfully');
      } else {
        console.warn('⚠️ Backend not available, simulating join locally');
        
        // Modalità locale: simula join alla sessione
        console.log('🏠 Simulating session join in local mode');
        
        // Per ora, crea una sessione fittizia per test
        const mockSession = {
          id: `shared_${Date.now()}`,
          code: code,
          card: {
            id: 'mock_1',
            title: 'Carta Condivisa Simulata',
            emoji: '🎭',
            prompts: ['Questa è una sessione simulata per test'],
            category: 'test',
            color: 'from-blue-400 to-purple-300'
          },
          host: { id: 'mock_host', name: 'Host Simulato' },
          createdAt: new Date().toISOString(),
          type: 'shared_card',
          status: 'active'
        };
        
        setSharedSession(mockSession);
        setIsHost(false);
        setParticipants([mockSession.host, currentUser]);
        setMessages([
          {
            id: 'welcome',
            content: 'Benvenuto nella sessione condivisa simulata!',
            timestamp: new Date().toISOString(),
            type: 'system'
          }
        ]);
      }

      setSessionCode(code);

      console.log('🚪 Joined shared session successfully');
      return true;
    } catch (error) {
      console.error('❌ Errore accesso sessione condivisa:', error);
      throw error;
    }
  }, [backendService]);

  // Invia un messaggio nella chat
  const sendMessage = useCallback(async (content, currentUser) => {
    if (!sharedSession || !currentUser) return;

    const message = {
      id: `msg_${Date.now()}`,
      sessionId: sharedSession.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: content,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    try {
      if (backendService && backendService.isConnected) {
        await backendService.connection.invoke('SendSharedSessionMessage', message);
      }

      // Aggiorna localmente (sarà sovrascritto dall'evento SignalR)
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('❌ Errore invio messaggio:', error);
    }
  }, [sharedSession, backendService]);

  // Aggiorna il canvas condiviso
  const updateCanvas = useCallback(async (canvasImageData, currentUser) => {
    if (!sharedSession || !currentUser) return;

    const canvasUpdate = {
      sessionId: sharedSession.id,
      userId: currentUser.id,
      userName: currentUser.name,
      imageData: canvasImageData,
      timestamp: new Date().toISOString()
    };

    try {
      if (backendService && backendService.isConnected) {
        await backendService.connection.invoke('UpdateSharedCanvas', canvasUpdate);
      }

      setCanvasData(canvasImageData);
    } catch (error) {
      console.error('❌ Errore aggiornamento canvas:', error);
    }
  }, [sharedSession, backendService]);

  // Termina la sessione condivisa
  const endSharedSession = useCallback(async () => {
    if (!sharedSession) return;

    try {
      if (backendService && backendService.isConnected && isHost) {
        await backendService.connection.invoke('EndSharedSession', sharedSession.id);
      }

      setSharedSession(null);
      setMessages([]);
      setCanvasData(null);
      setParticipants([]);
      setIsHost(false);
      setSessionCode(null);
    } catch (error) {
      console.error('❌ Errore chiusura sessione:', error);
    }
  }, [sharedSession, backendService, isHost]);

  // Setup event listeners per SignalR
  useEffect(() => {
    if (!backendService || !backendService.connection) return;

    const connection = backendService.connection;

    // Sessione creata con successo
    const handleSessionCreated = (session) => {
      console.log('✅ Shared session created:', session);
      setSharedSession(session);
    };

    // Qualcuno si è unito alla sessione
    const handleParticipantJoined = (participant, updatedSession) => {
      console.log('👤 Participant joined:', participant);
      setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
      setSharedSession(updatedSession);
    };

    // Qualcuno ha lasciato la sessione
    const handleParticipantLeft = (participantId, updatedSession) => {
      console.log('👋 Participant left:', participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      setSharedSession(updatedSession);
    };

    // Nuovo messaggio ricevuto
    const handleMessageReceived = (message) => {
      console.log('💬 Message received:', message);
      setMessages(prev => [...prev, message]);
    };

    // Canvas aggiornato
    const handleCanvasUpdated = (canvasUpdate) => {
      console.log('🎨 Canvas updated:', canvasUpdate);
      setCanvasData(canvasUpdate.imageData);
    };

    // Sessione terminata
    const handleSessionEnded = (sessionId) => {
      console.log('🔚 Session ended:', sessionId);
      if (sharedSession && sharedSession.id === sessionId) {
        setSharedSession(null);
        setMessages([]);
        setCanvasData(null);
        setParticipants([]);
        setIsHost(false);
        setSessionCode(null);
      }
    };

    // Errori di sessione
    const handleSessionError = (error) => {
      console.error('❌ Session error:', error);
    };

    // Registra event listeners
    connection.on('SharedSessionCreated', handleSessionCreated);
    connection.on('SharedSessionJoined', handleParticipantJoined);
    connection.on('SharedSessionLeft', handleParticipantLeft);
    connection.on('SharedSessionMessage', handleMessageReceived);
    connection.on('SharedCanvasUpdated', handleCanvasUpdated);
    connection.on('SharedSessionEnded', handleSessionEnded);
    connection.on('SharedSessionError', handleSessionError);

    // Cleanup
    return () => {
      connection.off('SharedSessionCreated', handleSessionCreated);
      connection.off('SharedSessionJoined', handleParticipantJoined);
      connection.off('SharedSessionLeft', handleParticipantLeft);
      connection.off('SharedSessionMessage', handleMessageReceived);
      connection.off('SharedCanvasUpdated', handleCanvasUpdated);
      connection.off('SharedSessionEnded', handleSessionEnded);
      connection.off('SharedSessionError', handleSessionError);
    };
  }, [backendService, sharedSession]);

  return {
    // Stato della sessione
    sharedSession,
    messages,
    canvasData,
    participants,
    isHost,
    sessionCode,

    // Azioni
    createSharedSession,
    joinSharedSession,
    sendMessage,
    updateCanvas,
    endSharedSession,

    // Utility
    isSessionActive: !!sharedSession,
    participantCount: participants.length
  };
}
