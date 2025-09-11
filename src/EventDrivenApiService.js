// Event-Driven API Service for the new RabbitMQ architecture
class EventDrivenApiService {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.userId = null;
        this.connectionId = null;
        this.sessionId = null;
        this.eventHandlers = new Map();
        this.pollingInterval = null;
        this.pollingFrequency = 2000; // Poll every 2 seconds for updates
        this.lastKnownCardCount = 0; // Track number of cards drawn
        this.lastKnownStatus = null;
        this.lastKnownPartner = null; // Track partner information
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
            
            // Update local card count immediately
            this.lastKnownCardCount++;
            
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

    // ==== Join Request Workflow (approval-based pairing) ====
    async requestJoin(targetUserId) {
        if (!this.userId) throw new Error('User not connected');
        return this.apiCall('/request-join', 'POST', {
            requestingUserId: this.userId,
            targetUserId
        });
    }

    async respondJoin(requestId, approve) {
        if (!this.userId) throw new Error('User not connected');
        return this.apiCall('/respond-join', 'POST', {
            requestId,
            targetUserId: this.userId,
            approve
        });
    }

    // Get user status
    async getUserStatus(userId = null) {
        const targetUserId = userId || this.userId;
        if (!targetUserId) {
            throw new Error('No user ID available');
        }

        // The full response is now returned by apiCall
        return this.apiCall(`/user-status/${targetUserId}`);
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
            const response = await this.apiCall(`/user-status/${this.userId}`);
            if (!response.success) return;

            const { status, gameSession, partnerInfo } = response;
            const prevStatus = this.lastKnownStatus; // keep previous before overwriting

            // Couple change detection (works also on first poll after couple formation)
            if (status && status.coupleId) {
                const coupleChanged = !prevStatus || prevStatus.coupleId !== status.coupleId;
                if (coupleChanged) {
                    this.emit('coupleJoined', { coupleId: status.coupleId, partner: partnerInfo });
                }
            }

            // Partner info detection
            if (partnerInfo) {
                const newPartner = !this.lastKnownPartner;
                const partnerChanged = this.lastKnownPartner && this.lastKnownPartner.userId !== partnerInfo.userId;
                if (newPartner || partnerChanged) {
                    this.lastKnownPartner = partnerInfo;
                    this.emit('partnerUpdated', partnerInfo);
                }
            }

            // Game session detection
            if (gameSession && (!prevStatus || !prevStatus.sessionId || prevStatus.sessionId !== gameSession.id)) {
                this.sessionId = gameSession.id;
                this.emit('gameSessionStarted', { sessionId: gameSession.id });
            }

            // Card synchronization
            if (gameSession && gameSession.sharedCards) {
                const currentCardCount = gameSession.sharedCards.length;
                if (currentCardCount > this.lastKnownCardCount) {
                    this.lastKnownCardCount = currentCardCount;
                    const latestSharedCard = gameSession.sharedCards[currentCardCount - 1];
                    if (latestSharedCard && latestSharedCard.cardData) {
                        try {
                            const cardData = JSON.parse(latestSharedCard.cardData);
                            this.emit('sessionUpdated', {
                                type: 'cardDrawn',
                                card: cardData,
                                drawnBy: latestSharedCard.sharedById,
                                timestamp: latestSharedCard.sharedAt
                            });
                        } catch (e) {
                            console.error('Error parsing shared card data:', e);
                        }
                    }
                }
            }

            this.lastKnownStatus = status; // update at end
        } catch (error) {
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
