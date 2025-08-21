import { useState, useEffect, useRef } from 'react';
import { 
  ref, 
  set, 
  onValue, 
  push, 
  remove, 
  serverTimestamp,
  off 
} from 'firebase/database';
import { database } from './firebase';

export function useFirebaseMultiUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState({});
  const [userCouples, setUserCouples] = useState({});
  const [gameSession, setGameSession] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState(null);
  
  const heartbeatRef = useRef(null);
  const usersListenerRef = useRef(null);
  const couplesListenerRef = useRef(null);
  const sessionListenerRef = useRef(null);

  // Generate unique user code
  const generateUserCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Initialize user and start heartbeat
  const initializeUser = async (userData) => {
    try {
      const userCode = generateUserCode();
      const user = {
        id: userCode,
        name: userData.name,
        personalCode: userCode,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      // Set user data in Firebase
      await set(ref(database, `users/${userCode}`), user);
      
      setCurrentUser(user);
      startHeartbeat(userCode);
      setupListeners();
      setIsOnline(true);
      setError(null);

      console.log('🔥 Firebase user initialized:', user);
      return user;
    } catch (err) {
      console.error('❌ Error initializing user:', err);
      setError('Errore durante l\'inizializzazione utente');
      throw err;
    }
  };

  // Start heartbeat to maintain online presence
  const startHeartbeat = (userId) => {
    // Clear existing heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    // Update presence every 10 seconds
    heartbeatRef.current = setInterval(async () => {
      try {
        await set(ref(database, `users/${userId}/lastSeen`), serverTimestamp());
        await set(ref(database, `users/${userId}/isOnline`), true);
      } catch (err) {
        console.error('❌ Heartbeat error:', err);
        setError('Errore di connessione');
      }
    }, 10000);

    // Set offline when window closes
    window.addEventListener('beforeunload', () => {
      set(ref(database, `users/${userId}/isOnline`), false);
    });
  };

  // Setup real-time listeners
  const setupListeners = () => {
    // Listen to all users
    const usersRef = ref(database, 'users');
    usersListenerRef.current = onValue(usersRef, (snapshot) => {
      const users = snapshot.val() || {};
      
      // Filter out offline users (older than 30 seconds)
      const now = Date.now();
      const onlineUsers = {};
      
      Object.entries(users).forEach(([id, user]) => {
        if (user.isOnline && user.lastSeen) {
          // Convert Firebase timestamp to milliseconds
          const lastSeenTime = typeof user.lastSeen === 'object' ? 
            Date.now() : user.lastSeen;
          
          if (now - lastSeenTime < 30000) { // 30 seconds threshold
            onlineUsers[id] = user;
          }
        }
      });

      setAllUsers(onlineUsers);
      console.log('🔥 Users updated:', Object.keys(onlineUsers).length, 'online');
    });

    // Listen to couples
    const couplesRef = ref(database, 'couples');
    couplesListenerRef.current = onValue(couplesRef, (snapshot) => {
      const couples = snapshot.val() || {};
      setUserCouples(couples);
      console.log('🔥 Couples updated:', Object.keys(couples).length);
    });
  };

  // Join user by personal code
  const joinUserByCode = async (targetCode) => {
    if (!currentUser) {
      throw new Error('Utente non inizializzato');
    }

    if (targetCode === currentUser.personalCode) {
      throw new Error('Non puoi unirti a te stesso');
    }

    try {
      // Check if target user exists and is online
      const targetUser = allUsers[targetCode];
      if (!targetUser) {
        throw new Error('Utente non trovato o offline');
      }

      // Create couple
      const coupleId = `${currentUser.id}_${targetCode}`;
      const couple = {
        id: coupleId,
        user1: currentUser,
        user2: targetUser,
        createdAt: serverTimestamp(),
        isActive: true
      };

      await set(ref(database, `couples/${coupleId}`), couple);
      
      console.log('🔥 Couple created:', coupleId);
      return couple;
    } catch (err) {
      console.error('❌ Error joining user:', err);
      setError(err.message);
      throw err;
    }
  };

  // Start game session
  const startGameSession = async (coupleId, mode) => {
    try {
      const sessionId = `${coupleId}_${Date.now()}`;
      const session = {
        id: sessionId,
        coupleId,
        mode,
        currentCardIndex: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        chat: {},
        canvas: {
          strokes: []
        }
      };

      await set(ref(database, `sessions/${sessionId}`), session);
      
      // Listen to session updates
      const sessionRef = ref(database, `sessions/${sessionId}`);
      sessionListenerRef.current = onValue(sessionRef, (snapshot) => {
        const sessionData = snapshot.val();
        if (sessionData) {
          setGameSession(sessionData);
        }
      });

      setGameSession(session);
      console.log('🔥 Game session started:', sessionId);
      return session;
    } catch (err) {
      console.error('❌ Error starting session:', err);
      setError('Errore durante l\'avvio della sessione');
      throw err;
    }
  };

  // Update game session
  const updateGameSession = async (updates) => {
    if (!gameSession) return;

    try {
      const sessionRef = ref(database, `sessions/${gameSession.id}`);
      await set(sessionRef, { ...gameSession, ...updates });
    } catch (err) {
      console.error('❌ Error updating session:', err);
    }
  };

  // Send chat message
  const sendChatMessage = async (message) => {
    if (!gameSession || !currentUser) return;

    try {
      const chatRef = ref(database, `sessions/${gameSession.id}/chat`);
      const messageData = {
        text: message,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: serverTimestamp()
      };
      
      await push(chatRef, messageData);
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  };

  // Update canvas
  const updateCanvas = async (strokes) => {
    if (!gameSession) return;

    try {
      const canvasRef = ref(database, `sessions/${gameSession.id}/canvas/strokes`);
      await set(canvasRef, strokes);
    } catch (err) {
      console.error('❌ Error updating canvas:', err);
    }
  };

  // Cleanup function
  const cleanup = async () => {
    try {
      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }

      // Remove listeners
      if (usersListenerRef.current) {
        off(usersListenerRef.current);
      }
      if (couplesListenerRef.current) {
        off(couplesListenerRef.current);
      }
      if (sessionListenerRef.current) {
        off(sessionListenerRef.current);
      }

      // Set user offline
      if (currentUser) {
        await set(ref(database, `users/${currentUser.id}/isOnline`), false);
      }

      setIsOnline(false);
      setCurrentUser(null);
      setAllUsers({});
      setUserCouples({});
      setGameSession(null);
    } catch (err) {
      console.error('❌ Cleanup error:', err);
    }
  };

  // Get current user's couple
  const getCurrentCouple = () => {
    if (!currentUser) return null;
    
    return Object.values(userCouples).find(couple => 
      couple.user1?.id === currentUser.id || 
      couple.user2?.id === currentUser.id
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return {
    // State
    currentUser,
    allUsers,
    userCouples,
    gameSession,
    isOnline,
    error,
    
    // Actions
    initializeUser,
    joinUserByCode,
    startGameSession,
    updateGameSession,
    sendChatMessage,
    updateCanvas,
    getCurrentCouple,
    cleanup,
    
    // Utils
    generateUserCode
  };
}
