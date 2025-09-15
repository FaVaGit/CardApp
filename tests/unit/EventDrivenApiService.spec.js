import { describe, it, expect, beforeEach } from 'vitest';
import EventDrivenApiService from '../../src/EventDrivenApiService.js';

// Minimal mock for fetch
function mockFetchSequence(responses) {
  let call = 0;
  global.fetch = async (url, opts = {}) => {
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
    expect(service.joinRequestCache.outgoing).toHaveLength(1);
    expect(service.joinRequestCache.outgoing[0]).toMatchObject({ targetUserId: 'U2' });
  });

  it('removes outgoing request on cancelJoin', async () => {
    mockFetchSequence([
      { success: true, status: { userId: 'U1', connectionId: 'C1' }, personalCode: '123456', authToken: 'T' },
      { success: true, users: [], available: [], },
      { success: true, incoming: [], outgoing: [] },
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
});
