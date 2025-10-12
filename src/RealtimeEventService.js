// Real-time Event Service for WebSocket communication with SignalR backend
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class RealtimeEventService {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.connection = null;
        this.eventHandlers = new Map();
        this.isConnected = false;
        this.userId = null;
    }

    // Initialize SignalR connection
    async initialize() {
        if (this.connection) {
            console.log('⚠️ SignalR connection already exists');
            return this.isConnected;
        }

        try {
            console.log('🚀 Initializing SignalR connection...');
            
            this.connection = new HubConnectionBuilder()
                .withUrl(`${this.baseUrl}/gamehub`)
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Information)
                .build();

            // Setup automatic reconnection
            this.connection.onreconnecting(() => {
                console.log('🔄 SignalR reconnecting...');
                this.isConnected = false;
            });

            this.connection.onreconnected(() => {
                console.log('✅ SignalR reconnected');
                this.isConnected = true;
                this.emit('reconnected');
            });

            this.connection.onclose(() => {
                console.log('❌ SignalR connection closed');
                this.isConnected = false;
                this.emit('disconnected');
            });

            await this.connection.start();
            this.isConnected = true;
            console.log('✅ SignalR connected successfully');

            this.setupEventHandlers();
            return true;
        } catch (error) {
            console.error('❌ SignalR connection failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    // Setup SignalR event handlers
    setupEventHandlers() {
        if (!this.connection) return;

        // Couple events
        this.connection.on('CoupleCreated', (couple) => {
            console.log('💑 Couple created event received:', couple);
            this.emit('coupleCreated', couple);
        });

        this.connection.on('CoupleJoined', (data) => {
            console.log('🤝 Someone joined couple:', data);
            this.emit('coupleJoined', data);
        });

        // Game session events
        this.connection.on('GameSessionCreated', (session) => {
            console.log('🎮 Game session created:', session);
            this.emit('gameSessionCreated', session);
        });

        this.connection.on('GameSessionStarted', (session) => {
            console.log('🎮 Game session started:', session);
            this.emit('gameSessionStarted', session);
        });

        // Card events
        this.connection.on('CardDrawn', (cardData) => {
            console.log('🎴 Card drawn event:', cardData);
            this.emit('cardDrawn', cardData);
        });

        // Message events
        this.connection.on('MessageReceived', (message) => {
            console.log('💬 Message received:', message);
            this.emit('messageReceived', message);
        });

        // Error events
        this.connection.on('JoinError', (error) => {
            console.error('❌ Join error:', error);
            this.emit('joinError', error);
        });

        this.connection.on('SessionError', (error) => {
            console.error('❌ Session error:', error);
            this.emit('sessionError', error);
        });

        console.log('🎧 SignalR event handlers setup complete');
    }

    // Join hub for real-time updates
    async joinHub(userId) {
        if (!this.connection || !this.isConnected) {
            throw new Error('SignalR not connected');
        }

        try {
            this.userId = userId;
            await this.connection.invoke('JoinHub', userId);
            console.log('✅ Joined SignalR hub for user:', userId);
        } catch (error) {
            console.error('❌ Failed to join hub:', error);
            throw error;
        }
    }

    // Join couple group for couple-specific events
    async joinCoupleGroup(coupleId) {
        if (!this.connection || !this.isConnected) {
            throw new Error('SignalR not connected');
        }

        try {
            await this.connection.invoke('JoinCoupleGroup', coupleId);
            console.log('✅ Joined couple group:', coupleId);
        } catch (error) {
            console.error('❌ Failed to join couple group:', error);
            throw error;
        }
    }

    // Notify couple creation
    async notifyCoupleCreated(couple) {
        if (!this.connection || !this.isConnected) {
            console.warn('⚠️ SignalR not connected, skipping couple notification');
            return;
        }

        try {
            await this.connection.invoke('NotifyCoupleCreated', couple);
            console.log('✅ Couple creation notified via SignalR');
        } catch (error) {
            console.error('❌ Failed to notify couple creation:', error);
            throw error;
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

    emit(event, ...args) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(...args);
                } catch (error) {
                    console.error(`❌ Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // Disconnect
    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.stop();
                console.log('✅ SignalR disconnected');
            } catch (error) {
                console.error('❌ Error disconnecting SignalR:', error);
            }
            this.connection = null;
            this.isConnected = false;
            this.userId = null;
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            userId: this.userId,
            connectionState: this.connection?.state
        };
    }
}

export default RealtimeEventService;
