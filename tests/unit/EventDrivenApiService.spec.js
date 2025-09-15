import { describe, it, expect, beforeEach } from 'vitest';
import EventDrivenApiService from '../../src/EventDrivenApiService.js';

// Minimal mock for fetch
function mockFetchSequence(responses) {
  let call = 0;
  global.fetch = async (url, _opts = {}) => {
    const current = responses[Math.min(call, responses.length - 1)];
    call++;
    if (current.error) {
      return {
        ok: false,
        status: current.status || 500,
        json: async () => ({ error: current.error })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => current
    };
  };
}

describe('EventDrivenApiService - Join Requests Optimistic', () => {
  let service;

  beforeEach(() => {
    service = new EventDrivenApiService('http://localhost:5000');
  });

  it('adds outgoing request optimistically on requestJoin success', async () => {
    // connectUser -> /connect success with status stub & subsequent list endpoints
    mockFetchSequence([
      { success: true, status: { userId: 'U1', connectionId: 'C1' }, personalCode: '123456', authToken: 'T' },
      { success: true, users: [], available: [], }, // /available-users
      { success: true, incoming: [], outgoing: [] }, // /join-requests
      { requestId: 'R1', success: true } // /request-join
    ]);

    await service.connectUser('Alice');
    expect(service.userId).toBe('U1');
    expect(service.joinRequestCache.outgoing).toHaveLength(0);

  await service.requestJoin('U2');
  // Allow any immediate snapshot poll to run and preserve optimistic record
  await new Promise(r => setTimeout(r, 0));
  expect(service.joinRequestCache.outgoing).toHaveLength(1);
    expect(service.joinRequestCache.outgoing[0]).toMatchObject({ targetUserId: 'U2' });
  });

  it('removes outgoing request on cancelJoin', async () => {
    mockFetchSequence([
      { success: true, status: { userId: 'U1', connectionId: 'C1' }, personalCode: '123456', authToken: 'T' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
  { success: true, users: [], available: [], incoming: [], outgoing: [] }, // snapshot after connect
  { requestId: 'R1', success: true }, // request-join
  { success: true } // cancel-join
    ]);

    await service.connectUser('Alice');
    await service.requestJoin('U2');
    expect(service.joinRequestCache.outgoing).toHaveLength(1);

    await service.cancelJoin('U2');
    expect(service.joinRequestCache.outgoing).toHaveLength(0);
  });

  it('respondJoin approve clears caches and emits coupleJoined', async () => {
    const events = [];
    service.on('coupleJoined', e => events.push(['coupleJoined', e]));

    mockFetchSequence([
      { success: true, status: { userId: 'U2', connectionId: 'C2' }, personalCode: '654321', authToken: 'T2' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
      { success: true, coupleId: 'COUP1', partnerInfo: { userId: 'U1', name: 'Alice' }, gameSession: { id: 'S1' } } // respond-join
    ]);

    await service.connectUser('Bob');
    // seed an incoming request to be removed
    service.joinRequestCache.incoming = [{ requestId: 'REQX', requestingUserId: 'U1', targetUserId: 'U2' }];
    service.joinRequestCache.outgoing = [{ requestId: 'OUT1', requestingUserId: 'U2', targetUserId: 'U1' }];

    await service.respondJoin('REQX', true);
    expect(service.joinRequestCache.incoming).toHaveLength(0);
    expect(service.joinRequestCache.outgoing).toHaveLength(0);
    expect(events.find(e => e[0] === 'coupleJoined')).toBeTruthy();
    expect(service.sessionId).toBe('S1');
  });

  it('preserves optimistic outgoing request if early snapshot is empty', async () => {
    // Sequence: connect -> lists -> snapshot empty (no outgoing yet) -> request-join
    mockFetchSequence([
      { success: true, status: { userId: 'U9', connectionId: 'C9' }, personalCode: '999999', authToken: 'TOK9' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
      { success: true, incomingRequests: [], outgoingRequests: [] }, // early snapshot poll returns empty
      { requestId: 'R-OPT', success: true }
    ]);

    await service.connectUser('AliceX');
    expect(service.joinRequestCache.outgoing).toHaveLength(0);
    await service.requestJoin('U_TARGET');
    // Allow microtask queue for potential immediate snapshot reconciliation
    await new Promise(r => setTimeout(r, 0));
    expect(service.joinRequestCache.outgoing).toHaveLength(1);
    expect(service.joinRequestCache.outgoing[0]).toMatchObject({ targetUserId: 'U_TARGET' });
  });

  it('cancelJoin failure keeps optimistic outgoing entry intact', async () => {
    // Sequence: connect -> lists -> (immediate poll snapshot empty) -> request-join -> cancel-join failure (500)
    mockFetchSequence([
      { success: true, status: { userId: 'UX', connectionId: 'CX' }, personalCode: 'ABC123', authToken: 'TK' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
      { success: true, incomingRequests: [], outgoingRequests: [] }, // snapshot poll right after connect
      { requestId: 'REQFAIL', success: true }, // request-join success
      { error: 'Server error', status: 500 } // cancel-join failure
    ]);

    await service.connectUser('FailUser');
    await service.requestJoin('TARGET');
  // Allow any immediate snapshot poll to reconcile (should preserve optimistic)
  await new Promise(r => setTimeout(r, 0));
  expect(service.joinRequestCache.outgoing).toHaveLength(1);
    // Attempt cancellation (will throw)
    await expect(service.cancelJoin('TARGET')).rejects.toThrow();
    // Optimistic removal should NOT have happened due to failure (current logic removes after API call; if failure thrown before assignment we ensure revert)
    // Current implementation removes after successful call, so cache must still contain the entry.
    expect(service.joinRequestCache.outgoing).toHaveLength(1);
  });

  it('requestJoin failure rolls back optimistic placeholder', async () => {
    // Sequence: connect -> lists -> snapshot -> request-join error
    mockFetchSequence([
      { success: true, status: { userId: 'URB', connectionId: 'CRB' }, personalCode: 'RB1234', authToken: 'TKRB' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
      { success: true, incomingRequests: [], outgoingRequests: [] },
      { error: 'Backend failure', status: 500 } // request-join fails
    ]);

    await service.connectUser('RollbackUser');
    // Trigger requestJoin (will optimistically add then rollback)
    await expect(service.requestJoin('TARGET2')).rejects.toThrow();
    // Allow microtask flush
    await new Promise(r => setTimeout(r, 0));
    expect(service.joinRequestCache.outgoing).toHaveLength(0);
  });

  it('prunes stale optimistic request after TTL and emits event', async () => {
    const expired = [];
    service.on('joinRequestExpired', e => expired.push(e));
    // Sequence: connect -> lists -> snapshot -> (no backend echo so stays optimistic) -> subsequent polls with empty snapshots
    mockFetchSequence([
      { success: true, status: { userId: 'UTTL', connectionId: 'CTTL' }, personalCode: 'TTL001', authToken: 'TKTTL' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
      { success: true, incomingRequests: [], outgoingRequests: [] }, // initial snapshot
      { requestId: 'REQTTL', success: true }, // request-join success (so placeholder replaced with real id but still _optimistic until backend echoes)
      // poll 1 (no echo yet)
      { success: true, incomingRequests: [], outgoingRequests: [] },
      // poll 2 (triggers pruning)
      { success: true, incomingRequests: [], outgoingRequests: [] }
    ]);

    await service.connectUser('TTLUser');
    // Riduci TTL per il test (5ms)
    service.optimisticJoinTTL = 5;
  await service.requestJoin('TARGETTTL');
    expect(service.joinRequestCache.outgoing).toHaveLength(1);
    // Avanza tempo reale
    await new Promise(r => setTimeout(r, 15));
    // Forza due poll consecutivi manualmente (usa snapshot vuoti dal mock)
    await service.pollForUpdates();
    await service.pollForUpdates();
    expect(service.joinRequestCache.outgoing).toHaveLength(0);
    expect(expired.length).toBeGreaterThanOrEqual(1);
    expect(expired[0].request.targetUserId).toBe('TARGETTTL');
  });

  it('increments metrics and emits metricsUpdated on pruning', async () => {
    const metricEvents = [];
    service.on('metricsUpdated', m => metricEvents.push(m));
    mockFetchSequence([
      { success: true, status: { userId: 'UMET', connectionId: 'CMET' }, personalCode: 'MET001', authToken: 'TKMET' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
      { success: true, incomingRequests: [], outgoingRequests: [] },
      { requestId: 'REQMET', success: true },
      { success: true, incomingRequests: [], outgoingRequests: [] },
      { success: true, incomingRequests: [], outgoingRequests: [] }
    ]);
    await service.connectUser('MetricUser');
  // Directly set a very small TTL to force pruning quickly (bypass min enforcement)
  service.optimisticJoinTTL = 5;
    await service.requestJoin('TARGETM');
    await new Promise(r => setTimeout(r, 12));
    await service.pollForUpdates();
    await service.pollForUpdates();
    const metrics = service.getMetrics();
    expect(metrics.prunedJoinCount).toBeGreaterThanOrEqual(1);
    expect(metricEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('loads persisted TTL from localStorage', () => {
    const key = 'complicity_join_settings';
    global.localStorage.setItem(key, JSON.stringify({ optimisticJoinTTL: 12345, prunedJoinCount: 7 }));
    const fresh = new EventDrivenApiService('http://localhost:5000');
    expect(fresh.optimisticJoinTTL).toBe(12345);
    expect(fresh.prunedJoinCount).toBe(7);
  });

  it('enforces minimum TTL when setting lower value', () => {
    const s = new EventDrivenApiService('http://localhost:5000');
    const min = s.minOptimisticTTL;
    s.setOptimisticJoinTTL(10); // below min
    expect(s.optimisticJoinTTL).toBe(min);
  });

  it('batches telemetry events and flushes on threshold', () => {
    const s = new EventDrivenApiService('http://localhost:5000');
    const batches = [];
    s.on('telemetryBatch', b => batches.push(b));
    for (let i = 0; i < 21; i++) {
      s.incrementMetric('prunedJoinCount', 0); // just emit metricIncrement telemetry without changing count (adding 0)
    }
    // Should have flushed at least one batch
    expect(batches.length).toBeGreaterThanOrEqual(1);
    const totalEvents = batches.reduce((acc,b)=>acc + b.events.length,0);
    expect(totalEvents).toBeGreaterThanOrEqual(20);
  });
});
