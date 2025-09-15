// Event-Driven API Service for the new RabbitMQ architecture
class EventDrivenApiService {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.userId = null;
        this.connectionId = null;
        this.sessionId = null;
    this.authToken = null; // store auth token for logout / reconnect
        this.eventHandlers = new Map();
        this.pollingInterval = null;
        this.pollingFrequency = 2000; // Poll every 2 seconds for updates
        this.lastKnownCardCount = 0; // Track number of cards drawn
        this.lastKnownStatus = null;
        this.lastKnownPartner = null; // Track partner information
    this.joinRequestCache = { incoming: [], outgoing: [] };
    this.lastUsersSnapshot = [];
    // Configurable TTL (ms) for optimistic join requests that never get confirmed by backend
    this.optimisticJoinTTL = 30000; // 30s default
    this.prunedJoinCount = 0; // metrics counter
    }

    // Generate unique IDs
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // API call helper
    async apiCall(endpoint, method = 'GET', body = null, options = {}) {
        const { suppressErrorLog = false } = options;
        const url = `${this.baseUrl}/api/EventDrivenGame${endpoint}`;
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, fetchOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            if (!suppressErrorLog) {
                console.error(`API call failed: ${method} ${endpoint}`, error);
            }
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
            this.authToken = response.authToken || null;
            console.log('✅ User connected:', response.status);
            
            // Debug connection response data
            console.log('📋 Connect response:', {
                userId: response.status.userId,
                personalCode: response.personalCode,
                name: name
            });
            
            // Start polling for events (RabbitMQ events will be processed by backend)
            this.startEventPolling();
            // Seed initial users & requests immediately
            try {
                const merged = await this.listUsersWithRequests();
                if (merged.success) {
                    this.lastUsersSnapshot = merged.users || [];
                    this.joinRequestCache = { incoming: merged.incoming || [], outgoing: merged.outgoing || [] };
                    this.emit('usersUpdated', { users: merged.users || [], inbound: merged.incoming || [], outbound: merged.outgoing || [], incoming: merged.incoming || [], outgoing: merged.outgoing || [] });
                    this.emit('joinRequestsUpdated', this.joinRequestCache);
                }
            } catch { /* ignore seed errors */ }
            
            // Return the full response including personalCode
            return {
                ...response.status,
                personalCode: response.personalCode,
                authToken: response.authToken
            };
        } else {
            throw new Error('Failed to connect user');
        }
    }

    async reconnect(userId, authToken) {
        try {
            const response = await this.apiCall('/reconnect', 'POST', { userId, authToken }, { suppressErrorLog: true });
            if (response.success && response.status) {
                this.userId = response.status.userId;
                this.connectionId = response.status.connectionId;
                this.authToken = response.authToken || authToken || null;
                this.startEventPolling();
                return {
                    ...response.status,
                    personalCode: response.personalCode,
                    authToken: response.authToken
                };
            }
            return { success: false };
        } catch (e) {
            if (e.message && e.message.includes('Token o utente non valido')) {
                return { success: false, invalidToken: true };
            }
            throw e;
        }
    }

    // Graceful disconnect without clearing auth token (used for component unmount or reset)
    async disconnectUser() {
        if (!this.connectionId) {
            // Nothing to do
            return;
        }
        try {
            await this.apiCall('/disconnect', 'POST', { connectionId: this.connectionId });
            console.log('👤 Disconnected user connectionId=', this.connectionId);
        } catch (e) {
            // Non-fatal – we still clear local state
            console.warn('Disconnect warning:', e.message);
        } finally {
            this.stopEventPolling();
            this.connectionId = null;
            this.userId = null;
            this.sessionId = null;
            this.lastKnownStatus = null;
            this.lastKnownPartner = null;
            this.lastKnownCardCount = 0;
        }
    }

    async listAvailableUsers() {
        if (!this.userId) throw new Error('User not connected');
        return this.apiCall(`/available-users/${this.userId}`);
    }

    async listJoinRequests() {
        if (!this.userId) throw new Error('User not connected');
        return this.apiCall(`/join-requests/${this.userId}`);
    }
    
    async listUsersWithRequests() {
        if (!this.userId) throw new Error('User not connected');
    const usersResp = await this.listAvailableUsers();
    const reqResp = await this.listJoinRequests();
    return { ...usersResp, ...reqResp };
    }

    async logout(authToken) {
        if (!this.userId) return;
        try {
            const token = authToken || this.authToken;
            if (!token) throw new Error('No auth token available');
            await this.apiCall('/logout', 'POST', { userId: this.userId, authToken: token });
        } catch (e) {
            console.warn('Logout warning:', e.message);
        } finally {
            this.stopEventPolling();
            this.userId = null;
            this.connectionId = null;
            this.sessionId = null;
            this.authToken = null;
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
        const response = await this.apiCall('/start-game', 'POST', { coupleId });
        if (response.success) {
            console.log('🎮 Game started:', response.gameSession);
            return response.gameSession;
        }
        throw new Error('Failed to start game');
    }

    async endGame(sessionId) {
        const response = await this.apiCall('/end-game', 'POST', {
            sessionId: sessionId
        });

        return response.success;
    }

    // ==== Join Request Workflow (approval-based pairing) ====
    setOptimisticJoinTTL(ms) {
        if (typeof ms === 'number' && ms >= 0) this.optimisticJoinTTL = ms;
    }

    getMetrics() {
        return { prunedJoinCount: this.prunedJoinCount, optimisticJoinTTL: this.optimisticJoinTTL };
    }
    async requestJoin(targetUserId) {
        if (!this.userId) throw new Error('User not connected');
    if (targetUserId === this.userId) throw new Error('Non puoi inviarti una richiesta');
        // Pre-add an optimistic placeholder so UI reacts instantly.
        // We'll replace the temporary requestId once server responds.
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const optimisticRecord = { requestId: tempId, requestingUserId: this.userId, targetUserId, createdAt: new Date().toISOString(), _optimistic: true };
        this.joinRequestCache.outgoing = [...this.joinRequestCache.outgoing, optimisticRecord];
        this.emit('joinRequestsUpdated', this.joinRequestCache);
        try {
            const resp = await this.apiCall('/request-join', 'POST', {
                requestingUserId: this.userId,
                targetUserId
            });
            if (resp && resp.requestId) {
                // Replace temp record with real one, keep optimistic flag until snapshot confirms
                this.joinRequestCache.outgoing = this.joinRequestCache.outgoing.map(r => r.requestId === tempId ? { ...r, requestId: resp.requestId } : r);
                this.emit('joinRequestsUpdated', this.joinRequestCache);
            } else {
                // No requestId returned: keep optimistic placeholder; backend may be delayed.
                // Will be pruned by TTL if never confirmed.
                if (!resp || !resp.success) {
                    // Defensive: if outright failure semantic without throwing, rollback.
                    this.joinRequestCache.outgoing = this.joinRequestCache.outgoing.filter(r => r.requestId !== tempId);
                    this.emit('joinRequestsUpdated', this.joinRequestCache);
                }
            }
            return resp;
        } catch (e) {
            // Rollback optimistic record on failure
            this.joinRequestCache.outgoing = this.joinRequestCache.outgoing.filter(r => r.requestId !== tempId);
            this.emit('joinRequestsUpdated', this.joinRequestCache);
            throw e;
        }
    }

    async respondJoin(requestId, approve) {
        if (!this.userId) throw new Error('User not connected');
        const resp = await this.apiCall('/respond-join', 'POST', {
            requestId,
            targetUserId: this.userId,
            approve
        });
        // Optimistic: remove from incoming cache
        this.joinRequestCache.incoming = this.joinRequestCache.incoming.filter(r => (r.requestId||r.RequestId) !== requestId);
        // If approved, clear outgoing too (pair formed) and trigger couple event early
        if (approve && resp && resp.coupleId) {
            this.joinRequestCache.outgoing = [];
            // Emit coupleJoined immediately
            this.emit('coupleJoined', { coupleId: resp.coupleId, partner: resp.partnerInfo });
            if (resp.gameSession?.id) {
                this.sessionId = resp.gameSession.id;
                this.emit('gameSessionStarted', { sessionId: resp.gameSession.id });
            }
        }
        this.emit('joinRequestsUpdated', this.joinRequestCache);
        return resp;
    }

    async cancelJoin(targetUserId) {
        if (!this.userId) throw new Error('User not connected');
        const resp = await this.apiCall('/cancel-join', 'POST', {
            requestingUserId: this.userId,
            targetUserId
        });
        // Optimistic removal
        this.joinRequestCache.outgoing = this.joinRequestCache.outgoing.filter(r => (r.targetUserId||r.TargetUserId) !== targetUserId);
        this.emit('joinRequestsUpdated', this.joinRequestCache);
        return resp;
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
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => {
            this.pollForUpdates().catch(err => console.error('❌ Error polling for updates:', err));
        }, this.pollingFrequency);
        console.log('🔄 Started event polling for RabbitMQ updates');
    // Perform an immediate poll so UI updates without initial delay
    this.pollForUpdates().catch(err => console.warn('Initial poll error:', err));
    }

    stopEventPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('⏹️ Stopped event polling');
        }
    }

    async pollForUpdates() {
        if (!this.userId) return;
        try {
            let status, gameSession, partnerInfo;
            let usedSnapshot = false;
            try {
                const snap = await this.apiCall(`/snapshot/${this.userId}`);
                if (snap && snap.success) {
                    usedSnapshot = true;
                    status = snap.status;
                    gameSession = snap.gameSession;
                    partnerInfo = snap.partnerInfo;
                    
                    // Log user data for debugging
                    if (snap.users) console.log('📡 Utenti ricevuti:', snap.users);
                    
                    // Users delta
                    if (snap.users) {
                        const str = JSON.stringify(snap.users);
                        if (str !== JSON.stringify(this.lastUsersSnapshot)) {
                            this.lastUsersSnapshot = snap.users;
                this.emit('usersUpdated', { users: snap.users, outbound: snap.outbound, inbound: snap.inbound, outgoing: snap.outbound, incoming: snap.inbound });
                        }
                    }
                    // Requests delta
                    const inc = snap.incomingRequests || [];
                    let out = snap.outgoingRequests || [];
                    // Preserve optimistic outgoing requests if snapshot returns empty before backend processes them
                    if (out.length === 0 && this.joinRequestCache.outgoing.some(r => r._optimistic)) {
                        out = this.joinRequestCache.outgoing;
                    } else {
                        // If backend echoes them back, drop the _optimistic flag
                        out = out.map(r => ({ ...r, _optimistic: false }));
                    }
                    // Prune stale optimistic entries (never confirmed by backend within TTL)
                    const now = Date.now();
                    const pruned = [];
                    const kept = out.filter(r => {
                        if (r._optimistic) {
                            const created = new Date(r.createdAt).getTime();
                            if (!isNaN(created) && (now - created) > this.optimisticJoinTTL) {
                                pruned.push(r);
                                return false; // drop
                            }
                        }
                        return true;
                    });
                    if (pruned.length) {
                        this.prunedJoinCount += pruned.length;
                        this.emit('metricsUpdated', { prunedJoinCount: this.prunedJoinCount });
                        pruned.forEach(r => this.emit('joinRequestExpired', { request: r }));
                    }
                    out = kept;
                    if (JSON.stringify(inc) !== JSON.stringify(this.joinRequestCache.incoming) || JSON.stringify(out) !== JSON.stringify(this.joinRequestCache.outgoing)) {
                        this.joinRequestCache = { incoming: inc, outgoing: out };
                        this.emit('joinRequestsUpdated', this.joinRequestCache);
                        if (snap.users) {
                            console.log('🔄 Re-emitting usersUpdated after join requests change:', snap.users);
                            this.emit('usersUpdated', { users: snap.users, outbound: out, inbound: inc, outgoing: out, incoming: inc });
                        }
                    }
                }
            } catch (err) {
                console.error('❌ Error in pollForUpdates snapshot:', err);
            }
            if (!usedSnapshot) {
                const resp = await this.apiCall(`/user-status/${this.userId}`);
                if (!resp.success) return;
                status = resp.status; gameSession = resp.gameSession; partnerInfo = resp.partnerInfo;
            }
            const prevStatus = this.lastKnownStatus;
            if (status && status.coupleId && (!prevStatus || prevStatus.coupleId !== status.coupleId)) {
                this.emit('coupleJoined', { coupleId: status.coupleId, partner: partnerInfo });
            }
            if (partnerInfo && (!this.lastKnownPartner || this.lastKnownPartner.userId !== partnerInfo.userId)) {
                this.lastKnownPartner = partnerInfo;
                this.emit('partnerUpdated', partnerInfo);
            }
            if (gameSession && (!prevStatus || prevStatus.sessionId !== gameSession.id)) {
                this.sessionId = gameSession.id;
                this.emit('gameSessionStarted', { sessionId: gameSession.id });
            }
            if (gameSession?.sharedCards) {
                const count = gameSession.sharedCards.length;
                if (count > this.lastKnownCardCount) {
                    this.lastKnownCardCount = count;
                    const latest = gameSession.sharedCards[count - 1];
                    if (latest?.cardData) {
                        try {
                            const cardData = JSON.parse(latest.cardData);
                            this.emit('sessionUpdated', { type: 'cardDrawn', card: cardData, drawnBy: latest.sharedById, timestamp: latest.sharedAt });
                        } catch (e) { console.error('Error parsing shared card data:', e); }
                    }
                }
            }
            this.lastKnownStatus = status;
        } catch (error) {
            if (error.message !== 'Failed to get user status') console.warn('⚠️ Polling error:', error);
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
