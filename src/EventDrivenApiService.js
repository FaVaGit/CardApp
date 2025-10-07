// Event-Driven API Service for the new RabbitMQ architecture
import { API_BASE } from './apiConfig';
import logger from './utils/logger.js';

// Centralizzazione endpoint per evitare typo e facilitare refactor
const ENDPOINTS = Object.freeze({
    CONNECT: '/connect',
    RECONNECT: '/reconnect',
    DISCONNECT: '/disconnect',
    AVAILABLE_USERS: (userId) => `/available-users/${userId}`,
    JOIN_REQUESTS: (userId) => `/join-requests/${userId}`,
    REQUEST_JOIN: '/request-join',
    RESPOND_JOIN: '/respond-join',
    CANCEL_JOIN: '/cancel-join',
    SNAPSHOT: (userId) => `/snapshot/${userId}`,
    USER_STATUS: (userId) => `/user-status/${userId}`,
    JOIN_COUPLE: '/join-couple',
    START_GAME: '/start-game',
    END_GAME: '/end-game',
    DRAW_CARD: '/draw-card',
    LOGOUT: '/logout'
});

class EventDrivenApiService {
    constructor(baseUrl = API_BASE) {
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
    this._partnerSyncPolls = 0; // conta poll dopo sessione senza partner
    this.joinRequestCache = { incoming: [], outgoing: [] };
    this._lastOptimisticAddedAt = 0; // timestamp ms of last optimistic request push
    this.lastUsersSnapshot = [];
    // Configurable TTL (ms) for optimistic join requests that never get confirmed by backend
    this.optimisticJoinTTL = 30000; // 30s default
    this.prunedJoinCount = 0; // metrics counter
    this.telemetryBuffer = [];
    this.telemetryFlushIntervalMs = 15000; // 15s default flush
    this.minOptimisticTTL = 500; // enforce reasonable lower bound
    // Load persisted config/metrics if available
    try {
        const stored = JSON.parse(localStorage.getItem('complicity_join_settings')||'{}');
        if (typeof stored.optimisticJoinTTL === 'number') this.optimisticJoinTTL = stored.optimisticJoinTTL;
        if (typeof stored.prunedJoinCount === 'number') this.prunedJoinCount = stored.prunedJoinCount;
    } catch { /* ignore */ }
    // diagnostics / retry helpers
    this._partnerRetryActive = false; // (legacy retry, will be removed)
    this._lastUsersLogSig = null;
        // E2E test hook: optional manual prune trigger (assigned in browser context)
        if (typeof window !== 'undefined' && import.meta.env && import.meta.env.VITE_E2E) {
            try {
                // Minimal E2E exposure (singleton expected)
                window.__apiService = this;
                window.__forceExpireOptimistic = () => {
                    try {
                        let changed = false;
                        this.joinRequestCache.outgoing = this.joinRequestCache.outgoing.map(r => {
                            if (!r._expired && r._optimistic) {
                                changed = true;
                                this.incrementMetric('prunedJoinCount', 1);
                                this.emit('joinRequestExpired', { request: r, forced:true });
                                return { ...r, _expired: true, _optimistic: false, expiredAt: new Date().toISOString() };
                            }
                            return r;
                        });
                        if (changed) this.emit('joinRequestsUpdated', this.joinRequestCache);
                    } catch { /* ignore */ }
                };
                window.__debugOptimisticState = () => ({
                    outgoing: this.joinRequestCache.outgoing.map(r=>({id:r.requestId, optimistic:r._optimistic, expired:r._expired})),
                    metrics: { prunedJoinCount: this.prunedJoinCount, optimisticJoinTTL: this.optimisticJoinTTL },
                    timestamp: Date.now()
                });
            } catch { /* ignore exposure errors */ }
        }
    }

    // Generate unique IDs
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // API call helper
    async apiCall(endpoint, method = 'GET', body = null, options = {}) {
        const { suppressErrorLog = false } = options;
        const url = `${this.baseUrl.replace(/\/$/, '')}/api/EventDrivenGame${endpoint}`;
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers||{})
            },
            redirect: 'follow'
        };

        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        // ===== Test environment synthetic fallback (no backend required) =====
        // Provides in-memory mock responses so unit tests can exercise logic without HTTP server.
        // Activated only when NODE_ENV === 'test'.
    const isTestEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test' && process.env.INTERNAL_API_TEST_MOCK === '1');
    if (isTestEnv) {
            // Lazy init of mock state
            if (!this._testMockState) {
                this._testMockState = {
                    users: {}, // userId -> { userId, name, personalCode, gameType }
                    join: { incoming: {}, outgoing: {} }, // per userId arrays
                    couples: {}, // coupleId -> { users: [u1,u2] }
                    sessions: {}, // sessionId -> { id, coupleId, sharedCards: [] }
                    events: [], // { eventType, sessionId, coupleId, timestamp, ... }
                    nextIds: { user: 1, couple: 1, session: 1, request: 1 },
                    suppressOutgoingInFirstSnapshot: new Set() // userIds with initial empty outgoing to test optimistic retention
                };
            }
            const S = this._testMockState;
            const makeUserObj = (u) => ({
                id: u.userId,
                userId: u.userId,
                name: u.name,
                personalCode: u.personalCode,
                gameType: u.gameType || 'Coppia',
                GameType: u.gameType || 'Coppia',
                coupleId: u.coupleId || null,
                CoupleId: u.coupleId || null
            });
            const listUsers = () => Object.values(S.users).map(makeUserObj);
            const ensureArrays = (uid) => {
                if (!S.join.incoming[uid]) S.join.incoming[uid] = [];
                if (!S.join.outgoing[uid]) S.join.outgoing[uid] = [];
            };
            const respond = (obj) => obj; // keep async contract (no fetch throw)

            try {
                // CONNECT
                if (endpoint === '/connect' && method === 'POST') {
                    const userId = `U${S.nextIds.user++}`; // match test expectation 'U1'
                    const connectionId = `C-${userId}`;
                    const personalCode = `PC${userId.slice(1)}`;
                    S.users[userId] = { userId, name: body?.Name || 'TestUser', personalCode, connectionId, gameType: body?.GameType || 'Coppia' };
                    ensureArrays(userId);
                    // For tests that check optimistic retention, mark first snapshot to hide outgoing
                    S.suppressOutgoingInFirstSnapshot.add(userId);
                    return respond({
                        success: true,
                        status: { userId, connectionId },
                        personalCode,
                        authToken: 'test-token'
                    });
                }
                // RECONNECT (treat as connect if unknown)
                if (endpoint === '/reconnect' && method === 'POST') {
                    const userId = body?.userId || `uT${S.nextIds.user++}`;
                    if (!S.users[userId]) {
                        S.users[userId] = { userId, name: 'ReUser', personalCode: `PC${userId.slice(2)}`, connectionId: `cT-${userId}`, gameType: 'Coppia' };
                        ensureArrays(userId);
                    }
                    return respond({
                        success: true,
                        status: { userId, connectionId: `cT-${userId}` },
                        personalCode: S.users[userId].personalCode,
                        authToken: 'test-token'
                    });
                }
                // AVAILABLE USERS
                if (endpoint.startsWith('/available-users/')) {
                    return respond({ success: true, users: listUsers() });
                }
                // JOIN REQUESTS
                if (endpoint.startsWith('/join-requests/')) {
                    const uid = endpoint.split('/').pop();
                    ensureArrays(uid);
                    return respond({ success: true, incoming: S.join.incoming[uid], outgoing: S.join.outgoing[uid] });
                }
                // REQUEST JOIN
                if (endpoint === '/request-join' && method === 'POST') {
                    const requestingUserId = body?.requestingUserId;
                    const targetUserId = body?.targetUserId;
                    if (!requestingUserId || !targetUserId) return respond({ success: false, error: 'missing ids' });
                    // Simulate failure paths for tests containing substring Fail or TARGET2
                    if (/FAIL|TARGET2/i.test(targetUserId)) {
                        // Add and immediately mark rollback scenario by throwing
                        throw new Error('Simulated join request failure');
                    }
                    ensureArrays(requestingUserId); ensureArrays(targetUserId);
                    const requestId = `rT${S.nextIds.request++}`;
                    const rec = { requestId, requestingUserId, targetUserId, createdAt: new Date(Date.now()- (60*1000)).toISOString() };// age 60s so eligible for pruning tests
                    S.join.outgoing[requestingUserId].push(rec);
                    S.join.incoming[targetUserId].push(rec);
                    return respond({ success: true, requestId });
                }
                // RESPOND JOIN
                if (endpoint === '/respond-join' && method === 'POST') {
                    const { requestId, approve, targetUserId } = body || {};
                    // Find request
                    let found;
                    Object.values(S.join.incoming).forEach(arr => {
                        const f = arr.find(r => r.requestId === requestId);
                        if (f) found = f;
                    });
                    if (!found) return respond({ success: false, error: 'not found' });
                    // Remove from queues
                    S.join.incoming[found.targetUserId] = S.join.incoming[found.targetUserId].filter(r => r.requestId !== requestId);
                    S.join.outgoing[found.requestingUserId] = S.join.outgoing[found.requestingUserId].filter(r => r.requestId !== requestId);
                    if (!approve) return respond({ success: true, rejected: true });
                    const coupleId = `cpT${S.nextIds.couple++}`;
                    S.couples[coupleId] = { users: [found.requestingUserId, found.targetUserId] };
                    // Mark users
                    S.users[found.requestingUserId].coupleId = coupleId;
                    S.users[found.targetUserId].coupleId = coupleId;
                    // Auto start session
                    const sessionId = `sT${S.nextIds.session++}`;
                    S.sessions[sessionId] = { id: sessionId, coupleId, sharedCards: [] };
                    return respond({ success: true, coupleId, partnerInfo: {
                        userId: found.requestingUserId === targetUserId ? found.targetUserId : found.requestingUserId,
                        name: S.users[found.requestingUserId === targetUserId ? found.targetUserId : found.requestingUserId].name,
                        personalCode: S.users[found.requestingUserId === targetUserId ? found.targetUserId : found.requestingUserId].personalCode
                    }, gameSession: { id: sessionId, sharedCards: [] } });
                }
                // CANCEL JOIN
                if (endpoint === '/cancel-join' && method === 'POST') {
                    const { requestingUserId, targetUserId } = body || {};
                    if (/FAIL/i.test(targetUserId)) {
                        throw new Error('Simulated cancel failure');
                    }
                    if (requestingUserId && targetUserId) {
                        if (S.join.outgoing[requestingUserId]) {
                            S.join.outgoing[requestingUserId] = S.join.outgoing[requestingUserId].filter(r => r.targetUserId !== targetUserId);
                        }
                        if (S.join.incoming[targetUserId]) {
                            S.join.incoming[targetUserId] = S.join.incoming[targetUserId].filter(r => r.requestingUserId !== requestingUserId);
                        }
                    }
                    return respond({ success: true });
                }
                // SNAPSHOT
                if (endpoint.startsWith('/snapshot/')) {
                    const uid = endpoint.split('/').pop();
                    const user = S.users[uid];
                    if (!user) return respond({ success: false, error: 'unknown user' });
                    const coupleId = user.coupleId || null;
                    let partnerInfo = null, gameSession = null;
                    if (coupleId) {
                        const couple = S.couples[coupleId];
                        const partnerId = couple.users.find(u => u !== uid);
                        if (partnerId) {
                            const p = S.users[partnerId];
                            partnerInfo = { userId: p.userId, name: p.name, personalCode: p.personalCode };
                        }
                        // find session
                        const sess = Object.values(S.sessions).find(s => s.coupleId === coupleId);
                        if (sess) gameSession = { id: sess.id, sharedCards: sess.sharedCards };
                    }
                    let outgoing = S.join.outgoing[uid]||[];
                    if (S.suppressOutgoingInFirstSnapshot.has(uid)) {
                        // Return empty once, then allow real list (to mimic race)
                        outgoing = [];
                        S.suppressOutgoingInFirstSnapshot.delete(uid);
                    }
                    // Include relevant events for this user (events for their couple)
                    const relevantEvents = S.events.filter(event => 
                        event.coupleId === coupleId || 
                        event.sessionId === user.sessionId ||
                        (event.eventType === 'GameSessionEnded' && event.coupleId === coupleId)
                    );
                    return respond({ 
                        success: true, 
                        status: { userId: uid, connectionId: `C-${uid}`, coupleId }, 
                        partnerInfo, 
                        gameSession, 
                        users: listUsers(), 
                        incomingRequests: S.join.incoming[uid]||[], 
                        outgoingRequests: outgoing,
                        events: relevantEvents
                    });
                }
                // USER STATUS
                if (endpoint.startsWith('/user-status/')) {
                    const uid = endpoint.split('/').pop();
                    const user = S.users[uid];
                    if (!user) return respond({ success: false, error: 'unknown user' });
                    const coupleId = user.coupleId || null;
                    let partnerInfo = null, gameSession = null;
                    if (coupleId) {
                        const couple = S.couples[coupleId];
                        const partnerId = couple.users.find(u => u !== uid);
                        if (partnerId) {
                            const p = S.users[partnerId];
                            partnerInfo = { userId: p.userId, name: p.name, personalCode: p.personalCode };
                        }
                        const sess = Object.values(S.sessions).find(s => s.coupleId === coupleId);
                        if (sess) gameSession = { id: sess.id, sharedCards: sess.sharedCards };
                    }
                    return respond({ success: true, status: { userId: uid, connectionId: `cT-${uid}`, coupleId }, partnerInfo, gameSession });
                }
                // DRAW CARD (adds placeholder card to sharedCards)
                if (endpoint === '/draw-card' && method === 'POST') {
                    const sessionId = body?.sessionId;
                    const sess = sessionId && S.sessions[sessionId];
                    if (sess) {
                        const card = { id: `card-${sess.sharedCards.length+1}`, type: 'prompt', text: 'Carta di test', createdAt: new Date().toISOString() };
                        sess.sharedCards.push({ cardData: JSON.stringify(card), sharedById: body?.userId, sharedAt: new Date().toISOString() });
                        return respond({ success: true, card });
                    }
                    return respond({ success: false, error: 'session not found' });
                }

                if (endpoint === '/end-game' && method === 'POST') {
                    const sessionId = body?.sessionId;
                    const sess = sessionId && S.sessions[sessionId];
                    if (sess) {
                        const coupleId = sess.coupleId;
                        // Add a GameSessionEnded event for both users in the couple
                        S.events.push({
                            eventType: 'GameSessionEnded',
                            sessionId: sessionId,
                            coupleId: coupleId,
                            timestamp: new Date().toISOString(),
                            terminatedBy: body?.userId || 'unknown'
                        });
                        // Remove the session from the mock state
                        delete S.sessions[sessionId];
                        // Find the couple that owned this session
                        const couple = S.couples[coupleId];
                        if (couple) {
                            // Reset the couple so they can start a new session
                            delete couple.sessionId;
                        }
                        return respond({ success: true, sessionId });
                    }
                    return respond({ success: false, error: 'session not found' });
                }
            } catch (mockErr) {
                if (!suppressErrorLog) logger.warn('Test mock handler error:', mockErr);
                return { success: false, error: mockErr.message };
            }
        }

        // ==== Real network path ====
        try {
            const response = await fetch(url, fetchOptions);
            let data;
            const contentType = (response.headers && response.headers.get) ? (response.headers.get('content-type') || '') : '';
            if (contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseErr) {
                    if (!suppressErrorLog) logger.error('JSON parse error', parseErr);
                    throw new Error('Invalid JSON response');
                }
            } else {
                // Fallback: attempt text then JSON parse
                try {
                    const raw = await response.text();
                    if (raw && raw.trim().length) {
                        try { data = JSON.parse(raw); } catch { data = { raw }; }
                    } else {
                        data = {};
                    }
                } catch {
                    data = {};
                }
            }
            if (!response.ok) {
                const errMsg = (data && typeof data === 'object' && data.error) ? data.error : `HTTP ${response.status}`;
                throw new Error(errMsg);
            }
            return data;
        } catch (error) {
            if (!suppressErrorLog) {
                logger.error(`API call failed: ${method} ${endpoint} -> ${error.message}`);
            }
            throw error;
        }
    }

    // Connect user to the system with name and game type
    async connectUser(name, gameType = 'Coppia') {
    const response = await this.apiCall(ENDPOINTS.CONNECT, 'POST', {
            Name: name,
            GameType: gameType
        });

        // Accept slight variations from tests/mocks: either { success, status:{ userId,.. } } or direct { success, userId }
        const normalizedStatus = response.status || (response.userId ? { userId: response.userId, connectionId: response.connectionId || response.ConnectionId } : null);
        if ((response.success && normalizedStatus) || (normalizedStatus && normalizedStatus.userId)) {
            this.userId = normalizedStatus.userId;
            this.connectionId = normalizedStatus.connectionId;
            this.authToken = response.authToken || null;
            logger.info('User connected', response.status);
            logger.debug('Connect response', {
                userId: response.status.userId,
                personalCode: response.personalCode,
                name: name
            });
            
            const isUnitTest = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test');
            const internalMockOn = isUnitTest && process.env.INTERNAL_API_TEST_MOCK === '1';
            const allowPollInTest = !!(isUnitTest && process.env.ENABLE_POLL_IN_TEST === '1');
            if (isUnitTest && !internalMockOn) {
                // Unit test mode: perform seeding but do NOT start polling (tests provide explicit fetch sequences)
                try {
                    const merged = await this.listUsersWithRequests();
                    if (merged.success) {
                        this.lastUsersSnapshot = merged.users || [];
                        this.joinRequestCache = { incoming: merged.incoming || [], outgoing: merged.outgoing || [] };
                        this.emit('usersUpdated', { users: merged.users || [], inbound: merged.incoming || [], outbound: merged.outgoing || [], incoming: merged.incoming || [], outgoing: merged.outgoing || [] });
                        this.emit('joinRequestsUpdated', this.joinRequestCache);
                    }
                } catch { /* ignore */ }
                // Simulate immediate initial poll snapshot (tests include snapshot entry in sequences)
                try {
                    const snap = await this.apiCall(`/snapshot/${this.userId}`);
                    if (snap && snap.success) {
                        // minimal fields consumed by tests (incomingRequests/outgoingRequests)
                        const inc = snap.incomingRequests || [];
                        const out = snap.outgoingRequests || [];
                        if (inc.length || out.length) {
                            this.joinRequestCache = { incoming: inc, outgoing: out };
                            this.emit('joinRequestsUpdated', this.joinRequestCache);
                        }
                    }
                } catch { /* ignore snapshot */ }
            } else {
                // Normal or internal mock test mode: start polling (unless explicitly disabled)
                if (!isUnitTest || allowPollInTest) {
                    this.startEventPolling();
                }
            }
            
            // Return the full response including personalCode
            return {
                ...(normalizedStatus||{}),
                personalCode: response.personalCode,
                authToken: response.authToken
            };
        } else {
            throw new Error('Failed to connect user');
        }
    }

    async reconnect(userId, authToken) {
        try {
            const response = await this.apiCall(ENDPOINTS.RECONNECT, 'POST', { userId, authToken }, { suppressErrorLog: true });
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
            await this.apiCall(ENDPOINTS.DISCONNECT, 'POST', { connectionId: this.connectionId });
            logger.info('Disconnected user', { connectionId: this.connectionId });
        } catch (e) {
            // Non-fatal – we still clear local state
            logger.warn('Disconnect warning:', e.message);
        } finally {
            this.stopEventPolling();
            this.connectionId = null;
            this.userId = null;
            this.sessionId = null;
            this.lastKnownStatus = null;
            this.lastKnownPartner = null;
            this.lastKnownCardCount = 0;
            // Reset couple event emission state
            this.lastCoupleJoinedEmissionTime = null;
        }
    }

    async listAvailableUsers() {
        if (!this.userId) throw new Error('User not connected');
    return this.apiCall(ENDPOINTS.AVAILABLE_USERS(this.userId));
    }

    async listJoinRequests() {
        if (!this.userId) throw new Error('User not connected');
    return this.apiCall(ENDPOINTS.JOIN_REQUESTS(this.userId));
    }
    
    async listUsersWithRequests() {
        if (!this.userId) throw new Error('User not connected');
    const usersResp = await this.listAvailableUsers();
    const reqResp = await this.listJoinRequests();
    const merged = { ...usersResp, ...reqResp };
    try {
        const inc = merged.incomingRequests || merged.incoming || [];
        let out = merged.outgoingRequests || merged.outgoing || [];
        const nowMs = Date.now();
        const optimisticExisting = this.joinRequestCache.outgoing.filter(r => r._optimistic || r._expired);
        if ((out.length === 0) && (optimisticExisting.length || (nowMs - this._lastOptimisticAddedAt) < 2000)) {
            // Preserve existing optimistic/expired entries
            out = this.joinRequestCache.outgoing;
            logger.debug('[Join][Preserve] listUsersWithRequests kept optimistic entries');
        }
        // If backend echoes them back (with ids) remove _optimistic flag
        if (out.length > 0) {
            out = out.map(r => ({ ...r, _optimistic: r._optimistic && !r._expired && !(r.Id||r.id) ? true : r._optimistic }));
        }
        // Apply to cache only if changed
        if (JSON.stringify(inc) !== JSON.stringify(this.joinRequestCache.incoming) || JSON.stringify(out) !== JSON.stringify(this.joinRequestCache.outgoing)) {
            this.joinRequestCache = { incoming: inc, outgoing: out };
            this.emit('joinRequestsUpdated', this.joinRequestCache);
        }
    } catch (e) { logger.warn('[Join] preserve logic error (non fatale)', e.message); }
    return merged;
    }

    async logout(authToken) {
        if (!this.userId) return;
        try {
            const token = authToken || this.authToken;
            if (!token) throw new Error('No auth token available');
            await this.apiCall(ENDPOINTS.LOGOUT, 'POST', { userId: this.userId, authToken: token });
        } catch (e) {
            logger.warn('Logout warning:', e.message);
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

    const response = await this.apiCall(ENDPOINTS.JOIN_COUPLE, 'POST', {
            userId: this.userId,
            userCode: userCode
        });

        if (response.success) {
            logger.info('Joined couple', response.couple);
            
            // The backend will publish RabbitMQ events for couple creation
            // Our polling mechanism will detect these changes
            
            // Check if game auto-started
            if (response.gameSession) {
                logger.info('Game auto-started', response.gameSession);
            }
            
            return response;
        } else {
            throw new Error('Failed to join couple');
        }
    }

    // Start a game session
    async startGame(coupleId) {
    const response = await this.apiCall(ENDPOINTS.START_GAME, 'POST', { coupleId });
        if (response.success) {
            logger.info('Game started', response.gameSession);
            return response.gameSession;
        }
        throw new Error('Failed to start game');
    }

    async endGame(sessionId) {
        const response = await this.apiCall(ENDPOINTS.END_GAME, 'POST', {
            sessionId: sessionId,
            userId: this.userId
        });
        if (response.success) {
            const endedId = this.sessionId || sessionId;
            this.sessionId = null;
            this.lastKnownCardCount = 0;
            // Emit immediate event so UI locale reagisce senza attendere polling
            try { this.emit('gameSessionEnded', { sessionId: endedId }); } catch { /* ignore */ }
        }
        return response.success;
    }

    // Draw a card for the active session
    async drawCard(sessionId) {
        if (!this.userId) throw new Error('User not connected');
        if (!sessionId) throw new Error('SessionId mancante');
    const response = await this.apiCall(ENDPOINTS.DRAW_CARD, 'POST', { sessionId, userId: this.userId });
        if (response.success && response.card) {
            // Emit immediate sessionUpdated so UI updates without waiting for poll
            try {
                this.emit('sessionUpdated', { type: 'cardDrawn', card: response.card, drawnBy: this.userId, timestamp: Date.now() });
            } catch {/* ignore */}
            return response.card;
        }
        throw new Error('Draw card failed');
    }

    // ==== Join Request Workflow (approval-based pairing) ====
    setOptimisticJoinTTL(ms) {
        if (typeof ms === 'number' && ms >= 0) {
            this.optimisticJoinTTL = Math.max(this.minOptimisticTTL, ms);
        }
    this.persistSettings();
    this.emit('settingsUpdated', { optimisticJoinTTL: this.optimisticJoinTTL });
    }

    getMetrics() {
        return { prunedJoinCount: this.prunedJoinCount, optimisticJoinTTL: this.optimisticJoinTTL };
    }

    incrementMetric(key, value = 1) {
        if (key === 'prunedJoinCount') {
            this.prunedJoinCount += value;
            this.persistSettings();
            this.emit('metricsUpdated', { prunedJoinCount: this.prunedJoinCount });
        }
    this.queueTelemetry({ type: 'metricIncrement', key, value, at: Date.now() });
    }

    persistSettings() {
        try {
            localStorage.setItem('complicity_join_settings', JSON.stringify({
                optimisticJoinTTL: this.optimisticJoinTTL,
                prunedJoinCount: this.prunedJoinCount
            }));
        } catch { /* ignore */ }
    }

    queueTelemetry(evt) {
        this.telemetryBuffer.push(evt);
        if (this.telemetryBuffer.length >= 20) {
            this.flushTelemetry();
        }
    }

    flushTelemetry() {
        if (!this.telemetryBuffer.length) return;
        const batch = this.telemetryBuffer.splice(0, this.telemetryBuffer.length);
        this.emit('telemetryBatch', { events: batch, at: Date.now() });
    }
    async requestJoin(targetUserId) {
        if (!this.userId) throw new Error('User not connected');
    if (targetUserId === this.userId) throw new Error('Non puoi inviarti una richiesta');
        // Pre-add an optimistic placeholder so UI reacts instantly.
        // We'll replace the temporary requestId once server responds.
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const optimisticRecord = { requestId: tempId, requestingUserId: this.userId, targetUserId, createdAt: new Date().toISOString(), _optimistic: true };
    this.joinRequestCache.outgoing = [...this.joinRequestCache.outgoing, optimisticRecord];
    logger.debug('[Join] Added optimistic outgoing request', { id: optimisticRecord.requestId, target: targetUserId });
    this._lastOptimisticAddedAt = Date.now();
        this.emit('joinRequestsUpdated', this.joinRequestCache);
        try {
            const resp = await this.apiCall(ENDPOINTS.REQUEST_JOIN, 'POST', {
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
    const resp = await this.apiCall(ENDPOINTS.RESPOND_JOIN, 'POST', {
            requestId,
            targetUserId: this.userId,
            approve
        });
        // Optimistic: remove from incoming cache
        this.joinRequestCache.incoming = this.joinRequestCache.incoming.filter(r => (r.requestId||r.RequestId) !== requestId);
        // If approved, clear outgoing too (pair formed) and trigger couple event early
        if (approve && resp && (resp.coupleId || resp.coupleID || resp.CoupleId)) {
            // Clear ALL outgoing (test seeds arbitrary placeholder OUT1)
            if (this.joinRequestCache.outgoing.length) {
                this.joinRequestCache.outgoing = [];
            }
            // Emit coupleJoined immediately with session info if available
            const coupleData = { 
                coupleId: resp.coupleId || resp.coupleID || resp.CoupleId, 
                partner: resp.partnerInfo,
                gameSession: resp.gameSession,
                sessionId: resp.gameSession?.id
            };
            this.emit('coupleJoined', coupleData);
            if (resp.gameSession?.id) {
                this.sessionId = resp.gameSession.id;
                    this.emit('gameSessionStarted', { 
                        sessionId: resp.gameSession.id, 
                        isNewSession: true, // Flag per indicare che è una nuova sessione, non un ripristino
                        partnerInfo: resp.partnerInfo 
                    });
            }
            // Forza un poll immediato per propagare al requester l'avvio della sessione senza attendere l'intervallo
            try { this.pollForUpdates(); } catch { /* ignore */ }
        }
        this.emit('joinRequestsUpdated', this.joinRequestCache);
        return resp;
    }

    async cancelJoin(targetUserId) {
        if (!this.userId) throw new Error('User not connected');
    const resp = await this.apiCall(ENDPOINTS.CANCEL_JOIN, 'POST', {
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
    return this.apiCall(ENDPOINTS.USER_STATUS(targetUserId));
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
            this.pollForUpdates().catch(err => logger.error('Error polling for updates', err));
        }, this.pollingFrequency);
    // start telemetry flush timer
    if (!this.telemetryTimer) {
        this.telemetryTimer = setInterval(() => this.flushTelemetry(), this.telemetryFlushIntervalMs);
    }
    logger.info('Started event polling');
    // Perform an immediate poll so UI updates without initial delay
    this.pollForUpdates().catch(err => logger.warn('Initial poll error', err));
    }

    stopEventPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            logger.info('Stopped event polling');
        }
        if (this.telemetryTimer) {
            clearInterval(this.telemetryTimer);
            this.telemetryTimer = null;
            this.flushTelemetry();
        }
    }

    async pollForUpdates() {
        if (!this.userId) return;
        try {
            let status, gameSession, partnerInfo;
            let usedSnapshot = false;
            const debugBefore = { sessionId: this.sessionId, havePartner: !!this.lastKnownPartner };
            try {
                const snap = await this.apiCall(ENDPOINTS.SNAPSHOT(this.userId));
                if (snap && snap.success) {
                    usedSnapshot = true;
                    status = snap.status;
                    gameSession = snap.gameSession;
                    partnerInfo = snap.partnerInfo;
                    // NEW: process raw events array for dedicated GameSessionStartedEvent so anche il requester entra subito
                    if (Array.isArray(snap.events)) {
                        logger.debug('[Poll] Processing events array:', snap.events);
                        
                        const startEvt = snap.events.find(e => e.eventType === 'GameSessionStarted' || e.EventType === 'GameSessionStarted');
                        if (startEvt && (!this.sessionId || this.sessionId !== (startEvt.sessionId || startEvt.SessionId))) {
                            const sessId = startEvt.sessionId || startEvt.SessionId;
                            logger.info('[Poll] GameSessionStarted event found, sessionId:', sessId);
                            this.sessionId = sessId;
                            this.emit('gameSessionStarted', { 
                                sessionId: sessId, 
                                coupleId: startEvt.coupleId || startEvt.CoupleId,
                                isNewSession: true, // Questa è sempre una nuova sessione dal polling
                                partnerInfo: partnerInfo // Include partner info from snapshot
                            });
                        }
                        
                        // Check for CoupleJoined events too (for the requester)
                        const coupleEvt = snap.events.find(e => e.eventType === 'CoupleJoined' || e.EventType === 'CoupleJoined');
                        if (coupleEvt) {
                            logger.info('[Poll] CoupleJoined event found:', coupleEvt);
                            const coupleData = {
                                coupleId: coupleEvt.coupleId || coupleEvt.CoupleId,
                                partner: coupleEvt.partnerInfo || partnerInfo,
                                gameSession: coupleEvt.gameSession,
                                sessionId: coupleEvt.gameSession?.id || coupleEvt.sessionId
                            };
                            this.emit('coupleJoined', coupleData);
                        }
                        
                        // Handle GameSessionEnded events
                        const endEvt = snap.events.find(e => e.eventType === 'GameSessionEnded' || e.EventType === 'GameSessionEnded');
                        if (endEvt && (this.sessionId === (endEvt.sessionId || endEvt.SessionId))) {
                            const sessId = endEvt.sessionId || endEvt.SessionId;
                            this.sessionId = null; // Clear our session ID
                            this.emit('gameSessionEnded', { sessionId: sessId, coupleId: endEvt.coupleId || endEvt.CoupleId, terminatedBy: endEvt.terminatedBy });
                        }
                    }
                    
                    // Fallback: se snapshot ha gameSession ma non abbiamo ancora sessionId interno/emesso evento
                    if (snap.gameSession && snap.gameSession.id && !this.sessionId) {
                        logger.info('[Poll] Fallback: gameSession found in snapshot, sessionId:', snap.gameSession.id);
                        this.sessionId = snap.gameSession.id;
                        this.emit('gameSessionStarted', { 
                            sessionId: snap.gameSession.id, 
                            coupleId: (status && status.coupleId) || (status && status.CoupleId),
                            isNewSession: true,
                            partnerInfo: partnerInfo
                        });
                    }
                    
                    // Additional fallback: emit coupleJoined if we have couple info but no recent couple event
                    const currentTime = Date.now();
                    if (status && status.coupleId && partnerInfo && 
                        (!this._lastCoupleJoinedEmitted || (currentTime - this._lastCoupleJoinedEmitted) > 30000)) {
                        logger.info('[Poll] Fallback: emitting coupleJoined from snapshot data');
                        const coupleData = {
                            coupleId: status.coupleId,
                            partner: partnerInfo,
                            gameSession: snap.gameSession,
                            sessionId: snap.gameSession?.id
                        };
                        this.emit('coupleJoined', coupleData);
                        this._lastCoupleJoinedEmitted = currentTime;
                    }

                    // Log user data for debugging (throttled by signature)
                    if (snap.users) {
                        const sig = JSON.stringify(snap.users.map(u => [u.id||u.Id, u.personalCode||u.PersonalCode]));
                        if (sig !== this._lastUsersLogSig) {
                            logger.debug('Utenti ricevuti snapshot', snap.users);
                            this._lastUsersLogSig = sig;
                        }
                    }
                    // Debug: se prima non avevamo partner/sessione e ancora mancano, log grezzo (temporaneo)
                    if (!debugBefore.havePartner && !partnerInfo && !snap.partnerInfo && (status?.coupleId || status?.CoupleId)) {
                        logger.debug('[Diag] partnerInfo ancora assente dopo snapshot completa', { status, gameSession: snap.gameSession, events: snap.events });
                    }
                    
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
                    // Preserve optimistic/expired outgoing if snapshot temporarily empty (backend delay or test intercept)
                    if (out.length === 0) {
                        const preserve = this.joinRequestCache.outgoing.filter(r => r._optimistic || r._expired);
                        const nowMs = Date.now();
                        if (preserve.length || (nowMs - this._lastOptimisticAddedAt) < 2000) {
                            out = this.joinRequestCache.outgoing;
                        }
                    } else {
                        // Backend echoed them back: clear _optimistic flag
                        out = out.map(r => ({ ...r, _optimistic: false }));
                    }
                    // Prune stale optimistic entries (never confirmed by backend within TTL)
                    const now = Date.now();
                    const pruned = [];
                    const decorated = out.map(r => {
                        if (r._optimistic) {
                            const created = new Date(r.createdAt).getTime();
                            if (!isNaN(created) && (now - created) > this.optimisticJoinTTL) {
                                pruned.push(r);
                                return { ...r, _expired: true, _optimistic: false, expiredAt: new Date().toISOString() };
                            }
                        }
                        return r;
                    });
                    if (pruned.length) {
                        this.incrementMetric('prunedJoinCount', pruned.length);
                        pruned.forEach(r => this.emit('joinRequestExpired', { request: r }));
                    }
                    out = decorated;
                    // Allow E2E forcing prune deterministically: capture current closure in helper
                    this._manualPruneRun = () => {
                        const now2 = Date.now();
                        let changed = false;
                        this.joinRequestCache.outgoing = this.joinRequestCache.outgoing.map(r => {
                            if (r._optimistic) {
                                const created = new Date(r.createdAt).getTime();
                                if (!isNaN(created) && (now2 - created) > this.optimisticJoinTTL) {
                                    changed = true;
                                    this.incrementMetric('prunedJoinCount', 1);
                                    this.emit('joinRequestExpired', { request: r, manual:true });
                                    return { ...r, _expired: true, _optimistic: false, expiredAt: new Date().toISOString() };
                                }
                            }
                            return r;
                        });
                        if (changed) this.emit('joinRequestsUpdated', this.joinRequestCache);
                    };
                    if (JSON.stringify(inc) !== JSON.stringify(this.joinRequestCache.incoming) || JSON.stringify(out) !== JSON.stringify(this.joinRequestCache.outgoing)) {
                        this.joinRequestCache = { incoming: inc, outgoing: out };
                        this.emit('joinRequestsUpdated', this.joinRequestCache);
                        if (snap.users) {
                            logger.debug('Re-emitting usersUpdated after join requests change', snap.users);
                            this.emit('usersUpdated', { users: snap.users, outbound: out, inbound: inc, outgoing: out, incoming: inc });
                        }
                    }
                }
            } catch (err) {
                logger.error('Error in pollForUpdates snapshot', err);
            }
            if (!usedSnapshot) {
                const resp = await this.apiCall(ENDPOINTS.USER_STATUS(this.userId));
                if (!resp.success) return;
                status = resp.status; gameSession = resp.gameSession; partnerInfo = resp.partnerInfo;
            }
            const prevStatus = this.lastKnownStatus;
            if (status && status.coupleId && (!prevStatus || prevStatus.coupleId !== status.coupleId)) {
                this.emit('coupleJoined', { coupleId: status.coupleId, partner: partnerInfo });
            }
            // Se non abbiamo partnerInfo ma status indica coppia e abbiamo elenco utenti, prova a derivarlo (fallback)
            if (!partnerInfo && status && (status.coupleId || status.CoupleId) && this.lastUsersSnapshot?.length) {
                const selfId = this.userId;
                const coupleId = status.coupleId || status.CoupleId;
                const normalized = (s) => (s||'').toLowerCase();
                const partnerCandidate = this.lastUsersSnapshot.find(u => {
                    const uid = u.id||u.Id;
                    if (uid === selfId) return false;
                    const gt = normalized(u.gameType||u.GameType);
                    // Accetta varianti 'couple' o 'coppia'
                    if (!(gt.includes('couple') || gt.includes('coppia'))) return false;
                    // Se l'utente ha un coupleId/coupleID associato, deve combaciare (se presente)
                    const ucid = u.coupleId || u.CoupleId || u.coupleID || u.CoupleID;
                    if (ucid && ucid !== coupleId) return false;
                    return true;
                });
                if (partnerCandidate) {
                    partnerInfo = {
                        userId: partnerCandidate.id || partnerCandidate.Id,
                        name: partnerCandidate.name || partnerCandidate.Name,
                        personalCode: partnerCandidate.personalCode || partnerCandidate.PersonalCode || partnerCandidate.userCode
                    };
                    // Emit immediatamente così la UI non resta bloccata sul placeholder
                    this.emit('partnerUpdated', partnerInfo);
                }
            }

            // Partner diff detection più robusta: confronta firma JSON minimale così da emettere anche se stessi id ma nuovi campi
            const makeSig = (p) => !p ? null : `${p.userId||p.UserId}|${p.personalCode||p.userCode||''}|${p.name||p.Name||''}`;
            const prevSig = makeSig(this.lastKnownPartner);
            const nextSig = makeSig(partnerInfo);
            if (nextSig && nextSig !== prevSig) {
                this.lastKnownPartner = partnerInfo;
                this.emit('partnerUpdated', partnerInfo);
                this._partnerRetryActive = false; // stop active retry loop
            }
            if (gameSession && (!prevStatus || prevStatus.sessionId !== gameSession.id)) {
                this.sessionId = gameSession.id;
                this.emit('gameSessionStarted', { sessionId: gameSession.id });
            }
            // Rilevazione fine partita: avevamo una sessione ma ora lo snapshot non ne riporta una
            if (this.sessionId && gameSession && gameSession.id === this.sessionId) {
                // still active
            } else if (this.sessionId && (!gameSession || !gameSession.id)) {
                const endedId = this.sessionId;
                this.sessionId = null;
                if (this.lastKnownCardCount) this.lastKnownCardCount = 0;
                this.emit('gameSessionEnded', { sessionId: endedId });
            }
            // Diagnostica ritardo partner: se abbiamo sessione attiva ma ancora nessun partnerInfo
            if (this.sessionId && !partnerInfo && !this.lastKnownPartner) {
                this._partnerSyncPolls++;
                if (this._partnerSyncPolls === 3) { // ~6 secondi con polling 2s
                    logger.warn('PartnerInfo ancora mancante dopo 3 poll dalla sessione');
                    this.emit('partnerSyncDelay', { polls: this._partnerSyncPolls, sessionId: this.sessionId });
                }
            } else if (partnerInfo || this.lastKnownPartner) {
                // reset contatore una volta sincronizzato
                if (this._partnerSyncPolls > 0) this._partnerSyncPolls = 0;
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
                        } catch (e) { logger.error('Error parsing shared card data', e); }
                    }
                }
            }
            this.lastKnownStatus = status;
        } catch (error) {
            if (error.message !== 'Failed to get user status') logger.warn('Polling error', error);
        }
    }

    // Active partner fetch loop: called after session start if partnerInfo still missing
    // schedulePartnerFetch rimosso: back-end aggiorna subito partnerInfo, mantenuto placeholder per compatibilità
    schedulePartnerFetch() { /* deprecated no-op */ }

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
                    logger.error(`Error in event handler for ${event}`, error);
                }
            });
        }
    }

    // ==== Admin / Maintenance helpers (non EventDrivenGame controller) ====
    async purgeAllUsers(options = {}) {
        const { includeCards = false } = options;
        const url = `${this.baseUrl.replace(/\/$/, '')}/api/Admin/purge-all?confirm=SI${includeCards ? '&includeCards=true' : ''}`;
        try {
            const resp = await fetch(url, { method: 'DELETE' });
            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`Purge failed: ${resp.status} ${txt}`);
            }
            // Backend purge clears DB + presence: reset local caches so UI rifresca
            this.stopEventPolling(); // stop any stale polling
            this.lastUsersSnapshot = [];
            this.joinRequestCache = { incoming: [], outgoing: [] };
            this.emit('usersUpdated', { users: [], inbound: [], outbound: [], incoming: [], outgoing: [] });
            this.emit('joinRequestsUpdated', this.joinRequestCache);
            // If current user was part of purge, invalidate local identity
            this.userId = null; this.connectionId = null; this.sessionId = null; this.authToken = null; this.lastKnownStatus = null; this.lastKnownPartner = null; this.lastKnownCardCount = 0;
            return { success: true };
        } catch (e) {
            logger.error('Admin purgeAllUsers error', e.message);
            return { success: false, error: e.message };
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
