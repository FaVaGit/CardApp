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

  // Stati per le coppie
  const [currentCouple, setCurrentCouple] = useState(null);
  const [allCouples, setAllCouples] = useState([]);

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
        // Non aspettare questi metodi per evitare di bloccare il login
        backendService.updateUserPresence(user.id).catch(err => 
          console.warn('⚠️ UpdateUserPresence failed:', err)
        );
        backendService.joinHub(user.id).catch(err => 
          console.warn('⚠️ JoinHub failed:', err)
        );
        
        // Aspetta un momento per permettere al server di aggiornare lo stato
        setTimeout(async () => {
          try {
            await backendService.refreshOnlineUsers();
            console.log('🔄 Refreshed online users after join');
          } catch (err) {
            console.warn('⚠️ RefreshOnlineUsers failed:', err);
          }
        }, 1000);
        
        console.log('✅ SignalR methods called');
      } else {
        console.warn('⚠️ SignalR not connected, will retry after login');
        // Riprova dopo la connessione senza bloccare
        setTimeout(async () => {
          if (backendService.isConnected) {
            console.log('🔄 Retrying SignalR methods after delay...');
            backendService.updateUserPresence(user.id).catch(err => 
              console.warn('⚠️ UpdateUserPresence retry failed:', err)
            );
            backendService.joinHub(user.id).catch(err => 
              console.warn('⚠️ JoinHub retry failed:', err)
            );
            
            setTimeout(async () => {
              try {
                await backendService.refreshOnlineUsers();
                console.log('🔄 Refreshed online users after retry');
              } catch (err) {
                console.warn('⚠️ RefreshOnlineUsers retry failed:', err);
              }
            }, 1000);
            
            console.log('✅ SignalR methods retried');
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
      // Migliorare i messaggi di errore per l'utente
      let userFriendlyMessage = error.message;
      
      if (error.message.includes('Target user not found')) {
        userFriendlyMessage = 'Utente non trovato con questo codice';
      } else if (error.message.includes('not available for pairing')) {
        userFriendlyMessage = 'Questo utente è già in una coppia. Vuoi lasciare la tua coppia attuale per unirti a questo utente?';
      } else if (error.message.includes('Cannot create couple with yourself')) {
        userFriendlyMessage = 'Non puoi creare una coppia con te stesso';
      } else if (error.message.includes('Current user not found')) {
        userFriendlyMessage = 'Errore del sistema: utente corrente non trovato';
      }
      
      // Se l'errore è dovuto al fatto che l'utente non è disponibile, 
      // lancia un errore speciale che include l'opzione di switch
      if (error.message.includes('not available for pairing')) {
        const switchError = new Error(userFriendlyMessage);
        switchError.canSwitch = true;
        switchError.targetUserCode = targetUserCode;
        setError(userFriendlyMessage);
        throw switchError;
      }
      
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }
  }, [currentUser]);

  // Lascia la coppia attuale
  const leaveCouple = useCallback(async () => {
    if (!currentUser) {
      throw new Error('Devi essere loggato per lasciare una coppia');
    }

    try {
      await backendService.leaveCouple(currentUser.id);
      setCurrentCouple(null);
      
      // Aggiorna la lista utenti per riflettere i cambiamenti di disponibilità
      refreshOnlineUsers();
      
      console.log('✅ Left couple successfully');
      return true;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  // Cambia coppia (lascia l'attuale e si unisce a una nuova)
  const switchCouple = useCallback(async (targetUserCode) => {
    if (!currentUser) {
      throw new Error('Devi essere loggato per cambiare coppia');
    }

    try {
      // Trova l'utente target per generare il nome della coppia
      const targetUser = await backendService.joinUserByCode(targetUserCode);
      const coupleName = `${currentUser.name} & ${targetUser.name}`;
      
      // Utilizza l'endpoint switch che gestisce automaticamente l'uscita dalla coppia attuale
      const couple = await backendService.switchCouple(currentUser.id, targetUserCode, coupleName);
      setCurrentCouple(couple);
      
      // Aggiorna la lista utenti per riflettere i cambiamenti
      refreshOnlineUsers();
      
      console.log('✅ Switched couple successfully');
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

  // Ottieni tutte le coppie
  const getAllCouples = useCallback(async () => {
    try {
      const couples = await backendService.getAllCouples();
      setAllCouples(couples);
      return couples;
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
      setIsConnected(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Get user state with permissions (centralizes UI logic in backend)
  const getUserState = useCallback(async (userId) => {
    try {
      return await backendService.getUserState(userId);
    } catch (error) {
      console.error('Get user state error:', error);
      throw error;
    }
  }, []);

  // Funzioni admin
  const clearAllUsers = useCallback(async () => {
    try {
      const result = await backendService.clearAllUsers();
      // Refresh degli utenti dopo la cancellazione
      await refreshOnlineUsers();
      return result;
    } catch (error) {
      console.error('Clear users error:', error);
      throw error;
    }
  }, [refreshOnlineUsers]);

  const forceRefreshData = useCallback(async () => {
    try {
      await backendService.forceRefresh();
      // Refresh di tutti i dati
      await refreshOnlineUsers();
      await getAllCouples();
      if (currentUser) {
        const userState = await getUserState(currentUser.id);
        if (userState) {
          setCurrentCouple(userState.currentCouple);
        }
      }
    } catch (error) {
      console.error('Force refresh error:', error);
      throw error;
    }
  }, [refreshOnlineUsers, getAllCouples, getUserState, currentUser]);

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
    allCouples,
    
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
    leaveCouple,
    switchCouple,
    getAllCouples,
    createGameSession,
    sendMessage,
    shareCard,
    getUserState,
    logout,
    
    // Admin functions
    clearAllUsers,
    forceRefreshData
  };
}
