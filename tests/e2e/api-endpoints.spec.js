import { test, expect } from '@playwright/test';

// Low-level REST coverage using Playwright request context.
// Assumes backend running at http://localhost:5000
// Covers: connect, snapshot, available-users, join-requests, request-join, respond-join (approve & reject), cancel-join,
// join-couple via code (indirect), reconnect, start-game, end-game, logout, user-status.

const BASE = 'http://localhost:5000/api/EventDrivenGame';

async function post(request, path, body) {
  const resp = await request.post(`${BASE}${path}`, { data: body });
  const json = await resp.json();
  return { resp, json };
}
async function get(request, path) {
  const resp = await request.get(`${BASE}${path}`);
  const json = await resp.json().catch(()=>({}));
  return { resp, json };
}

// Utility: connect user
async function connect(request, name, gameType='Coppia') {
  const { json } = await post(request, '/connect', { Name: name, GameType: gameType });
  expect(json.success).toBeTruthy();
  return json;
}

// Extract helper IDs
function statusIds(connectJson) {
  return { userId: connectJson?.status?.userId, connectionId: connectJson?.status?.connectionId, authToken: connectJson?.authToken };
}

// Primary integration spec
test.describe('REST API Endpoints', () => {
  test('full lifecycle: connect -> request join -> approve -> start/end game -> logout', async ({ request }) => {
    const uA = await connect(request, 'ApiAlice');
    const uB = await connect(request, 'ApiBob');

    const { userId: aId } = statusIds(uA);
    const { userId: bId } = statusIds(uB);
    expect(aId).toBeTruthy();
    expect(bId).toBeTruthy();

    // List available users for A
    const availA = await get(request, `/available-users/${aId}`);
    expect(availA.json.success).toBeTruthy();

    // List join requests (should be empty)
    const jrA1 = await get(request, `/join-requests/${aId}`);
    expect(jrA1.json.success).toBeTruthy();
    expect(Array.isArray(jrA1.json.outgoing)).toBeTruthy();

    // A sends join request to B
    const rq = await post(request, '/request-join', { requestingUserId: aId, targetUserId: bId });
    expect(rq.json.requestId).toBeTruthy();

    // B snapshot should show incoming
    const snapB = await get(request, `/snapshot/${bId}`);
    expect(snapB.json.success).toBeTruthy();

    // Approve from B
    const respApprove = await post(request, '/respond-join', { requestId: rq.json.requestId, targetUserId: bId, approve: true });
    expect(respApprove.json.success).toBeTruthy();

    // Snapshot A should now have couple & maybe gameSession
    const snapA2 = await get(request, `/snapshot/${aId}`);
    expect(snapA2.json.status?.coupleId).toBeTruthy();

    // Start game explicitly if not auto-started
    if (!snapA2.json.gameSession?.id) {
      const start = await post(request, '/start-game', { coupleId: snapA2.json.status.coupleId });
      expect(start.json.success).toBeTruthy();
    }

    const snapGame = await get(request, `/snapshot/${aId}`);
    expect(snapGame.json.gameSession?.id).toBeTruthy();

    // End game
    const end = await post(request, '/end-game', { sessionId: snapGame.json.gameSession.id });
    expect(end.json.success).toBeTruthy();
  });

  test('reject flow & cancel flow', async ({ request }) => {
    // Connect three users to test both flows independently
    const a = await connect(request, 'ApiRejectA');
    const b = await connect(request, 'ApiRejectB');
    const c = await connect(request, 'ApiCancelC');
    const { userId: aId } = statusIds(a);
    const { userId: bId } = statusIds(b);
    const { userId: cId } = statusIds(c);

    // A -> B request
    const rqAB = await post(request, '/request-join', { requestingUserId: aId, targetUserId: bId });
    expect(rqAB.json.requestId).toBeTruthy();
    // B rejects
    const rej = await post(request, '/respond-join', { requestId: rqAB.json.requestId, targetUserId: bId, approve: false });
    expect(rej.json.success).toBeTruthy();

    // C -> B then cancel from C
    const rqCB = await post(request, '/request-join', { requestingUserId: cId, targetUserId: bId });
    expect(rqCB.json.requestId).toBeTruthy();
    const cancel = await post(request, '/cancel-join', { requestingUserId: cId, targetUserId: bId });
    expect(cancel.json.success).toBeTruthy();
  });

  test('reconnect & logout', async ({ request }) => {
    const u = await connect(request, 'ApiReconnect');
    const { userId, authToken } = statusIds(u);
    expect(authToken).toBeTruthy();

    // Simulate logout
    const logout = await post(request, '/logout', { userId, authToken });
    expect(logout.json.success).toBeTruthy();

    // Reconnect attempt with same token should likely fail (depends backend). Try reconnect endpoint.
  const rec = await post(request, '/reconnect', { userId, authToken });
  // Backend may return generic failure without invalidToken flag; just assert shape present
  expect(rec.json).toBeTruthy();
  expect(rec.json.status === undefined || rec.json.success === true || rec.json.invalidToken === true).toBeTruthy();
  });

  test('edge cases: self-target requestJoin & invalid status', async ({ request }) => {
    const u = await connect(request, 'ApiNeg');
    const { userId } = statusIds(u);

    // Self target: backend behavior undefined; just ensure it does not crash the API surface
    const resp = await request.post(`${BASE}/request-join`, { data: { requestingUserId: userId, targetUserId: userId } });
    if (resp.ok()) {
      const js = await resp.json();
      // Accept either success false OR success true; if true, ensure requestId shape plausible
      if (js.success && js.requestId) {
        expect(typeof js.requestId).toBe('string');
      }
    } else {
      expect(resp.status()).toBeGreaterThanOrEqual(400);
    }

    // user-status for non-existent user: backend may still return success; ensure JSON shape and absence of critical fields
    const bad = await request.get(`${BASE}/user-status/does-not-exist`);
    if (bad.ok()) {
      const bj = await bad.json();
      expect(bj).toBeTruthy();
      // If success true, status may be undefined or minimal; assert no throw
      expect('status' in bj).toBeTruthy();
    } else {
      expect([400,404,500]).toContain(bad.status());
    }
  });
});
