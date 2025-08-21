import { useState, useEffect } from 'react';

// Simulazione di un backend con localStorage per gestire multiple coppie
// In una versione reale, questo userebbe WebSockets e un database

export function useMultiUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [gameSession, setGameSession] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    // Simula la presenza online con un heartbeat
    const interval = setInterval(() => {
      updateOnlineStatus();
    }, 30000); // Aggiorna ogni 30 secondi

    return () => clearInterval(interval);
  }, []);

  const loadUsers = () => {
    const savedCurrentUser = localStorage.getItem('complicita_current_user');
    const savedAllUsers = localStorage.getItem('complicita_all_users');
    
    if (savedCurrentUser) {
      setCurrentUser(JSON.parse(savedCurrentUser));
    }
    
    if (savedAllUsers) {
      const users = JSON.parse(savedAllUsers);
      setAllUsers(users);
      // Filtra gli utenti online (attivi negli ultimi 5 minuti)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const online = users.filter(user => 
        user.lastSeen && new Date(user.lastSeen).getTime() > fiveMinutesAgo
      );
      setOnlineUsers(online);
    }
    
    setIsLoading(false);
  };

  const registerCouple = (coupleData) => {
    const newCouple = {
      ...coupleData,
      id: generateUniqueId(),
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
      stats: {
        cardsPlayed: 0,
        sessionsPlayed: 0,
        groupSessions: 0,
        favoriteCategory: null
      }
    };

    // Aggiorna la lista di tutti gli utenti
    const allUsersList = [...allUsers, newCouple];
    setAllUsers(allUsersList);
    setCurrentUser(newCouple);
    
    // Salva nei localStorage
    localStorage.setItem('complicita_current_user', JSON.stringify(newCouple));
    localStorage.setItem('complicita_all_users', JSON.stringify(allUsersList));
    
    return newCouple;
  };

  const loginCouple = (loginData) => {
    // Cerca l'utente esistente per nick di coppia o nomi
    const existingUser = allUsers.find(user => 
      user.coupleNickname === loginData.coupleNickname ||
      (user.partnerName1 === loginData.partnerName1 && user.partnerName2 === loginData.partnerName2)
    );

    if (existingUser) {
      const updatedUser = {
        ...existingUser,
        lastSeen: new Date().toISOString(),
        isOnline: true
      };
      
      setCurrentUser(updatedUser);
      localStorage.setItem('complicita_current_user', JSON.stringify(updatedUser));
      
      // Aggiorna nella lista globale
      updateUserInGlobalList(updatedUser);
      return updatedUser;
    }
    
    return null;
  };

  const logout = () => {
    if (currentUser) {
      const offlineUser = {
        ...currentUser,
        isOnline: false,
        lastSeen: new Date().toISOString()
      };
      updateUserInGlobalList(offlineUser);
    }
    
    setCurrentUser(null);
    setGameSession(null);
    localStorage.removeItem('complicita_current_user');
  };

  const updateOnlineStatus = () => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        lastSeen: new Date().toISOString(),
        isOnline: true
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('complicita_current_user', JSON.stringify(updatedUser));
      updateUserInGlobalList(updatedUser);
    }
  };

  const updateUserInGlobalList = (updatedUser) => {
    const updatedAllUsers = allUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    setAllUsers(updatedAllUsers);
    localStorage.setItem('complicita_all_users', JSON.stringify(updatedAllUsers));
  };

  const createGameSession = (invitedCouples = []) => {
    const sessionId = generateUniqueId();
    const newSession = {
      id: sessionId,
      hostId: currentUser.id,
      participants: [currentUser.id, ...invitedCouples],
      createdAt: new Date().toISOString(),
      currentCard: null,
      isActive: true,
      messages: [],
      sharedHistory: []
    };
    
    setGameSession(newSession);
    localStorage.setItem('complicita_game_session', JSON.stringify(newSession));
    return newSession;
  };

  const joinGameSession = (sessionId) => {
    // In una app reale, questo farebbe una chiamata API
    const savedSession = localStorage.getItem('complicita_game_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      if (session.id === sessionId && !session.participants.includes(currentUser.id)) {
        session.participants.push(currentUser.id);
        setGameSession(session);
        localStorage.setItem('complicita_game_session', JSON.stringify(session));
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
        // Se non ci sono più partecipanti, elimina la sessione
        localStorage.removeItem('complicita_game_session');
        setGameSession(null);
      } else {
        setGameSession(updatedSession);
        localStorage.setItem('complicita_game_session', JSON.stringify(updatedSession));
      }
    }
  };

  const sendMessage = (message) => {
    if (gameSession) {
      const newMessage = {
        id: generateUniqueId(),
        senderId: currentUser.id,
        senderName: currentUser.coupleNickname || `${currentUser.partnerName1} & ${currentUser.partnerName2}`,
        message,
        timestamp: new Date().toISOString()
      };
      
      const updatedSession = {
        ...gameSession,
        messages: [...gameSession.messages, newMessage]
      };
      
      setGameSession(updatedSession);
      localStorage.setItem('complicita_game_session', JSON.stringify(updatedSession));
    }
  };

  const shareCard = (card) => {
    if (gameSession) {
      const sharedCard = {
        ...card,
        sharedBy: currentUser.id,
        sharedByName: currentUser.coupleNickname || `${currentUser.partnerName1} & ${currentUser.partnerName2}`,
        sharedAt: new Date().toISOString()
      };
      
      const updatedSession = {
        ...gameSession,
        sharedHistory: [...gameSession.sharedHistory, sharedCard],
        currentCard: sharedCard
      };
      
      setGameSession(updatedSession);
      localStorage.setItem('complicita_game_session', JSON.stringify(updatedSession));
    }
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const getParticipantNames = () => {
    if (!gameSession) return [];
    return gameSession.participants.map(participantId => {
      const user = allUsers.find(u => u.id === participantId);
      return user ? (user.coupleNickname || `${user.partnerName1} & ${user.partnerName2}`) : 'Sconosciuto';
    });
  };

  return {
    currentUser,
    allUsers,
    onlineUsers,
    gameSession,
    isLoading,
    registerCouple,
    loginCouple,
    logout,
    createGameSession,
    joinGameSession,
    leaveGameSession,
    sendMessage,
    shareCard,
    getParticipantNames,
    updateOnlineStatus
  };
}
