import { expect, test, beforeAll } from 'vitest';

const API = 'http://localhost:5000/api/EventDrivenGame';
async function post(p,b){const r=await fetch(`${API}${p}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw new Error(d.error||r.statusText);return d;}
async function get(p){const r=await fetch(`${API}${p}`);const d=await r.json();if(!r.ok)throw new Error(d.error||r.statusText);return d;}

let A,B,sessionId;

beforeAll(async () => {
  A = await post('/connect', { Name: 'CardA', GameType: 'couple' }).then(r=>({ id:r.status.userId }));
  B = await post('/connect', { Name: 'CardB', GameType: 'couple' }).then(r=>({ id:r.status.userId }));
  const req = await post('/request-join', { requestingUserId: A.id, targetUserId: B.id });
  const resp = await post('/respond-join', { requestId: req.requestId, targetUserId: B.id, approve: true });
  sessionId = resp.gameSession.id;
});

test('draw card updates sharedCards', async () => {
  // A draws a card
  const drawResp = await post('/draw-card', { sessionId, userId: A.id });
  expect(drawResp.success).toBe(true);
  expect(drawResp.card).toBeDefined();
  const snapA = await get(`/snapshot/${A.id}`);
  const snapB = await get(`/snapshot/${B.id}`);
  expect(snapA.gameSession.sharedCards.length).toBeGreaterThan(0);
  expect(snapB.gameSession.sharedCards.length).toBe(snapA.gameSession.sharedCards.length);
  const latest = snapA.gameSession.sharedCards.at(-1);
  expect(latest.sharedById).toBe(A.id);
});
