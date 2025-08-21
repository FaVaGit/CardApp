import { useState, useEffect, useCallback, useRef } from 'react';
import { RealBackendService } from './RealBackendService';

export function useRealBackend(currentUser, setCurrentUser) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharedCards, setSharedCards] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  
  const backendRef = useRef(null);
  const eventHandlersRef = useRef(new Map());

  // Initialize backend service
  const initializeBackend = useCallback(async () => {
    if (backendRef.current || isConnecting) {
      console.log('⚠️ Backend already initialized or connecting');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      console.log('🚀 Initializing real backend...');
      
      backendRef.current = new RealBackendService();
      const connected = await backendRef.current.initialize();
      
      if (connected) {
        setIsConnected(true);
        console.log('✅ Real backend connected successfully');
        
        // Setup event listeners
        setupEventListeners();
        
        // Auto re-register user if we have one
        if (currentUser) {
          console.log('🔄 Re-registering current user after connection');
          await registerUser(currentUser.name, currentUser.gameType, currentUser.nickname);
        }
      } else {
        throw new Error('Failed to connect to backend');
      }
    } catch (error) {
      console.error('❌ Failed to initialize real backend:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [currentUser, isConnecting]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (!backendRef.current) return;

    const backend = backendRef.current;

    // User events
    backend.on('registrationSuccess', (user) => {
      console.log('👤 User registered successfully:', user);
      setCurrentUser(user);
      // Request online users after registration
      backend.getOnlineUsers(user.gameType);
    });

    backend.on('registrationError', (error) => {
      console.error('❌ Registration error:', error);
      setConnectionError(error);
    });

    backend.on('onlineUsersUpdate', (users) => {
      console.log('👥 Online users updated:', users);
      setOnlineUsers(users);
    });

    backend.on('userPresenceUpdated', (user) => {
      console.log('🟢 User presence updated:', user);
      setOnlineUsers(prev => {
        const updated = prev.map(u => u.id === user.id ? user : u);
        if (!updated.find(u => u.id === user.id)) {
          updated.push(user);
        }
        return updated.filter(u => u.isOnline);
      });
    });

    // Couple events
    backend.on('coupleCreated', (couple) => {
      console.log('💑 Couple created:', couple);
      setPartnerStatus({
        coupled: true,
        partner: couple.partner,
        coupleId: couple.id,
        createdAt: couple.createdAt
      });
    });

    backend.on('joinError', (error) => {
      console.error('❌ Join error:', error);
      setConnectionError(error);
    });

    // Game session events
    backend.on('gameSessionCreated', (session) => {
      console.log('🎮 Game session created:', session);
      setGameSession(session);
    });

    backend.on('messageReceived', (message) => {
      console.log('💬 Message received:', message);
      setMessages(prev => [...prev, message]);
    });

    backend.on('cardShared', (card) => {
      console.log('🃏 Card shared:', card);
      setSharedCards(prev => [...prev, card]);
    });

    backend.on('error', (error) => {
      console.error('❌ Backend error:', error);
      setConnectionError(error);
    });

    // Store references for cleanup
    eventHandlersRef.current.set('registrationSuccess', backend.on.bind(backend));
  }, [setCurrentUser]);

  // Register user
  const registerUser = useCallback(async (name, gameType, nickname = null) => {
    if (!backendRef.current || !isConnected) {
      throw new Error('Backend not connected');
    }

    console.log('📝 Registering user:', { name, gameType, nickname });
    await backendRef.current.registerUser(name, gameType, nickname);
  }, [isConnected]);

  // Join partner by code
  const joinPartnerByCode = useCallback(async (partnerCode) => {
    if (!backendRef.current || !currentUser) {
      throw new Error('Backend not connected or user not registered');
    }

    console.log('🤝 Joining partner by code:', partnerCode);
    await backendRef.current.joinUserByCode(currentUser.id, partnerCode);
  }, [currentUser]);

  // Create game session
  const createGameSession = useCallback(async () => {
    if (!backendRef.current || !currentUser || !partnerStatus?.coupleId) {
      throw new Error('Cannot create session: missing requirements');
    }

    console.log('🎮 Creating game session for couple:', partnerStatus.coupleId);
    await backendRef.current.createGameSession(partnerStatus.coupleId, currentUser.gameType);
  }, [currentUser, partnerStatus]);

  // Send message
  const sendMessage = useCallback(async (content) => {
    if (!backendRef.current || !gameSession) {
      throw new Error('Cannot send message: no active session');
    }

    await backendRef.current.sendMessage(gameSession.id, currentUser.id, content);
  }, [currentUser, gameSession]);

  // Share card
  const shareCard = useCallback(async (cardData) => {
    if (!backendRef.current || !gameSession) {
      throw new Error('Cannot share card: no active session');
    }

    await backendRef.current.shareCard(gameSession.id, currentUser.id, cardData);
  }, [currentUser, gameSession]);

  // Get online users
  const refreshOnlineUsers = useCallback(async () => {
    if (!backendRef.current || !currentUser) {
      return;
    }

    await backendRef.current.getOnlineUsers(currentUser.gameType);
  }, [currentUser]);

  // Update presence (heartbeat)
  const updatePresence = useCallback(async () => {
    if (!backendRef.current || !currentUser) {
      return;
    }

    await backendRef.current.updateUserPresence(currentUser.id);
  }, [currentUser]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (backendRef.current) {
      console.log('🧹 Cleaning up real backend connection');
      backendRef.current.disconnect();
      backendRef.current = null;
    }
    
    setIsConnected(false);
    setOnlineUsers([]);
    setPartnerStatus(null);
    setGameSession(null);
    setMessages([]);
    setSharedCards([]);
    setConnectionError(null);
  }, []);

  // Auto-heartbeat
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    const interval = setInterval(updatePresence, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isConnected, currentUser, updatePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    
    // Data state
    onlineUsers,
    partnerStatus,
    gameSession,
    messages,
    sharedCards,
    
    // Actions
    initializeBackend,
    registerUser,
    joinPartnerByCode,
    createGameSession,
    sendMessage,
    shareCard,
    refreshOnlineUsers,
    updatePresence,
    cleanup,
    
    // Backend reference (for advanced usage)
    backend: backendRef.current
  };
}
