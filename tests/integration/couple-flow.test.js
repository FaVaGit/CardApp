import { expect, test, beforeAll } from 'vitest';

const API = 'http://localhost:5000/api/EventDrivenGame';

async function post(path, body) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||res.statusText);
  return data;
}
async function get(path) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||res.statusText);
  return data;
}

async function connect(name) {
  const resp = await post('/connect', { Name: name, GameType: 'couple' });
  expect(resp.success).toBe(true);
  return { userId: resp.status.userId, code: resp.personalCode };
}

let userA, userB;

beforeAll(async () => {
  userA = await connect('TestA');
  userB = await connect('TestB');
});

// NOTE: backend auto-starts session after approve

test('couple approve produces partnerInfo and no waiting after start', async () => {
  // A richiede B
  const req = await post('/request-join', { requestingUserId: userA.userId, targetUserId: userB.userId });
  expect(req.success).toBe(true);
  // B approva
  const resp = await post('/respond-join', { requestId: req.requestId, targetUserId: userB.userId, approve: true });
  expect(resp.success).toBe(true);
  expect(resp.approved).toBe(true);
  expect(resp.coupleId).toBeDefined();
  expect(resp.gameSession?.id).toBeDefined();
  // Snapshot del richiedente (A)
  const snap = await get(`/snapshot/${userA.userId}`);
  expect(snap.status?.coupleId).toBe(resp.coupleId);
  expect(snap.partnerInfo?.userId).toBe(userB.userId);
  expect(snap.gameSession?.id).toBe(resp.gameSession.id);
});
