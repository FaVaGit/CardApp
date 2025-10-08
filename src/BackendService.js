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

      // Event handlers per messaggi
      this.connection.on('UserJoined', (user) => {
        this.emit('userJoined', user);
      });

      this.connection.on('UserLeft', (userId) => {
        this.emit('userLeft', userId);
      });

      this.connection.on('CoupleCreated', (couple) => {
        this.emit('coupleCreated', couple);
      });

      this.connection.on('MessageReceived', (message) => {
        this.emit('messageReceived', message);
      });

      this.connection.on('CardShared', (card) => {
        this.emit('cardShared', card);
      });

      // Event handlers per la lavagna condivisa
      this.connection.on('DrawingStrokeAdded', (stroke) => {
        this.emit('drawingStrokeAdded', stroke);
      });

      this.connection.on('DrawingNoteAdded', (note) => {
        this.emit('drawingNoteAdded', note);
      });

      this.connection.on('DrawingCleared', (sessionId) => {
        this.emit('drawingCleared', sessionId);
      });

      this.connection.on('DrawingUndoRedo', (data) => {
        this.emit('drawingUndoRedo', data);
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
    if (!this.isConnected) {
      console.log('🔄 Reconnecting to SignalR...');
      await this.initialize();
    }
  }

  // API Calls per utenti
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
      const response = await fetch(`${this.baseUrl}/couples/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupleData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create couple: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create couple error:', error);
      throw error;
    }
  }

  async getCoupleById(coupleId) {
    try {
      const response = await fetch(`${this.baseUrl}/couples/${coupleId}`);
      if (!response.ok) {
        throw new Error(`Failed to get couple: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get couple error:', error);
      throw error;
    }
  }

  async createCoupleByCode(userId, targetUserCode, coupleName) {
    try {
      const response = await fetch(`${this.baseUrl}/couples/create-by-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          targetUserCode,
          coupleName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create couple by code: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create couple by code error:', error);
      throw error;
    }
  }

  async createGameSession(sessionData) {
    try {
      const response = await fetch(`${this.baseUrl}/gamesessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create game session: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create game session error:', error);
      throw error;
    }
  }

  // API Calls per lavagna condivisa
  async addDrawingStroke(sessionId, strokeData) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('AddDrawingStroke', sessionId, strokeData);
      } else {
        throw new Error('SignalR connection not available');
      }
    } catch (error) {
      console.error('Add drawing stroke error:', error);
      throw error;
    }
  }

  async addDrawingNote(sessionId, noteData) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('AddDrawingNote', sessionId, noteData);
      } else {
        throw new Error('SignalR connection not available');
      }
    } catch (error) {
      console.error('Add drawing note error:', error);
      throw error;
    }
  }

  async clearDrawing(sessionId) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('ClearDrawing', sessionId);
      } else {
        throw new Error('SignalR connection not available');
      }
    } catch (error) {
      console.error('Clear drawing error:', error);
      throw error;
    }
  }

  async undoDrawing(sessionId) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('UndoDrawing', sessionId);
      } else {
        throw new Error('SignalR connection not available');
      }
    } catch (error) {
      console.error('Undo drawing error:', error);
      throw error;
    }
  }

  async redoDrawing(sessionId) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('RedoDrawing', sessionId);
      } else {
        throw new Error('SignalR connection not available');
      }
    } catch (error) {
      console.error('Redo drawing error:', error);
      throw error;
    }
  }

  async getDrawingData(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/drawing/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to get drawing data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get drawing data error:', error);
      throw error;
    }
  }

  // SignalR methods
  async updateUserPresence(userId) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('UpdateUserPresence', userId);
      }
    } catch (error) {
      console.error('Update user presence error:', error);
      throw error;
    }
  }

  async joinHub(userId) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('JoinHub', userId);
      }
    } catch (error) {
      console.error('Join hub error:', error);
      throw error;
    }
  }

  async notifyCoupleCreated(couple) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('NotifyCoupleCreated', couple);
      }
    } catch (error) {
      console.error('Notify couple created error:', error);
      throw error;
    }
  }

  async sendMessage(message) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('SendMessage', message);
      } else {
        throw new Error('SignalR connection not available');
      }
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async shareCard(cardData) {
    try {
      await this.ensureConnection();
      if (this.isConnected) {
        await this.connection.invoke('ShareCard', cardData);
      } else {
        throw new Error('SignalR connection not available');
      }
    } catch (error) {
      console.error('Share card error:', error);
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