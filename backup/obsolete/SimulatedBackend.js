// Backend simulato per testing multi-device
// Simula un server reale usando BroadcastChannel API

class SimulatedBackend {
  constructor() {
    this.isEnabled = false;
    this.channel = null;
    this.localData = {
      users: new Map(),
      couples: new Map(),
      sessions: new Map(),
      messages: new Map()
    };
    this.listeners = new Map();
    this.deviceId = this.generateDeviceId();
    this.isConnected = false;
  }

  // Abilita il backend simulato
  enable() {
    try {
      // Verifica supporto BroadcastChannel
      const hasBroadcast = typeof BroadcastChannel !== 'undefined';
      
      if (hasBroadcast) {
        console.log('✅ BroadcastChannel supportato, uso comunicazione real-time');
        // Usa BroadcastChannel per comunicazione cross-tab/window/incognito
        this.channel = new BroadcastChannel('complicita_backend_simulation');
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        // Test del channel
        this.channel.postMessage({ type: 'CONNECTION_TEST', fromDevice: this.deviceId });
      } else {
        console.warn('⚠️ BroadcastChannel non supportato, uso fallback localStorage');
      }
      
      // Fallback con localStorage per compatibilità InPrivate
      this.setupLocalStorageFallback();
      
      this.isEnabled = true;
      this.isConnected = true;
      console.log('🔧 Backend simulato abilitato con device ID:', this.deviceId);
      
      // Esponi globalmente per debug
      if (typeof window !== 'undefined') {
        window.simulatedBackend = this;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Impossibile abilitare backend simulato:', error);
      return false;
    }
  }

  // Setup fallback con localStorage per InPrivate windows
  setupLocalStorageFallback() {
    try {
      // Controlla se localStorage è disponibile
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      
      // Polling ogni 2 secondi per sincronizzare con localStorage
      this.localStorageInterval = setInterval(() => {
        try {
          this.syncWithLocalStorage();
        } catch (error) {
          console.warn('⚠️ Errore sync localStorage:', error);
        }
      }, 2000);
      
      console.log('✅ LocalStorage fallback attivato');
    } catch (error) {
      console.warn('⚠️ LocalStorage non disponibile:', error);
    }
  }

  // Sincronizza dati con localStorage
  syncWithLocalStorage() {
    try {
      const storageKey = 'complicita_shared_data';
      
      // Leggi dati esistenti
      const existingData = localStorage.getItem(storageKey);
      const sharedData = existingData ? JSON.parse(existingData) : { users: {}, couples: {}, sessions: {} };
      
      // Merge users dal localStorage
      Object.values(sharedData.users || {}).forEach(user => {
        if (!this.localData.users.has(user.id)) {
          console.log('📥 Utente importato da localStorage:', user.name);
          this.localData.users.set(user.id, user);
        }
      });
      
      // Merge couples dal localStorage
      Object.values(sharedData.couples || {}).forEach(couple => {
        if (!this.localData.couples.has(couple.id)) {
          console.log('📥 Coppia importata da localStorage:', couple.name);
          this.localData.couples.set(couple.id, couple);
        }
      });
      
      // Scrivi i nostri dati nel localStorage
      const currentUsers = Array.from(this.localData.users.values());
      const currentCouples = Array.from(this.localData.couples.values());
      
      currentUsers.forEach(user => {
        sharedData.users[user.id] = user;
      });
      
      currentCouples.forEach(couple => {
        sharedData.couples[couple.id] = couple;
      });
      
      // Salva nel localStorage
      localStorage.setItem(storageKey, JSON.stringify(sharedData));
      
      console.log('💾 Sync localStorage completato:', {
        users: currentUsers.length,
        couples: currentCouples.length
      });
      
    } catch (error) {
      console.warn('⚠️ Errore sincronizzazione localStorage:', error);
    }
  }

  // Disabilita il backend simulato
  disable() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    if (this.localStorageInterval) {
      clearInterval(this.localStorageInterval);
      this.localStorageInterval = null;
    }
    
    this.isEnabled = false;
    this.isConnected = false;
    console.log('🔧 Backend simulato disabilitato');
  }

  // Simula latenza di rete
  async simulateNetworkDelay(minMs = 50, maxMs = 200) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Registra/aggiorna utente
  async registerUser(userData) {
    if (!this.isEnabled) throw new Error('Backend simulato non abilitato');
    
    await this.simulateNetworkDelay();
    
    const user = {
      ...userData,
      id: userData.id || this.generateId(),
      deviceId: this.deviceId,
      lastSeen: new Date().toISOString(),
      isOnline: true,
      updatedAt: new Date().toISOString()
    };

    // Broadcast a tutti i dispositivi
    this.broadcast({
      type: 'USER_REGISTERED',
      payload: user,
      fromDevice: this.deviceId
    });

    return user;
  }

  // Ottieni tutti gli utenti
  async getUsers(gameType = null) {
    if (!this.isEnabled) throw new Error('Backend simulato non abilitato');
    
    await this.simulateNetworkDelay();
    
    console.log('🔍 Richiesta utenti - gameType:', gameType);
    console.log('🗄️ Utenti locali prima della richiesta:', this.localData.users.size);
    
    // Richiedi dati aggiornati da tutti i dispositivi
    this.broadcast({
      type: 'REQUEST_USERS',
      gameType,
      fromDevice: this.deviceId
    });

    // Aspetta un po' per ricevere risposte
    await new Promise(resolve => setTimeout(resolve, 200)); // Aumentato timeout
    
    const users = Array.from(this.localData.users.values())
      .filter(user => !gameType || user.gameType === gameType)
      .filter(user => {
        // Considera online se visto negli ultimi 60 secondi (uguale al frontend)
        const sixtySecondsAgo = Date.now() - 60 * 1000;
        return new Date(user.lastSeen).getTime() > sixtySecondsAgo;
      });

    console.log('📋 Utenti trovati dopo filtro:', users.length, users.map(u => `${u.name}(${u.personalCode})`));
    return users;
  }

  // Aggiorna presenza utente (heartbeat)
  async updateUserPresence(userId) {
    if (!this.isEnabled) return;
    
    const user = this.localData.users.get(userId);
    if (user) {
      // Aggiorna sempre, indipendentemente dal device
      user.lastSeen = new Date().toISOString();
      user.isOnline = true;
      this.localData.users.set(userId, user);
      
      // Broadcast solo se è il nostro utente
      if (user.deviceId === this.deviceId) {
        this.broadcast({
          type: 'USER_PRESENCE_UPDATE',
          payload: user,
          fromDevice: this.deviceId
        });
        console.log('📡 Broadcasting presence for:', user.name);
      }
    }
  }

  // Crea coppia
  async createCouple(coupleData) {
    if (!this.isEnabled) throw new Error('Backend simulato non abilitato');
    
    await this.simulateNetworkDelay();
    
    const couple = {
      ...coupleData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Memorizza la coppia nei dati locali
    this.localData.couples.set(couple.id, couple);
    
    // Aggiorna lo stato di disponibilità degli utenti nella coppia
    couple.members.forEach(member => {
      const user = this.localData.users.get(member.userId);
      if (user) {
        user.availableForPairing = false;
        user.currentCoupleId = couple.id;
        user.lastSeen = new Date().toISOString(); // Aggiorna last seen
        this.localData.users.set(user.id, user);
        
        console.log('👫 Utente aggiornato per coppia:', user.name, 'disponibile:', user.availableForPairing);
      }
    });

    this.broadcast({
      type: 'COUPLE_CREATED',
      payload: couple,
      fromDevice: this.deviceId
    });
    
    // Forza sync con localStorage
    setTimeout(() => this.syncWithLocalStorage(), 100);

    console.log('💑 Coppia creata e sincronizzata:', couple.name);
    return couple;
  }

  // Ottieni coppie
  async getCouples() {
    if (!this.isEnabled) throw new Error('Backend simulato non abilitato');
    
    await this.simulateNetworkDelay();
    
    this.broadcast({
      type: 'REQUEST_COUPLES',
      fromDevice: this.deviceId
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Array.from(this.localData.couples.values());
  }

  // Crea sessione di gioco
  async createGameSession(sessionData) {
    if (!this.isEnabled) throw new Error('Backend simulato non abilitato');
    
    await this.simulateNetworkDelay();
    
    const session = {
      ...sessionData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.broadcast({
      type: 'GAME_SESSION_CREATED',
      payload: session,
      fromDevice: this.deviceId
    });

    return session;
  }

  // Invia messaggio
  async sendMessage(messageData) {
    if (!this.isEnabled) throw new Error('Backend simulato non abilitato');
    
    await this.simulateNetworkDelay();
    
    const message = {
      ...messageData,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    this.broadcast({
      type: 'MESSAGE_SENT',
      payload: message,
      fromDevice: this.deviceId
    });

    return message;
  }

  // Ascolta eventi
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
  }

  // Rimuovi listener
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  // Gestisci messaggi ricevuti
  handleMessage(data) {
    const { type, payload, fromDevice } = data;
    
    // Non processare i nostri stessi messaggi
    if (fromDevice === this.deviceId) return;

    console.log(`📡 Ricevuto dal backend simulato [${fromDevice}]:`, type, payload?.name || payload?.id);

    switch (type) {
      case 'CONNECTION_TEST':
        // Rispondi al test di connessione
        this.broadcast({
          type: 'CONNECTION_ACK',
          fromDevice: this.deviceId
        });
        break;

      case 'CONNECTION_ACK':
        console.log('✅ Connessione ACK ricevuto da:', fromDevice);
        break;

      case 'USER_REGISTERED':
      case 'USER_PRESENCE_UPDATE':
        if (payload && payload.id) {
          this.localData.users.set(payload.id, payload);
          this.emit('userUpdate', payload);
          console.log('👤 Utente aggiornato:', payload.name, 'Online:', payload.isOnline);
        }
        break;

      case 'COUPLE_CREATED':
        if (payload && payload.id) {
          this.localData.couples.set(payload.id, payload);
          this.emit('coupleCreated', payload);
          console.log('💑 Coppia creata:', payload.name);
        }
        break;

      case 'GAME_SESSION_CREATED':
        if (payload && payload.id) {
          this.localData.sessions.set(payload.id, payload);
          this.emit('sessionCreated', payload);
          console.log('🎮 Sessione creata:', payload.id);
        }
        break;

      case 'MESSAGE_SENT':
        if (payload && payload.sessionId) {
          if (!this.localData.messages.has(payload.sessionId)) {
            this.localData.messages.set(payload.sessionId, []);
          }
          this.localData.messages.get(payload.sessionId).push(payload);
          this.emit('messageReceived', payload);
          console.log('💬 Messaggio ricevuto:', payload.message);
        }
        break;

      case 'REQUEST_USERS':
        // Rispondi con i nostri utenti locali
        this.localData.users.forEach(user => {
          if (user.deviceId === this.deviceId) {
            this.broadcast({
              type: 'USER_REGISTERED',
              payload: user,
              fromDevice: this.deviceId
            });
          }
        });
        break;

      case 'REQUEST_COUPLES':
        // Rispondi con le nostre coppie locali
        this.localData.couples.forEach(couple => {
          this.broadcast({
            type: 'COUPLE_CREATED',
            payload: couple,
            fromDevice: this.deviceId
          });
        });
        break;

      default:
        console.log('🤷 Tipo messaggio sconosciuto:', type);
    }
  }

  // Emetti evento ai listener
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Errore nel listener ${eventType}:`, error);
        }
      });
    }
  }

  // Broadcast messaggio
  broadcast(data) {
    if (this.channel) {
      this.channel.postMessage(data);
    }
    
    // Forza sync con localStorage per InPrivate compatibility
    if (data.type === 'USER_REGISTERED' || data.type === 'USER_UPDATED') {
      setTimeout(() => this.syncWithLocalStorage(), 100);
    }
  }

  // Genera ID unico
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Genera device ID unico
  generateDeviceId() {
    const saved = sessionStorage.getItem('simulated_device_id');
    if (saved) return saved;
    
    const deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    sessionStorage.setItem('simulated_device_id', deviceId);
    return deviceId;
  }

  // Ottieni statistiche
  getStats() {
    return {
      isEnabled: this.isEnabled,
      isConnected: this.isConnected,
      deviceId: this.deviceId,
      users: this.localData.users.size,
      couples: this.localData.couples.size,
      sessions: this.localData.sessions.size,
      totalMessages: Array.from(this.localData.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0)
    };
  }

  // Reset completo
  reset() {
    this.localData = {
      users: new Map(),
      couples: new Map(),
      sessions: new Map(),
      messages: new Map()
    };
    
    this.broadcast({
      type: 'BACKEND_RESET',
      fromDevice: this.deviceId
    });
  }
}

// Istanza singleton
export const simulatedBackend = new SimulatedBackend();
export default simulatedBackend;
