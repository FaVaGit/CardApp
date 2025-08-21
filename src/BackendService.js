// Servizio per comunicazione con backend ASP.NET Core
import * as signalR from '@microsoft/signalr';

class BackendService {
  constructor() {
    this.baseUrl = 'http://localhost:5000/api';
    this.connection = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
  }

  // Verifica se il backend è disponibile
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  // Inizializza la connessione SignalR
  async initialize() {
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.baseUrl.replace('/api', '')}/gamehub`)
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Gestione riconnessione
      this.connection.onreconnecting((error) => {
        console.log('🔄 SignalR reconnecting...', error);
        this.isConnected = false;
      });

      this.connection.onreconnected((connectionId) => {
        console.log('✅ SignalR reconnected:', connectionId);
        this.isConnected = true;
      });

      this.connection.onclose((error) => {
        console.log('❌ SignalR connection closed:', error);
        this.isConnected = false;
      });

      // Event handlers
      this.connection.on('UserJoined', (user) => {
        console.log('📥 UserJoined event:', user);
        this.emit('userJoined', user);
      });

      this.connection.on('UserLeft', (userId) => {
        console.log('📤 UserLeft event:', userId);
        this.emit('userLeft', userId);
      });

      this.connection.on('UserPresenceUpdated', (users) => {
        console.log('👥 UserPresenceUpdated event:', users);
        this.emit('userPresenceUpdated', users);
      });

      this.connection.on('CoupleCreated', (couple) => {
        console.log('💑 CoupleCreated event:', couple);
        this.emit('coupleCreated', couple);
      });

      this.connection.on('MessageReceived', (message) => {
        this.emit('messageReceived', message);
      });

      this.connection.on('GameSessionUpdated', (session) => {
        this.emit('gameSessionUpdated', session);
      });

      this.connection.on('CardShared', (card) => {
        this.emit('cardShared', card);
      });

      await this.connection.start();
      this.isConnected = true;
      console.log('✅ Connected to SignalR hub');
      
      return true;
    } catch (error) {
      console.error('❌ SignalR connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Event emitter pattern
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

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => handler(data));
    }
  }

  // Verifica e ristabilisce la connessione se necessario
  async ensureConnection() {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.log('🔄 Connection not ready, attempting to reconnect...');
      return await this.initialize();
    }
    
    // Aggiorna il flag isConnected se la connessione è attiva
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      this.isConnected = true;
    }
    
    return true;
  }

  // Chiude la connessione
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log('🔌 SignalR connection closed');
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }

  // API Calls
  async registerUser(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async loginUser(credentials) {
    try {
      const response = await fetch(`${this.baseUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalCode: credentials.personalCode })
      });
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      const response = await fetch(`${this.baseUrl}/users`);
      if (!response.ok) {
        throw new Error(`Failed to get users: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  async joinUserByCode(code) {
    try {
      const response = await fetch(`${this.baseUrl}/users/join/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Join failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Join error:', error);
      throw error;
    }
  }

  async createCouple(coupleData) {
    try {
      const response = await fetch(`${this.baseUrl}/game/couples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupleData)
      });
      
      if (!response.ok) {
        throw new Error(`Couple creation failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create couple error:', error);
      throw error;
    }
  }

  // Nuovo metodo per creare una coppia tramite codice
  async createCoupleByCode(currentUserId, targetUserCode, coupleName) {
    try {
      const coupleData = {
        currentUserId: currentUserId,
        targetUserCode: targetUserCode,
        name: coupleName
      };

      const response = await fetch(`${this.baseUrl}/game/couples/by-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupleData)
      });
      
      if (!response.ok) {
        throw new Error(`Couple creation by code failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create couple by code error:', error);
      throw error;
    }
  }

  async getCoupleById(coupleId) {
    try {
      const response = await fetch(`${this.baseUrl}/game/couples/${coupleId}`);
      
      if (!response.ok) {
        throw new Error(`Get couple failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get couple error:', error);
      throw error;
    }
  }

  async createGameSession(sessionData) {
    try {
      const response = await fetch(`${this.baseUrl}/game/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  async sendMessage(message) {
    try {
      if (this.isConnected) {
        await this.connection.invoke('SendMessage', message);
      } else {
        throw new Error('Not connected to SignalR hub');
      }
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async shareCard(card) {
    try {
      if (this.isConnected) {
        await this.connection.invoke('ShareCard', card);
      } else {
        throw new Error('Not connected to SignalR hub');
      }
    } catch (error) {
      console.error('Share card error:', error);
      throw error;
    }
  }

  // Metodi SignalR per aggiornare presenza e notificare coppie
  async updateUserPresence(userId) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        console.log('👤 Updating user presence for:', userId, 'Connection state:', this.connection?.state);
        await this.connection.invoke('UpdateUserPresence', userId);
        console.log('✅ Successfully updated user presence for:', userId);
      } else {
        throw new Error('Cannot connect to SignalR hub - isConnected is false');
      }
    } catch (error) {
      console.error('❌ Update user presence error:', error);
      throw error;
    }
  }

  async notifyCoupleCreated(couple) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        console.log('💑 Notifying couple created:', couple);
        await this.connection.invoke('NotifyCoupleCreated', couple);
      } else {
        throw new Error('Cannot connect to SignalR hub');
      }
    } catch (error) {
      console.error('Notify couple created error:', error);
      throw error;
    }
  }

  async joinHub(userId) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        console.log('🔗 Joining hub for user:', userId, 'Connection state:', this.connection?.state);
        await this.connection.invoke('JoinHub', userId);
        console.log('✅ Successfully joined hub for user:', userId);
      } else {
        throw new Error('Cannot connect to SignalR hub - isConnected is false');
      }
    } catch (error) {
      console.error('❌ Join hub error:', error);
      throw error;
    }
  }

  async refreshOnlineUsers() {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        console.log('🔄 Refreshing online users...');
        await this.connection.invoke('RefreshOnlineUsers');
      } else {
        throw new Error('Cannot connect to SignalR hub');
      }
    } catch (error) {
      console.error('Refresh online users error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.stop();
        this.isConnected = false;
        console.log('Disconnected from SignalR hub');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }
}

// Singleton instance
export const backendService = new BackendService();
export default BackendService;
