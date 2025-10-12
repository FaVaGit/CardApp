import { expect, test, beforeAll } from 'vitest';

const API = 'http://localhost:5000/api/EventDrivenGame';
async function post(path, body) { const r = await fetch(`${API}${path}`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}); const d=await r.json(); if(!r.ok) throw new Error(d.error||r.statusText); return d; }
async function get(path) { const r = await fetch(`${API}${path}`); const d=await r.json(); if(!r.ok) throw new Error(d.error||r.statusText); return d; }

let A,B;

beforeAll(async () => {
  A = await post('/connect', { Name: 'StabA', GameType: 'couple' }).then(r=>({ id:r.status.userId }));
  B = await post('/connect', { Name: 'StabB', GameType: 'couple' }).then(r=>({ id:r.status.userId }));
  const req = await post('/request-join', { requestingUserId: A.id, targetUserId: B.id });
  const resp = await post('/respond-join', { requestId: req.requestId, targetUserId: B.id, approve: true });
  expect(resp.success).toBe(true);
});

test('snapshot stability partner + session unchanged', async () => {
  const first = await get(`/snapshot/${A.id}`);
  expect(first.partnerInfo?.userId).toBe(B.id);
  expect(first.gameSession?.id).toBeDefined();
  const sessionId = first.gameSession.id;
  const second = await get(`/snapshot/${A.id}`);
  expect(second.partnerInfo?.userId).toBe(B.id);
  expect(second.gameSession?.id).toBe(sessionId);
});
