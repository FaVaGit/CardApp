import { useState, useEffect, useCallback } from 'react';
import { backendService } from './BackendService';

export function useBackend() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [gameSession, setGameSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharedCards, setSharedCards] = useState([]);
  const [error, setError] = useState(null);

  // Drawing/Whiteboard state
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  const [drawingNotes, setDrawingNotes] = useState([]);

  // Gestione coppie
  const [currentCouple, setCurrentCouple] = useState(null);

  // Inizializza la connessione al backend
  const initializeConnection = useCallback(async () => {
    if (isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Verifica se il backend è disponibile
      const healthCheck = await backendService.checkHealth();
      if (!healthCheck) {
        throw new Error('Backend ASP.NET Core non disponibile su localhost:5000');
      }

      // Inizializza SignalR
      const connected = await backendService.initialize();
      if (!connected) {
        throw new Error('Impossibile connettersi al hub SignalR');
      }

      // Setup event listeners per messaggi e carte
      backendService.on('userJoined', (user) => {
        console.log('👤 User joined event:', user);
        refreshOnlineUsers();
      });

      backendService.on('userLeft', (userId) => {
        console.log('👋 User left event:', userId);
        refreshOnlineUsers();
      });

      backendService.on('coupleCreated', (couple) => {
        console.log('💑 Couple created event:', couple);
        if (couple && couple.id) {
          refreshCurrentCouple(couple.id);
        } else {
          setCurrentCouple(couple);
        }
        refreshOnlineUsers();
      });

      backendService.on('messageReceived', (message) => {
        console.log('💬 Message received:', message);
        setMessages(prev => [...prev, message]);
      });

      backendService.on('cardShared', (card) => {
        console.log('🎴 Card shared:', card);
        setSharedCards(prev => [...prev, card]);
      });

      // Setup event listeners per la lavagna condivisa
      backendService.on('drawingStrokeAdded', (stroke) => {
        console.log('🎨 Drawing stroke added:', stroke);
        setDrawingStrokes(prev => [...prev, stroke]);
      });

      backendService.on('drawingNoteAdded', (note) => {
        console.log('📝 Drawing note added:', note);
        setDrawingNotes(prev => [...prev, note]);
      });

      backendService.on('drawingCleared', (sessionId) => {
        console.log('🧹 Drawing cleared for session:', sessionId);
        setDrawingStrokes([]);
        setDrawingNotes([]);
      });

      backendService.on('drawingUndoRedo', (data) => {
        console.log('↩️ Drawing undo/redo:', data);
        // Handle undo/redo operations
        if (data.action === 'undo') {
          // Remove last stroke
          setDrawingStrokes(prev => prev.slice(0, -1));
        }
      });

      setIsConnected(true);
      console.log('✅ Backend connection established');
      
      // Aggiorna immediatamente la lista utenti dall'API
      refreshOnlineUsers();
      
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnecting, isConnected]);

  // Aggiorna la lista utenti online dalla fonte autorevole (API REST)
  const refreshOnlineUsers = useCallback(async () => {
    try {
      console.log('🔄 Refreshing online users from API...');
      const users = await backendService.getUsers();
      console.log('📋 Loaded users from API:', users);
      setOnlineUsers(users);
      return users;
    } catch (error) {
      console.warn('⚠️ Failed to refresh online users:', error);
      return [];
    }
  }, []);

  // Aggiorna la coppia corrente dalla fonte autorevole (API REST)
  const refreshCurrentCouple = useCallback(async (coupleId) => {
    try {
      console.log('🔄 Refreshing current couple from API...', coupleId);
      const couple = await backendService.getCoupleById(coupleId);
      console.log('💕 Loaded couple from API:', couple);
      setCurrentCouple(couple);
      return couple;
    } catch (error) {
      console.warn('⚠️ Failed to refresh current couple:', error);
      return null;
    }
  }, []);

  // Registra un nuovo utente
  const registerUser = useCallback(async (userData) => {
    try {
      const user = await backendService.registerUser(userData);
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Login utente
  const loginUser = useCallback(async (credentials) => {
    try {
      const user = await backendService.loginUser(credentials);
      setCurrentUser(user);
      
      console.log('🔐 Login completed, checking SignalR connection...', {
        isConnected: backendService.isConnected,
        userId: user.id
      });
      
      // Aspetta che la connessione SignalR sia pronta
      if (backendService.isConnected) {
        console.log('📡 Calling SignalR methods...');
        await backendService.updateUserPresence(user.id);
        await backendService.joinHub(user.id);
        
        // Aspetta un momento per permettere al server di aggiornare lo stato
        setTimeout(async () => {
          await backendService.refreshOnlineUsers();
          console.log('🔄 Refreshed online users after join');
        }, 1000);
        
        console.log('✅ SignalR methods called successfully');
      } else {
        console.warn('⚠️ SignalR not connected, skipping presence update');
        // Riprova dopo la connessione
        setTimeout(async () => {
          if (backendService.isConnected) {
            await backendService.updateUserPresence(user.id);
            await backendService.joinHub(user.id);
            await backendService.refreshOnlineUsers();
          }
        }, 2000);
      }
      
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Ottieni lista utenti
  const getUsers = useCallback(async () => {
    try {
      const users = await backendService.getUsers();
      setOnlineUsers(users);
      return users;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Creare una coppia
  const createCouple = useCallback(async (coupleData) => {
    try {
      const couple = await backendService.createCouple(coupleData);
      
      // Aggiorna dalla fonte autorevole per avere dati freschi dal database
      if (couple && couple.id) {
        await refreshCurrentCouple(couple.id);
      } else {
        setCurrentCouple(couple);
      }
      
      // Aggiorna anche la lista utenti
      await refreshOnlineUsers();
      
      console.log('💑 Couple created, notifying via SignalR...', {
        isConnected: backendService.isConnected,
        couple
      });
      
      // Notifica creazione coppia via SignalR
      if (backendService.isConnected) {
        await backendService.notifyCoupleCreated(couple);
        console.log('✅ Couple creation notification sent via SignalR');
      } else {
        console.warn('⚠️ SignalR not connected, skipping couple creation notification');
      }
      
      return couple;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [refreshCurrentCouple, refreshOnlineUsers]);

  // Connetti a un utente tramite codice
  const createCoupleByCode = useCallback(async (targetUserCode, coupleName = null) => {
    if (!currentUser) {
      throw new Error('Utente non autenticato');
    }

    try {
      const couple = await backendService.createCoupleByCode(currentUser.id, targetUserCode, coupleName);
      setCurrentCouple(couple);
      console.log('Couple created:', couple);
      
      // Notifica via SignalR per sincronizzazione tempo reale
      if (backendService.isConnected) {
        await backendService.notifyCoupleCreated(couple);
      }
      
      return couple;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  // Crea una sessione di gioco
  const createGameSession = useCallback(async (sessionData) => {
    try {
      const session = await backendService.createGameSession(sessionData);
      setGameSession(session);
      return session;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Invia un messaggio
  const sendMessage = useCallback(async (messageText) => {
    if (!currentUser) {
      throw new Error('Utente non autenticato');
    }

    try {
      const message = {
        userId: currentUser.id,
        userName: currentUser.name,
        text: messageText,
        timestamp: new Date().toISOString()
      };
      
      await backendService.sendMessage(message);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  // Condividi una carta
  const shareCard = useCallback(async (card) => {
    if (!currentUser) {
      throw new Error('Utente non autenticato');
    }

    try {
      const cardData = {
        ...card,
        sharedBy: currentUser.id,
        sharedByName: currentUser.name,
        timestamp: new Date().toISOString()
      };
      
      await backendService.shareCard(cardData);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  // Drawing/Whiteboard methods
  const addDrawingStroke = useCallback(async (sessionId, strokeData) => {
    if (!currentUser) {
      throw new Error('Utente non autenticato');
    }

    try {
      const strokeWithUser = {
        ...strokeData,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now()
      };
      
      await backendService.addDrawingStroke(sessionId, strokeWithUser);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  const addDrawingNote = useCallback(async (sessionId, noteData) => {
    if (!currentUser) {
      throw new Error('Utente non autenticato');
    }

    try {
      const noteWithUser = {
        ...noteData,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now()
      };
      
      await backendService.addDrawingNote(sessionId, noteWithUser);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  const clearDrawing = useCallback(async (sessionId) => {
    try {
      await backendService.clearDrawing(sessionId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  const undoDrawing = useCallback(async (sessionId) => {
    try {
      await backendService.undoDrawing(sessionId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  const redoDrawing = useCallback(async (sessionId) => {
    try {
      await backendService.redoDrawing(sessionId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  const getDrawingData = useCallback(async (sessionId) => {
    try {
      const data = await backendService.getDrawingData(sessionId);
      if (data) {
        setDrawingStrokes(data.strokes || []);
        setDrawingNotes(data.notes || []);
      }
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await backendService.disconnect();
      setCurrentUser(null);
      setOnlineUsers([]);
      setGameSession(null);
      setMessages([]);
      setSharedCards([]);
      setDrawingStrokes([]);
      setDrawingNotes([]);
      setCurrentCouple(null);
      setIsConnected(false);
      setError(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Inizializza la connessione quando il hook viene montato
  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // User management
    currentUser,
    onlineUsers,
    registerUser,
    loginUser,
    getUsers,
    logout,
    
    // Couple management
    currentCouple,
    createCouple,
    createCoupleByCode,
    
    // Game management
    gameSession,
    createGameSession,
    
    // Messaging
    messages,
    sendMessage,
    
    // Card sharing
    sharedCards,
    shareCard,
    
    // Drawing/Whiteboard
    drawingStrokes,
    drawingNotes,
    addDrawingStroke,
    addDrawingNote,
    clearDrawing,
    undoDrawing,
    redoDrawing,
    getDrawingData,
    
    // Utility
    initializeConnection,
    refreshOnlineUsers,
    refreshCurrentCouple
  };
}