import { useState, useEffect } from 'react';

// Hook avanzato per gestione utenti: coppie, famiglie, single, dual-device
export function useAdvancedMultiUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [gameSession, setGameSession] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState(null); // Per dual-device
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    // Heartbeat per presenza online
    const interval = setInterval(() => {
      updateOnlineStatus();
      checkPartnerStatus();
    }, 15000); // Ogni 15 secondi per dual-device

    return () => clearInterval(interval);
  }, []);

  // Controllo partner status quando allUsers cambia
  useEffect(() => {
    checkPartnerStatus();
  }, [allUsers, currentUser]);

  const loadUsers = () => {
    const savedCurrentUser = localStorage.getItem('complicita_advanced_current_user');
    const savedAllUsers = localStorage.getItem('complicita_advanced_all_users');
    
    if (savedCurrentUser) {
      setCurrentUser(JSON.parse(savedCurrentUser));
    }
    
    if (savedAllUsers) {
      const users = JSON.parse(savedAllUsers);
      setAllUsers(users);
      updateOnlineUsersList(users);
    }
    
    setIsLoading(false);
  };

  const updateOnlineUsersList = (users) => {
    const thirtySecondsAgo = Date.now() - 30 * 1000; // 30 secondi per considerare online
    const online = users.filter(user => 
      user.lastSeen && new Date(user.lastSeen).getTime() > thirtySecondsAgo
    );
    setOnlineUsers(online);
  };

  // Registrazione di una nuova entità (coppia o famiglia)
  const registerEntity = (entityData) => {
    console.log('🆕 Register entity called with data:', entityData); // Debug
    
    const newEntity = {
      ...entityData,
      id: generateUniqueId(),
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
      stats: {
        cardsPlayed: 0,
        sessionsPlayed: 0,
        groupSessions: 0,
        favoriteCategory: null,
        totalTimeSpent: 0
      }
    };

    // Se è dual-device, aggiungi info specifiche
    if (entityData.gameMode === 'dual-device') {
      console.log('🆕 Setting up dual-device entity...'); // Debug
      newEntity.dualDevice = {
        partner1: {
          name: entityData.partner1Name,
          isOnline: entityData.currentPartner === 'partner1',
          lastSeen: new Date().toISOString(),
          deviceId: generateDeviceId()
        },
        partner2: {
          name: entityData.partner2Name,
          isOnline: entityData.currentPartner === 'partner2',
          lastSeen: null,
          deviceId: null
        },
        coupleId: newEntity.id,
        sharedSession: null
      };
      console.log('🆕 Dual-device setup:', newEntity.dualDevice); // Debug
    }

    console.log('🆕 New entity created:', newEntity); // Debug

    const allUsersList = [...allUsers, newEntity];
    setAllUsers(allUsersList);
    setCurrentUser(newEntity);
    
    localStorage.setItem('complicita_advanced_current_user', JSON.stringify(newEntity));
    localStorage.setItem('complicita_advanced_all_users', JSON.stringify(allUsersList));
    
    return newEntity;
  };

  // Login per entità esistenti o partner in dual-device
  const loginEntity = (loginData) => {
    console.log('🔄 Login entity called with data:', loginData); // Debug
    let foundEntity = null;

    if (loginData.isDualDevice && loginData.coupleId) {
      // Login come secondo partner in dual-device
      console.log('🔄 Attempting dual-device login...'); // Debug
      foundEntity = allUsers.find(user => user.id === loginData.coupleId);
      console.log('🔄 Found entity for dual-device:', foundEntity); // Debug
      
      if (foundEntity && foundEntity.dualDevice) {
        const updatedEntity = {
          ...foundEntity,
          lastSeen: new Date().toISOString(),
          isOnline: true
        };

        // Aggiorna info del partner che sta facendo login
        if (loginData.partnerRole === 'partner2') {
          console.log('🔄 Updating partner2 info...'); // Debug
          updatedEntity.dualDevice.partner2 = {
            name: loginData.partnerName,
            isOnline: true,
            lastSeen: new Date().toISOString(),
            deviceId: generateDeviceId()
          };
        } else if (loginData.partnerRole === 'partner1') {
          console.log('🔄 Updating partner1 info...'); // Debug
          updatedEntity.dualDevice.partner1 = {
            ...updatedEntity.dualDevice.partner1,
            isOnline: true,
            lastSeen: new Date().toISOString(),
            deviceId: generateDeviceId()
          };
        }

        console.log('🔄 Updated entity:', updatedEntity); // Debug
        setCurrentUser(updatedEntity);
        localStorage.setItem('complicita_advanced_current_user', JSON.stringify(updatedEntity));
        updateUserInGlobalList(updatedEntity);
        return updatedEntity;
      } else {
        console.log('❌ Dual-device entity not found or invalid'); // Debug
      }
    } else {
      // Login normale per coppia/famiglia
      foundEntity = allUsers.find(user => 
        (user.entityType === loginData.entityType) &&
        (user.nickname === loginData.identifier ||
         user.memberNames?.join('').toLowerCase().includes(loginData.identifier.toLowerCase()))
      );
    }

    if (foundEntity) {
      const updatedEntity = {
        ...foundEntity,
        lastSeen: new Date().toISOString(),
        isOnline: true
      };
      
      setCurrentUser(updatedEntity);
      localStorage.setItem('complicita_advanced_current_user', JSON.stringify(updatedEntity));
      updateUserInGlobalList(updatedEntity);
      return updatedEntity;
    }
    
    return null;
  };

  // Controlla stato del partner (per dual-device)
  const checkPartnerStatus = () => {
    if (currentUser && currentUser.gameMode === 'dual-device' && currentUser.dualDevice) {
      // Cerca l'entità aggiornata nella lista globale
      const updatedEntity = allUsers.find(user => user.id === currentUser.id);
      if (updatedEntity && updatedEntity.dualDevice) {
        const partner1Online = updatedEntity.dualDevice.partner1.isOnline;
        const partner2Online = updatedEntity.dualDevice.partner2.isOnline;
        
        console.log('🔄 Partner status check:', { partner1Online, partner2Online }); // Debug
        
        setPartnerStatus({
          partner1: {
            ...updatedEntity.dualDevice.partner1,
            isOnline: partner1Online
          },
          partner2: {
            ...updatedEntity.dualDevice.partner2,
            isOnline: partner2Online
          },
          bothOnline: partner1Online && partner2Online
        });
        
        // Aggiorna anche currentUser se necessario
        if (JSON.stringify(currentUser.dualDevice) !== JSON.stringify(updatedEntity.dualDevice)) {
          setCurrentUser(updatedEntity);
          localStorage.setItem('complicita_advanced_current_user', JSON.stringify(updatedEntity));
        }
      }
    }
  };

  const logout = () => {
    if (currentUser) {
      let offlineUser = {
        ...currentUser,
        isOnline: false,
        lastSeen: new Date().toISOString()
      };

      // Se è dual-device, marca solo il partner corrente come offline
      if (currentUser.gameMode === 'dual-device' && currentUser.dualDevice) {
        const currentPartnerRole = getCurrentPartnerRole();
        if (currentPartnerRole) {
          offlineUser.dualDevice[currentPartnerRole].isOnline = false;
          offlineUser.dualDevice[currentPartnerRole].lastSeen = new Date().toISOString();
        }
      }

      updateUserInGlobalList(offlineUser);
    }
    
    setCurrentUser(null);
    setGameSession(null);
    setPartnerStatus(null);
    localStorage.removeItem('complicita_advanced_current_user');
  };

  const updateOnlineStatus = () => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        lastSeen: new Date().toISOString(),
        isOnline: true
      };

      // Se è dual-device, aggiorna solo il partner corrente
      if (currentUser.gameMode === 'dual-device' && currentUser.dualDevice) {
        const currentPartnerRole = getCurrentPartnerRole();
        if (currentPartnerRole) {
          updatedUser.dualDevice[currentPartnerRole].lastSeen = new Date().toISOString();
          updatedUser.dualDevice[currentPartnerRole].isOnline = true;
        }
      }

      setCurrentUser(updatedUser);
      localStorage.setItem('complicita_advanced_current_user', JSON.stringify(updatedUser));
      updateUserInGlobalList(updatedUser);
    }
  };

  const updateUserInGlobalList = (updatedUser) => {
    const updatedAllUsers = allUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    setAllUsers(updatedAllUsers);
    localStorage.setItem('complicita_advanced_all_users', JSON.stringify(updatedAllUsers));
    updateOnlineUsersList(updatedAllUsers);
  };

  // Crea sessione di gioco (single, multi-coppia, multi-famiglia)
  const createGameSession = (invitedEntities = [], sessionType = 'multi') => {
    const sessionId = generateUniqueId();
    const newSession = {
      id: sessionId,
      hostId: currentUser.id,
      sessionType, // 'multi-couple', 'multi-family', 'single', 'dual-device'
      entityType: currentUser.entityType, // 'couple' o 'family'
      participants: [currentUser.id, ...invitedEntities],
      createdAt: new Date().toISOString(),
      currentCard: null,
      isActive: true,
      messages: [],
      sharedHistory: [],
      canvas: {
        strokes: [],
        lastUpdate: new Date().toISOString()
      },
      notes: []
    };
    
    setGameSession(newSession);
    localStorage.setItem('complicita_advanced_game_session', JSON.stringify(newSession));
    return newSession;
  };

  const joinGameSession = (sessionId) => {
    const savedSession = localStorage.getItem('complicita_advanced_game_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      if (session.id === sessionId && !session.participants.includes(currentUser.id)) {
        session.participants.push(currentUser.id);
        setGameSession(session);
        localStorage.setItem('complicita_advanced_game_session', JSON.stringify(session));
        return session;
      }
    }
    return null;
  };

  const leaveGameSession = () => {
    if (gameSession) {
      const updatedSession = {
        ...gameSession,
        participants: gameSession.participants.filter(id => id !== currentUser.id)
      };
      
      if (updatedSession.participants.length === 0) {
        localStorage.removeItem('complicita_advanced_game_session');
        setGameSession(null);
      } else {
        setGameSession(updatedSession);
        localStorage.setItem('complicita_advanced_game_session', JSON.stringify(updatedSession));
      }
    }
  };

  const sendMessage = (message) => {
    if (gameSession) {
      const newMessage = {
        id: generateUniqueId(),
        senderId: currentUser.id,
        senderName: currentUser.nickname || getCurrentDisplayName(),
        message,
        timestamp: new Date().toISOString()
      };
      
      const updatedSession = {
        ...gameSession,
        messages: [...gameSession.messages, newMessage]
      };
      
      setGameSession(updatedSession);
      localStorage.setItem('complicita_advanced_game_session', JSON.stringify(updatedSession));
    }
  };

  const shareCard = (card) => {
    if (gameSession) {
      const sharedCard = {
        ...card,
        sharedBy: currentUser.id,
        sharedByName: currentUser.nickname || getCurrentDisplayName(),
        sharedAt: new Date().toISOString()
      };
      
      const updatedSession = {
        ...gameSession,
        sharedHistory: [...gameSession.sharedHistory, sharedCard],
        currentCard: sharedCard
      };
      
      setGameSession(updatedSession);
      localStorage.setItem('complicita_advanced_game_session', JSON.stringify(updatedSession));
    }
  };

  // Funzioni di utilità
  const getCurrentDisplayName = () => {
    if (!currentUser) return '';
    
    if (currentUser.entityType === 'couple') {
      return currentUser.nickname || `${currentUser.memberNames[0]} & ${currentUser.memberNames[1]}`;
    } else if (currentUser.entityType === 'family') {
      return currentUser.nickname || `Famiglia ${currentUser.memberNames[0]}`;
    }
    
    return currentUser.nickname || 'Utente';
  };

  const getCurrentPartnerRole = () => {
    // Determina se l'utente corrente è partner1 o partner2 (per dual-device)
    if (currentUser && currentUser.dualDevice) {
      const deviceId = generateDeviceId(); // Questo dovrebbe essere persistente per dispositivo
      if (currentUser.dualDevice.partner1.deviceId === deviceId) return 'partner1';
      if (currentUser.dualDevice.partner2.deviceId === deviceId) return 'partner2';
    }
    return null;
  };

  const getParticipantNames = () => {
    if (!gameSession) return [];
    return gameSession.participants.map(participantId => {
      const user = allUsers.find(u => u.id === participantId);
      return user ? (user.nickname || getCurrentDisplayName()) : 'Sconosciuto';
    });
  };

  const filterUsersByType = (type) => {
    return allUsers.filter(user => user.entityType === type);
  };

  const filterOnlineUsersByType = (type) => {
    return onlineUsers.filter(user => user.entityType === type);
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const generateDeviceId = () => {
    let deviceId = localStorage.getItem('complicita_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem('complicita_device_id', deviceId);
    }
    return deviceId;
  };

  return {
    // Stato
    currentUser,
    allUsers,
    onlineUsers,
    gameSession,
    partnerStatus,
    isLoading,
    
    // Azioni
    registerEntity,
    loginEntity,
    logout,
    createGameSession,
    joinGameSession,
    leaveGameSession,
    sendMessage,
    shareCard,
    updateOnlineStatus,
    
    // Utilità
    getCurrentDisplayName,
    getParticipantNames,
    filterUsersByType,
    filterOnlineUsersByType,
    checkPartnerStatus
  };
}
