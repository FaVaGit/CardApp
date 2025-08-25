import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const BASE_URL = 'http://localhost:5000';

export function useUnifiedBackend() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Game state
  const [currentCouple, setCurrentCouple] = useState(null);
  const [allCouples, setAllCouples] = useState([]);
  const [gameSession, setGameSession] = useState(null);
  const [availablePartners, setAvailablePartners] = useState([]);
  
  // SignalR connection
  const connectionRef = useRef(null);

  // Initialize connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Check if backend is available
        const healthResponse = await fetch(`${BASE_URL}/api/health`);
        if (!healthResponse.ok) {
          throw new Error('Backend not available');
        }

        // Create SignalR connection
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${BASE_URL}/gamehub`)
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Information)
          .build();

        // Setup event handlers
        setupSignalRHandlers(connection);

        // Start connection
        await connection.start();
        connectionRef.current = connection;
        
        setIsConnected(true);
        setIsConnecting(false);
        
        console.log('✅ Connected to backend');
        
        // Load initial data
        await loadOnlineUsers();
        await loadAllCouples();
        
      } catch (err) {
        console.error('❌ Connection failed:', err);
        setError(err.message);
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const setupSignalRHandlers = (connection) => {
    connection.on('UserJoined', (user) => {
      console.log('👤 User joined:', user);
      setOnlineUsers(prev => {
        if (!prev.find(u => u.id === user.id)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    connection.on('UserLeft', (userId) => {
      console.log('👋 User left:', userId);
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
    });

    connection.on('CoupleCreated', (couple) => {
      console.log('💑 Couple created:', couple);
      setAllCouples(prev => [...prev, couple]);
    });

    connection.on('CoupleUpdated', (couple) => {
      console.log('💑 Couple updated:', couple);
      setAllCouples(prev => prev.map(c => c.id === couple.id ? couple : c));
      if (currentCouple && currentCouple.id === couple.id) {
        setCurrentCouple(couple);
      }
    });

    connection.on('GameSessionStarted', (session) => {
      console.log('🎮 Game session started:', session);
      setGameSession(session);
    });

    connection.on('DataRefreshed', () => {
      console.log('🔄 Data refresh requested');
      loadOnlineUsers();
      loadAllCouples();
      if (currentUser) {
        loadUserState(currentUser.id);
      }
    });

    connection.onreconnected(() => {
      console.log('🔄 Reconnected to backend');
      setIsConnected(true);
      setError(null);
    });

    connection.onreconnecting(() => {
      console.log('🔄 Reconnecting to backend...');
      setIsConnected(false);
    });

    connection.onclose(() => {
      console.log('❌ Disconnected from backend');
      setIsConnected(false);
    });
  };

  // API calls
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`API call failed: ${endpoint}`, err);
      throw err;
    }
  };

  // User management
  const createOrUpdateUser = async (userData) => {
    try {
      const user = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      setCurrentUser(user);
      await loadUserState(user.id);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loadUserState = async (userId) => {
    try {
      const state = await apiCall(`/api/users/${userId}/state`);
      
      setCurrentUser(state.user);
      setCurrentCouple(state.currentCouple);
      setAvailablePartners(state.availablePartners);
      
      return state;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const users = await apiCall('/api/users');
      setOnlineUsers(users);
      return users;
    } catch (err) {
      console.error('Failed to load online users:', err);
    }
  };

  // Couple management
  const createCouple = async (partnerName, gameType = 'Single') => {
    try {
      if (!currentUser) throw new Error('No current user');
      
      const couple = await apiCall('/api/game/create-couple', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: currentUser.id,
          partnerName,
          gameType
        })
      });
      
      setCurrentCouple(couple);
      await loadAllCouples();
      return couple;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const joinCouple = async (coupleId) => {
    try {
      if (!currentUser) throw new Error('No current user');
      
      const couple = await apiCall('/api/game/join-couple', {
        method: 'POST',
        body: JSON.stringify({
          coupleId,
          userId: currentUser.id
        })
      });
      
      setCurrentCouple(couple);
      return couple;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const leaveCouple = async () => {
    try {
      if (!currentUser || !currentCouple) return;
      
      await apiCall('/api/game/leave-couple', {
        method: 'POST',
        body: JSON.stringify({
          coupleId: currentCouple.id,
          userId: currentUser.id
        })
      });
      
      setCurrentCouple(null);
      await loadAllCouples();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loadAllCouples = async () => {
    try {
      const couples = await apiCall('/api/game/couples');
      setAllCouples(couples);
      return couples;
    } catch (err) {
      console.error('Failed to load couples:', err);
    }
  };

  // Game session management
  const startGameSession = async (sessionType = 'Standard') => {
    try {
      if (!currentCouple) throw new Error('No current couple');
      
      const session = await apiCall('/api/game/start-session', {
        method: 'POST',
        body: JSON.stringify({
          coupleId: currentCouple.id,
          sessionType
        })
      });
      
      setGameSession(session);
      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const endGameSession = async () => {
    try {
      if (!gameSession) return;
      
      await apiCall(`/api/game/sessions/${gameSession.id}/end`, {
        method: 'POST'
      });
      
      setGameSession(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getActiveSessions = async () => {
    try {
      return await apiCall('/api/game/active-sessions');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Admin functions
  const clearAllUsers = async () => {
    try {
      await apiCall('/api/admin/clear-users', {
        method: 'POST'
      });
      
      // Reset local state
      setCurrentUser(null);
      setCurrentCouple(null);
      setGameSession(null);
      setOnlineUsers([]);
      setAllCouples([]);
      setAvailablePartners([]);
      
      console.log('✅ All users cleared');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const forceRefreshData = async () => {
    try {
      await apiCall('/api/admin/force-refresh', {
        method: 'POST'
      });
      
      // Reload all data
      await loadOnlineUsers();
      await loadAllCouples();
      
      if (currentUser) {
        await loadUserState(currentUser.id);
      }
      
      console.log('✅ Data refreshed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Debug functions
  const getDebugInfo = () => {
    return {
      isConnected,
      isConnecting,
      error,
      currentUser,
      currentCouple,
      gameSession,
      onlineUsersCount: onlineUsers.length,
      couplesCount: allCouples.length,
      availablePartnersCount: availablePartners.length
    };
  };

  const syncData = async () => {
    try {
      await loadOnlineUsers();
      await loadAllCouples();
      if (currentUser) {
        await loadUserState(currentUser.id);
      }
      console.log('🔄 Data synchronized');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // User state
    currentUser,
    onlineUsers,
    
    // Game state
    currentCouple,
    allCouples,
    gameSession,
    availablePartners,
    
    // User actions
    createOrUpdateUser,
    loadUserState,
    
    // Couple actions
    createCouple,
    joinCouple,
    leaveCouple,
    
    // Game session actions
    startGameSession,
    endGameSession,
    getActiveSessions,
    
    // Admin actions
    clearAllUsers,
    forceRefreshData,
    
    // Debug actions
    getDebugInfo,
    syncData
  };
}
