import { useState, useEffect, useCallback } from 'react';
import { simulatedBackend } from './SimulatedBackend';

// Hook per gestione multi-utente con backend simulato
export function useSimulatedBackendMultiUser(currentUser, setCurrentUser) {
  // currentUser e setCurrentUser sono ora gestiti da App.jsx
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentCouple, setCurrentCouple] = useState(null);
  const [allCouples, setAllCouples] = useState([]);
  const [gameSession, setGameSession] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendEnabled, setIsBackendEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Rimuoviamo l'inizializzazione automatica da qui
  // useEffect(() => { ... });

  // Inizializza il backend simulato (ora chiamata da App.jsx)
  const initializeBackend = useCallback(async () => {
    if (isBackendEnabled) {
      console.log('Backend già inizializzato.');
      return;
    }

    console.log('🚀 Inizializzazione del backend simulato richiesta...');
    setIsLoading(true);
    try {
      const enabled = simulatedBackend.enable();
      if (enabled) {
        setIsBackendEnabled(true);
        setConnectionStatus('connected');
        
        // Setup listeners per eventi del backend
        setupBackendListeners();
        
        // Carica dati iniziali
        await loadInitialData();
        
        console.log('✅ Backend simulato inizializzato');
      } else {
        setConnectionStatus('error');
        console.log('❌ Impossibile inizializzare backend simulato');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('❌ Errore inizializzazione backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isBackendEnabled, setupBackendListeners, loadInitialData]); // include helpers for exhaustive deps

  // NOTE: Hook dependencies per initializeBackend limitate a isBackendEnabled (currentUser non necessario perché non usato internamente),
  // eventuali listener aggiornano state tramite funzioni set* sicure.

  // Setup listeners per eventi del backend
  const setupBackendListeners = useCallback(() => {
    simulatedBackend.on('userUpdate', (user) => {
      console.log('📱 Aggiornamento utente ricevuto:', user.name);
      setAllUsers(prev => {
        const filtered = prev.filter(u => u.id !== user.id);
        const updated = [...filtered, user];
        updateOnlineUsers(updated);
        return updated;
      });
    });

  simulatedBackend.on('coupleCreated', (couple) => {
      console.log('💑 Nuova coppia creata:', couple.name);
      setAllCouples(prev => {
        const filtered = prev.filter(c => c.id !== couple.id);
        return [...filtered, couple];
      });
      
      // Se sono coinvolto in questa coppia, aggiornala come corrente
      if (currentUser && couple.members.some(m => m.userId === currentUser.id)) {
        console.log('👫 Sono parte di questa coppia, aggiorno currentCouple');
        setCurrentCouple(couple);
        
        // Forza refresh degli utenti per aggiornare stato partner
        setTimeout(async () => {
          try {
            const users = await simulatedBackend.getUsers();
            setAllUsers(users);
            updateOnlineUsers(users);
            updatePartnerStatus(users);
            console.log('✅ Stato utenti aggiornato dopo evento coppia');
          } catch (error) {
            console.error('❌ Errore refresh utenti dopo evento coppia:', error);
          }
        }, 200);
      }
    });

  simulatedBackend.on('sessionCreated', (session) => {
      console.log('🎮 Nuova sessione di gioco:', session.id);
      if (currentCouple && session.coupleId === currentCouple.id) {
        setGameSession(session);
      }
    });

    simulatedBackend.on('messageReceived', (message) => {
      console.log('💬 Nuovo messaggio ricevuto:', message.message);
      // Aggiorna sessione di gioco con nuovo messaggio
      if (gameSession && message.sessionId === gameSession.id) {
        setGameSession(prev => ({
          ...prev,
          messages: [...(prev.messages || []), message]
        }));
      }
    });
  }, [currentUser, gameSession, currentCouple, updateOnlineUsers, updatePartnerStatus]);

  // Carica dati iniziali
  const loadInitialData = useCallback(async () => {
    try {
      // Carica utenti
      const users = await simulatedBackend.getUsers();
      setAllUsers(users);
      updateOnlineUsers(users);

      // Carica coppie
      const couples = await simulatedBackend.getCouples();
      setAllCouples(couples);

      console.log('📊 Dati iniziali caricati:', { users: users.length, couples: couples.length });
    } catch (error) {
      console.error('❌ Errore caricamento dati iniziali:', error);
    }
  }, [updateOnlineUsers]);

  // Registra nuovo utente
  const registerUser = async (userData) => {
    if (!isBackendEnabled) {
      throw new Error('Backend simulato non disponibile');
    }

    try {
      setConnectionStatus('syncing');
      
      console.log('🆕 Registrando utente:', userData.name);
      
      const newUser = {
        id: generateUniqueId(),
        name: userData.name.trim(),
        nickname: userData.nickname?.trim() || null,
        gameType: userData.gameType,
        personalCode: generateJoinCode(),
        availableForPairing: true,
        stats: {
          cardsPlayed: 0,
          sessionsPlayed: 0,
          totalTimeSpent: 0
        }
      };

      const registeredUser = await simulatedBackend.registerUser(newUser);
      
      // Aggiorna immediatamente lo stato in App.jsx
      console.log('🔄 Chiamando setCurrentUser dal hook con:', registeredUser);
      setCurrentUser(registeredUser);
      
      // Forza aggiornamento immediato della lista utenti, rimuovendo il setTimeout
      // Questo garantisce che lo stato sia consistente prima del re-render
      console.log('🔄 Aggiornamento sincrono della lista utenti dopo registrazione...');
      try {
        const users = await simulatedBackend.getUsers();
        setAllUsers(users);
        updateOnlineUsers(users);
        console.log('✅ Lista utenti aggiornata:', users.length);
      } catch (error) {
        console.error('❌ Errore aggiornamento lista utenti post-registrazione:', error);
      }
      
      // Avvia heartbeat per mantenere presenza online
      const cleanup = startHeartbeat(registeredUser.id);
      
      // Store cleanup function
      window.heartbeatCleanup = cleanup;
      
      setConnectionStatus('connected');
      console.log('✅ Utente registrato con successo:', registeredUser);
      
      return registeredUser;
    } catch (error) {
      setConnectionStatus('error');
      console.error('❌ Errore registrazione utente:', error);
      throw error;
    }
  };

  // Login utente esistente
  const loginUser = async (userData) => {
    if (!isBackendEnabled) {
      throw new Error('Backend simulato non disponibile');
    }

    try {
      setConnectionStatus('syncing');
      
      // Cerca utente esistente
      const users = await simulatedBackend.getUsers(userData.gameType);
      const foundUser = users.find(user => 
        user.name.toLowerCase() === userData.name.toLowerCase() ||
        (user.nickname && user.nickname.toLowerCase() === userData.name.toLowerCase())
      );

      if (foundUser) {
        // Aggiorna presenza
        await simulatedBackend.updateUserPresence(foundUser.id);
        setCurrentUser(foundUser); // Usa la funzione passata da App.jsx
        startHeartbeat(foundUser.id);
        setConnectionStatus('connected');
        console.log('✅ Login effettuato:', foundUser);
        return { user: foundUser, couple: null };
      } else {
        setConnectionStatus('connected');
        console.log('❌ Utente non trovato');
        return null;
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('❌ Errore login:', error);
      throw error;
    }
  };

  // Debug: Logga quando currentUser cambia
  useEffect(() => {
    if (currentUser) {
      console.log('훅 내부 currentUser 업데이트됨:', currentUser.name);
    }
  }, [currentUser]);

  // Join utente tramite codice
  const joinUserByCode = async (userCode) => {
    if (!currentUser || !isBackendEnabled) return null;

    try {
      setConnectionStatus('syncing');
      
      console.log('🤝 Tentativo join con codice:', userCode);
      console.log('🤝 Utente corrente:', currentUser.name, currentUser.gameType);
      
      // Cerca utente target
      const users = await simulatedBackend.getUsers(currentUser.gameType);
      console.log('🔍 Utenti ricevuti dal backend:', users.length);
      console.log('🔍 Lista utenti:', users.map(u => `${u.name}(${u.personalCode}) - available: ${u.availableForPairing}`));
      
      const targetUser = users.find(user => 
        user.personalCode?.toLowerCase() === userCode.toLowerCase() && 
        user.id !== currentUser.id &&
        user.availableForPairing
      );

      console.log('🎯 Utente target trovato:', targetUser ? `${targetUser.name}(${targetUser.personalCode})` : 'NESSUNO');

      if (!targetUser) {
        setConnectionStatus('connected');
        console.log('❌ Utente non trovato con codice:', userCode);
        console.log('❌ Dettaglio ricerca - Codice cercato:', userCode.toLowerCase());
        console.log('❌ Codici disponibili:', users.map(u => u.personalCode?.toLowerCase()).filter(Boolean));
        return null;
      }

      // Crea coppia
      const coupleData = {
        name: `${currentUser.name} & ${targetUser.name}`,
        createdBy: currentUser.id,
        members: [
          {
            userId: currentUser.id,
            name: currentUser.name,
            role: 'creator',
            joinedAt: new Date().toISOString()
          },
          {
            userId: targetUser.id,
            name: targetUser.name,
            role: 'member',
            joinedAt: new Date().toISOString()
          }
        ],
        gameType: currentUser.gameType,
        isActive: true
      };

      const newCouple = await simulatedBackend.createCouple(coupleData);
      setCurrentCouple(newCouple);
      
      // Forza aggiornamento immediato della lista utenti e stato partner
      console.log('🔄 Aggiornamento utenti e partner status dopo creazione coppia...');
      try {
        const updatedUsers = await simulatedBackend.getUsers(currentUser.gameType);
        setAllUsers(updatedUsers);
        updateOnlineUsers(updatedUsers);
        
        // Aggiorna immediatamente lo stato del partner
        setTimeout(() => {
          updatePartnerStatus(updatedUsers);
        }, 100);
        
        console.log('✅ Status partner aggiornato dopo creazione coppia');
      } catch (error) {
        console.error('❌ Errore aggiornamento post-coppia:', error);
      }
      
      setConnectionStatus('connected');
      console.log('✅ Coppia creata:', newCouple);
      
      return newCouple;
    } catch (error) {
      setConnectionStatus('error');
      console.error('❌ Errore join utente:', error);
      return null;
    }
  };

  // Crea sessione di gioco
  const createGameSession = async (sessionType = 'couple') => {
    if (!currentCouple || !isBackendEnabled) return null;

    try {
      setConnectionStatus('syncing');
      
      const sessionData = {
        coupleId: currentCouple.id,
        sessionType,
        createdBy: currentUser.id,
        currentCard: null,
        isActive: true,
        messages: [],
        sharedHistory: [],
        canvas: {
          strokes: [],
          notes: []
        },
        participants: {
          [currentUser.id]: {
            userId: currentUser.id,
            name: currentUser.name,
            joinedAt: new Date().toISOString(),
            isActive: true
          }
        }
      };

      const newSession = await simulatedBackend.createGameSession(sessionData);
      setGameSession(newSession);
      
      setConnectionStatus('connected');
      console.log('🎮 Sessione creata:', newSession);
      
      return newSession;
    } catch (error) {
      setConnectionStatus('error');
      console.error('❌ Errore creazione sessione:', error);
      return null;
    }
  };

  // Invia messaggio
  const sendMessage = async (message) => {
    if (!gameSession || !isBackendEnabled) return;

    try {
      const messageData = {
        sessionId: gameSession.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        message: message,
        type: 'text'
      };

      await simulatedBackend.sendMessage(messageData);
      console.log('💬 Messaggio inviato:', message);
    } catch (error) {
      console.error('❌ Errore invio messaggio:', error);
    }
  };

  // Condividi carta
  const shareCard = async (card) => {
    if (!gameSession || !isBackendEnabled) return;

    try {
      const messageData = {
        sessionId: gameSession.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        message: `Ha condiviso una carta: ${card.content}`,
        type: 'card_share',
        cardData: {
          ...card,
          sharedBy: currentUser.id,
          sharedByName: currentUser.name,
          sharedAt: new Date().toISOString()
        }
      };

      await simulatedBackend.sendMessage(messageData);
      
      // Aggiorna sessione locale
      setGameSession(prev => ({
        ...prev,
        currentCard: messageData.cardData,
        sharedHistory: [...(prev.sharedHistory || []), messageData.cardData]
      }));
      
      console.log('🃏 Carta condivisa:', card.content);
    } catch (error) {
      console.error('❌ Errore condivisione carta:', error);
    }
  };

  // Avvia heartbeat per presenza online
  const startHeartbeat = (userId) => {
    // Clear any existing heartbeat
    if (window.heartbeatInterval) {
      clearInterval(window.heartbeatInterval);
    }
    
    window.heartbeatInterval = setInterval(async () => {
      if (isBackendEnabled && userId && currentUser && currentUser.id === userId) {
        try {
          await simulatedBackend.updateUserPresence(userId);
          console.log('💓 Heartbeat sent for:', userId);
        } catch (error) {
          console.error('❌ Errore heartbeat:', error);
        }
      }
    }, 3000); // Ogni 3 secondi

    // Cleanup al unmount
    return () => {
      if (window.heartbeatInterval) {
        clearInterval(window.heartbeatInterval);
        window.heartbeatInterval = null;
      }
    };
  };

  // Aggiorna lista utenti online (memoized)
  const updateOnlineUsers = useCallback((users = allUsers) => {
    const sixtySecondsAgo = Date.now() - 60 * 1000; // Aumentato a 60 secondi
    const online = users.filter(user => 
      user.lastSeen && new Date(user.lastSeen).getTime() > sixtySecondsAgo
    );
    setOnlineUsers(online);
    
    console.log('🔄 Online users updated:', {
      total: users.length,
      online: online.length,
      userNames: online.map(u => u.name)
    });
    
    // Aggiorna stato partner se in coppia
    if (currentCouple) {
      updatePartnerStatus(online);
    }
  }, [allUsers, currentCouple, updatePartnerStatus]);

  // Aggiorna stato partner (memoized)
  const updatePartnerStatus = useCallback((onlineUsersList = onlineUsers) => {
    if (!currentCouple || !currentUser) return;

    console.log('🔄 Aggiornamento stato partner per coppia:', currentCouple.name);

    const partner = currentCouple.members.find(m => m.userId !== currentUser.id);
    const currentMember = currentCouple.members.find(m => m.userId === currentUser.id);
    
    if (partner) {
      const partnerUser = onlineUsersList.find(u => u.id === partner.userId);
      const partnerOnline = !!partnerUser;
      
      console.log('👥 Partner trovato:', partner.name, 'Online:', partnerOnline);
      
      setPartnerStatus({
        currentUser: currentMember,
        partner: {
          ...partner,
          isOnline: partnerOnline,
          lastSeen: partnerUser?.lastSeen
        },
        bothOnline: partnerOnline // L'utente corrente è sempre online
      });
      
      console.log('✅ Partner status aggiornato:', {
        partner: partner.name,
        isOnline: partnerOnline,
        bothOnline: partnerOnline
      });
    } else {
      console.warn('⚠️ Partner non trovato nella coppia');
    }
  }, [currentCouple, currentUser, onlineUsers]);

  // Logout
  const logout = () => {
    // Clear heartbeat
    if (window.heartbeatInterval) {
      clearInterval(window.heartbeatInterval);
      window.heartbeatInterval = null;
    }
    
    setCurrentUser(null); // Usa la funzione passata da App.jsx
    setCurrentCouple(null);
    setGameSession(null);
    setPartnerStatus(null);
    console.log('👋 Logout effettuato');
  };

  // Lascia coppia
  const leaveCouple = () => {
    setCurrentCouple(null);
    setPartnerStatus(null);
    console.log('💔 Coppia abbandonata');
  };

  // Refresh dati
  const refreshData = async () => {
    if (!isBackendEnabled) return;
    
    try {
      await loadInitialData();
    } catch (error) {
      console.error('❌ Errore refresh dati:', error);
    }
  };

  // Utilità
  // Helper to generate a cryptographically secure random string
  const secureRandomString = (length = 16) => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    // Convert to base36 for compactness
    return Array.from(array, b => b.toString(36).padStart(2, '0')).join('');
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + secureRandomString(8);
  };

  const generateJoinCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    // Securely pick 3 random letters
    const letterArray = new Uint8Array(3);
    window.crypto.getRandomValues(letterArray);
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(letterArray[i] % letters.length);
    }
    // Securely pick 3 random numbers
    const numberArray = new Uint8Array(3);
    window.crypto.getRandomValues(numberArray);
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(numberArray[i] % numbers.length);
    }
    return code;
  };

  // Aggiorna utenti online ogni 10 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      updateOnlineUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, [updateOnlineUsers]);

  return {
    // Stato
    currentUser,
    allUsers,
    onlineUsers,
    currentCouple,
    allCouples,
    gameSession,
    partnerStatus,
    isLoading,
    
    // Stato backend
    isBackendEnabled,
    connectionStatus,
    backendStats: simulatedBackend.getStats(),
    
    // Azioni
    initializeBackend, // Esponiamo la funzione di inizializzazione
    registerUser,
    loginUser,
    joinUserByCode,
    leaveCouple, // Aggiungi leaveCouple
    createGameSession,
    sendMessage,
    shareCard,
    logout,
    refreshData,
    
    // Utilità
    updateOnlineUsers,
    updatePartnerStatus
  };
}
