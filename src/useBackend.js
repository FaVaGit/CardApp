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

      // Setup event listeners
      backendService.on('userJoined', (user) => {
        console.log('👤 User joined event:', user);
        // Aggiorna dalla fonte autorevole invece di usare i dati dell'evento
        refreshOnlineUsers();
      });

      backendService.on('userLeft', (userId) => {
        console.log('👋 User left event:', userId);
        // Aggiorna dalla fonte autorevole invece di filtrare localmente
        refreshOnlineUsers();
      });

      backendService.on('coupleCreated', (couple) => {
        console.log('💑 Couple created event:', couple);
        // Aggiorna la coppia dalla fonte autorevole per avere dati freschi dal database
        if (couple && couple.id) {
          refreshCurrentCouple(couple.id);
        } else {
          setCurrentCouple(couple);
        }
        // Aggiorna anche la lista utenti
        refreshOnlineUsers();
      });

      backendService.on('userPresenceUpdated', (users) => {
        console.log('🟢 User presence updated event received, refreshing from API...');
        // Invece di usare i dati dell'evento, aggiorna dalla fonte autorevole
        refreshOnlineUsers();
      });

      backendService.on('messageReceived', (message) => {
        setMessages(prev => [...prev, message]);
      });

      backendService.on('gameSessionUpdated', (session) => {
        setGameSession(session);
      });

      backendService.on('cardShared', (card) => {
        setSharedCards(prev => [...prev, card]);
      });

      backendService.on('onlineUsersUpdate', (users) => {
        console.log('📋 Online users update event received, refreshing from API...');
        // Invece di usare i dati dell'evento, aggiorna dalla fonte autorevole
        refreshOnlineUsers();
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
            console.log('🔄 Retrying SignalR methods after delay...');
            await backendService.updateUserPresence(user.id);
            await backendService.joinHub(user.id);
            
            setTimeout(async () => {
              await backendService.refreshOnlineUsers();
              console.log('🔄 Refreshed online users after retry');
            }, 1000);
            
            console.log('✅ SignalR methods called successfully (retry)');
          }
        }, 2000);
      }
      
      // FALLBACK: Carica gli utenti via API REST come backup
      console.log('🌐 Loading users via REST API as fallback...');
      setTimeout(async () => {
        try {
          const users = await backendService.getUsers();
          console.log('📋 Loaded users via REST API:', users);
          setOnlineUsers(users);
        } catch (error) {
          console.warn('⚠️ Failed to load users via REST API:', error);
        }
      }, 2000);
      
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
        console.log('✅ Couple creation notified via SignalR');
      } else {
        console.warn('⚠️ SignalR not connected, skipping couple notification');
      }
      
      return couple;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Unirsi a una coppia tramite codice utente
  const joinUserByCode = useCallback(async (targetUserCode) => {
    if (!currentUser) {
      throw new Error('Devi essere loggato per unirti a una coppia');
    }

    try {
      // Prima verifico che l'utente target esista
      const targetUser = await backendService.joinUserByCode(targetUserCode);
      console.log('Target user found:', targetUser);
      
      // Creo una coppia usando l'endpoint corretto che aggiunge entrambi gli utenti
      const coupleName = `${currentUser.name} & ${targetUser.name}`;
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

  // Logout
  const logout = useCallback(async () => {
    try {
      await backendService.disconnect();
      setCurrentUser(null);
      setOnlineUsers([]);
      setGameSession(null);
      setMessages([]);
      setSharedCards([]);
      setIsConnected(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      backendService.disconnect();
    };
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // User data
    currentUser,
    onlineUsers,
    currentCouple,
    
    // Game data
    gameSession,
    messages,
    sharedCards,
    
    // Actions
    initializeConnection,
    registerUser,
    loginUser,
    getUsers,
    createCouple,
    joinUserByCode,
    createGameSession,
    sendMessage,
    shareCard,
    logout
  };
}
