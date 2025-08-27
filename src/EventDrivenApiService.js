// Event-Driven API Service for the new RabbitMQ architecture
class EventDrivenApiService {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.userId = null;
        this.connectionId = null;
        this.eventHandlers = new Map();
        this.pollingInterval = null;
        this.pollingFrequency = 2000; // Poll every 2 seconds for updates
    }

    // Generate unique IDs
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // API call helper
    async apiCall(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}/api/EventDrivenGame${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API call failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    // Connect user to the system with name and game type
    async connectUser(name, gameType = 'Coppia') {
        const response = await this.apiCall('/connect', 'POST', {
            Name: name,
            GameType: gameType
        });

        if (response.success && response.status) {
            this.userId = response.status.userId;
            this.connectionId = response.status.connectionId;
            console.log('✅ User connected:', response.status);
            
            // Start polling for events (RabbitMQ events will be processed by backend)
            this.startEventPolling();
            
            // Return the full response including personalCode
            return {
                ...response.status,
                personalCode: response.personalCode
            };
        } else {
            throw new Error('Failed to connect user');
        }
    }

    // Disconnect user
    async disconnectUser() {
        if (!this.connectionId) return;

        // Stop polling
        this.stopEventPolling();

        const response = await this.apiCall('/disconnect', 'POST', {
            connectionId: this.connectionId
        });

        if (response.success) {
            console.log('✅ User disconnected');
            this.userId = null;
            this.connectionId = null;
        }
    }

    // Join or create a couple
    async joinCouple(userCode) {
        if (!this.userId) {
            throw new Error('User not connected. Call connectUser() first.');
        }

        const response = await this.apiCall('/join-couple', 'POST', {
            userId: this.userId,
            userCode: userCode
        });

        if (response.success) {
            console.log('✅ Joined couple:', response.couple);
            
            // The backend will publish RabbitMQ events for couple creation
            // Our polling mechanism will detect these changes
            
            // Check if game auto-started
            if (response.gameSession) {
                console.log('🎮 Game auto-started:', response.gameSession);
            }
            
            return response;
        } else {
            throw new Error('Failed to join couple');
        }
    }

    // Start a game session
    async startGame(coupleId) {
        const response = await this.apiCall('/start-game', 'POST', {
            coupleId: coupleId
        });

        if (response.success) {
            console.log('🎮 Game started:', response.gameSession);
            return response.gameSession;
        } else {
            throw new Error('Failed to start game');
        }
    }

    // Draw a card
    async drawCard(sessionId) {
        if (!this.userId) {
            throw new Error('User not connected. Call connectUser() first.');
        }

        const response = await this.apiCall('/draw-card', 'POST', {
            sessionId: sessionId,
            userId: this.userId
        });

        if (response.success) {
            console.log('🎴 Card drawn:', response.card);
            return response.card;
        } else {
            throw new Error('Failed to draw card');
        }
    }

    // End game session
    async endGame(sessionId) {
        const response = await this.apiCall('/end-game', 'POST', {
            sessionId: sessionId
        });

        return response.success;
    }

    // Get user status
    async getUserStatus(userId = null) {
        const targetUserId = userId || this.userId;
        if (!targetUserId) {
            throw new Error('No user ID available');
        }

        const response = await this.apiCall(`/user-status/${targetUserId}`);
        
        if (response.success) {
            return response.status;
        } else {
            throw new Error('Failed to get user status');
        }
    }

    // Get current user info
    getCurrentUser() {
        return {
            userId: this.userId,
            connectionId: this.connectionId
        };
    }

    // Start polling for events (simulates RabbitMQ event consumption)
    startEventPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.pollingInterval = setInterval(async () => {
            try {
                await this.pollForUpdates();
            } catch (error) {
                console.error('❌ Error polling for updates:', error);
            }
        }, this.pollingFrequency);

        console.log('🔄 Started event polling for RabbitMQ updates');
    }

    // Stop polling
    stopEventPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('⏹️ Stopped event polling');
        }
    }

    // Poll for updates (this represents consuming RabbitMQ events)
    async pollForUpdates() {
        if (!this.userId) return;

        try {
            const status = await this.getUserStatus();
            
            // Check if user status has changed (couple formation, game session, etc.)
            if (status && this.lastKnownStatus) {
                // Check for couple changes
                if (status.coupleId !== this.lastKnownStatus.coupleId && status.coupleId) {
                    this.emit('coupleJoined', { coupleId: status.coupleId });
                }

                // Check for game session changes
                if (status.sessionId !== this.lastKnownStatus.sessionId && status.sessionId) {
                    this.emit('gameSessionStarted', { sessionId: status.sessionId });
                }
            }

            this.lastKnownStatus = status;
        } catch (error) {
            // Silently handle polling errors to avoid spam
            if (error.message !== 'Failed to get user status') {
                console.warn('⚠️ Polling error:', error);
            }
        }
    }

    // Event emitter methods for the API service
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

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: !!this.userId,
            userId: this.userId,
            isPolling: !!this.pollingInterval
        };
    }
}

export default EventDrivenApiService;
