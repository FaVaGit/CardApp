import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class RealBackendService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.currentUser = null;
    this.baseUrl = 'http://localhost:5000'; // ASP.NET Core backend URL
    this.hubUrl = `${this.baseUrl}/gamehub`;
    
    // Event handlers
    this.eventHandlers = new Map();
  }

  // Initialize SignalR connection
  async initialize() {
    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(this.hubUrl)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Setup event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      this.isConnected = true;
      
      console.log('✅ Connected to ASP.NET Core backend');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to backend:', error);
      return false;
    }
  }

  // Setup SignalR event handlers
  setupEventHandlers() {
    // User events
    this.connection.on('UserRegistered', (user) => {
      this.emit('userRegistered', user);
    });

    this.connection.on('RegistrationSuccess', (user) => {
      this.currentUser = user;
      this.emit('registrationSuccess', user);
    });

    this.connection.on('RegistrationError', (error) => {
      this.emit('registrationError', error);
    });

    this.connection.on('UserPresenceUpdated', (user) => {
      this.emit('userPresenceUpdated', user);
    });

    this.connection.on('OnlineUsersUpdate', (users) => {
      this.emit('onlineUsersUpdate', users);
    });

    // Couple events
    this.connection.on('CoupleCreated', (couple) => {
      this.emit('coupleCreated', couple);
    });

    this.connection.on('JoinError', (error) => {
      this.emit('joinError', error);
    });

    // Game session events
    this.connection.on('GameSessionCreated', (session) => {
      this.emit('gameSessionCreated', session);
    });

    this.connection.on('MessageReceived', (message) => {
      this.emit('messageReceived', message);
    });

    this.connection.on('CardShared', (card) => {
      this.emit('cardShared', card);
    });

    // Error handling
    this.connection.on('Error', (error) => {
      console.error('Backend error:', error);
      this.emit('error', error);
    });

    // Connection events
    this.connection.onreconnecting(() => {
      console.log('🔄 Reconnecting to backend...');
      this.isConnected = false;
    });

    this.connection.onreconnected(() => {
      console.log('✅ Reconnected to backend');
      this.isConnected = true;
    });

    this.connection.onclose(() => {
      console.log('🔌 Connection closed');
      this.isConnected = false;
    });
  }

  // Event emitter methods
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, ...args) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // User Management API
  async registerUser(name, gameType, nickname = null) {
    if (!this.isConnected) throw new Error('Not connected to backend');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Registration timeout'));
      }, 10000);

      const onSuccess = (user) => {
        clearTimeout(timeout);
        this.off('registrationSuccess', onSuccess);
        this.off('registrationError', onError);
        resolve(user);
      };

      const onError = (error) => {
        clearTimeout(timeout);
        this.off('registrationSuccess', onSuccess);
        this.off('registrationError', onError);
        reject(new Error(error));
      };

      this.on('registrationSuccess', onSuccess);
      this.on('registrationError', onError);

      this.connection.invoke('RegisterUser', name, gameType, nickname);
    });
  }

  async updateUserPresence(userId) {
    if (!this.isConnected) return;
    await this.connection.invoke('UpdateUserPresence', userId);
  }

  async getOnlineUsers(gameType) {
    if (!this.isConnected) return [];
    
    return new Promise((resolve) => {
      const onUpdate = (users) => {
        this.off('onlineUsersUpdate', onUpdate);
        resolve(users);
      };
      
      this.on('onlineUsersUpdate', onUpdate);
      this.connection.invoke('GetOnlineUsers', gameType);
    });
  }

  // Couple Management API
  async joinUserByCode(currentUserId, targetUserCode) {
    if (!this.isConnected) throw new Error('Not connected to backend');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join timeout'));
      }, 10000);

      const onSuccess = (couple) => {
        clearTimeout(timeout);
        this.off('coupleCreated', onSuccess);
        this.off('joinError', onError);
        resolve(couple);
      };

      const onError = (error) => {
        clearTimeout(timeout);
        this.off('coupleCreated', onSuccess);
        this.off('joinError', onError);
        reject(new Error(error));
      };

      this.on('coupleCreated', onSuccess);
      this.on('joinError', onError);

      this.connection.invoke('JoinUserByCode', currentUserId, targetUserCode);
    });
  }

  // Game Session API
  async createGameSession(coupleId, createdBy) {
    if (!this.isConnected) throw new Error('Not connected to backend');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Session creation timeout'));
      }, 10000);

      const onSuccess = (session) => {
        clearTimeout(timeout);
        this.off('gameSessionCreated', onSuccess);
        resolve(session);
      };

      this.on('gameSessionCreated', onSuccess);
      this.connection.invoke('CreateGameSession', coupleId, createdBy);
    });
  }

  async sendMessage(sessionId, senderId, message) {
    if (!this.isConnected) throw new Error('Not connected to backend');
    await this.connection.invoke('SendMessage', sessionId, senderId, message);
  }

  async shareCard(sessionId, userId, cardData) {
    if (!this.isConnected) throw new Error('Not connected to backend');
    await this.connection.invoke('ShareCard', sessionId, userId, cardData);
  }

  // Utility methods
  getCurrentUser() {
    return this.currentUser;
  }

  isBackendConnected() {
    return this.isConnected;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.isConnected = false;
      this.currentUser = null;
    }
  }

  getStats() {
    return {
      connected: this.isConnected,
      currentUser: this.currentUser?.name || null,
      connectionId: this.connection?.connectionId || null
    };
  }
}

// Export the class for use in hooks
export default RealBackendService;

// Also export class with named export for flexibility
export { RealBackendService };
