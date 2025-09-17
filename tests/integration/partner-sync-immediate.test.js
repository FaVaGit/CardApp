import { expect, test } from 'vitest';

const API = 'http://localhost:5000/api/EventDrivenGame';
async function post(p,b){const r=await fetch(`${API}${p}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw new Error(d.error||r.statusText);return d;}
async function get(p){const r=await fetch(`${API}${p}`);const d=await r.json();if(!r.ok)throw new Error(d.error||r.statusText);return d;}

// Questo test verifica che immediatamente dopo l'approvazione la snapshot del richiedente abbia partnerInfo non nullo.

test('partnerInfo immediato nello snapshot del richiedente', async () => {
  const A = await post('/connect', { Name: 'ImmediateA', GameType: 'couple' }).then(r=>({ id:r.status.userId }));
  const B = await post('/connect', { Name: 'ImmediateB', GameType: 'couple' }).then(r=>({ id:r.status.userId }));
  const req = await post('/request-join', { requestingUserId: A.id, targetUserId: B.id });
  const resp = await post('/respond-join', { requestId: req.requestId, targetUserId: B.id, approve: true });
  expect(resp.success).toBe(true);
  expect(resp.approved).toBe(true);
  expect(resp.coupleId).toBeDefined();
  // snapshot immediato del richiedente (A)
  const snap = await get(`/snapshot/${A.id}`);
  expect(snap.success).toBe(true);
  expect(snap.status?.coupleId).toBe(resp.coupleId);
  expect(snap.partnerInfo?.userId).toBe(B.id);
  expect(snap.gameSession?.id).toBeDefined();
});
