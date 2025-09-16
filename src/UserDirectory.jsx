import { useEffect, useState } from 'react';

export default function UserDirectory({ apiService, currentUser, onSendJoin, onRespondJoin }) {
  const [users, setUsers] = useState([]);
  const [inbound, setInbound] = useState([]);
  const [outbound, setOutbound] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiresAfter, setExpiresAfter] = useState(10);
  const [now, setNow] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [expiredTargets, setExpiredTargets] = useState(new Set());

  useEffect(() => {
    if (!apiService || !currentUser) return;

    const load = async () => {
      try {
        const data = await apiService.listUsersWithRequests();
        if (data.success) {
          setUsers(data.users || []);
          setInbound(data.incoming || []);
          setOutbound(data.outgoing || []);
          if (data.expiresAfterMinutes) setExpiresAfter(data.expiresAfterMinutes);
        }
  } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();

    const tick = setInterval(() => setNow(Date.now()), 1000);

    const handleUsers = payload => {
      console.log('🔵 handleUsers called with users:', payload.users);
      setUsers(payload.users || []);
      // Prefer canonical incoming/outgoing names if present
      const inc = payload.incoming || payload.inbound || inbound;
      const out = payload.outgoing || payload.outbound || outbound;
      setInbound(inc || []);
      setOutbound(out || []);
    };
    const handleReq = cache => {
      const inc = cache.incoming || cache.inbound || [];
      const out = cache.outgoing || cache.outbound || [];
      setInbound(inc);
      setOutbound(out);
    };
    apiService.on('usersUpdated', handleUsers);
    apiService.on('joinRequestsUpdated', handleReq);
    const handleCouple = () => {
      // Coppia formata: rimuovi immediatamente badge 'In attesa' pulendo outbound/inbound
      setInbound([]);
      setOutbound([]);
      setExpiredTargets(new Set());
    };
    apiService.on('coupleJoined', handleCouple);
    const handleExpired = ({ request }) => {
      const tgt = request?.targetUserId || request?.TargetUserId;
      if (tgt) {
        setExpiredTargets(prev => new Set([...Array.from(prev), tgt]));
        addMsg('Richiesta scaduta', 'error');
      }
    };
    apiService.on('joinRequestExpired', handleExpired);
    return () => {
      apiService.off('usersUpdated', handleUsers);
      apiService.off('joinRequestsUpdated', handleReq);
      apiService.off('coupleJoined', handleCouple);
      apiService.off('joinRequestExpired', handleExpired);
      clearInterval(tick);
    };
  }, [apiService, currentUser, inbound, outbound]);

  // Debug data in component
  useEffect(() => {
    if (users.length > 0 || inbound.length > 0 || outbound.length > 0) {
      console.log('UserDirectory data:', {users, inbound, outbound});
    }
  }, [users, inbound, outbound]);

  const isPendingOutbound = userId => outbound.some(o => (o.TargetUserId || o.targetUserId) === userId || o === userId);
  const isPendingInbound = userId => inbound.some(i => (i.RequestingUserId || i.requestingUserId) === userId || i === userId);

  const pendingCreatedAt = (userId, inboundSide) => {
    const arr = inboundSide ? inbound : outbound;
    const rec = arr.find(r => (inboundSide ? (r.RequestingUserId||r.requestingUserId) : (r.TargetUserId||r.targetUserId)) === userId);
    return rec?.CreatedAt || rec?.createdAt;
  };

  const remainingSeconds = (createdAt) => {
    if (!createdAt) return null;
    const created = new Date(createdAt).getTime();
    const expireAt = created + expiresAfter * 60000;
    const diff = Math.max(0, Math.floor((expireAt - now)/1000));
    return diff;
  };

  const addMsg = (text, tone='info') => {
    const id = Date.now() + Math.random();
    setMessages(m => [...m.slice(-3), { id, text, tone }]);
    setTimeout(() => setMessages(m => m.filter(x => x.id !== id)), 5000);
  };

  const handleSend = async (id) => {
  try { await onSendJoin(id); addMsg('Richiesta inviata'); } catch{ addMsg('Errore invio richiesta','error'); }
  };
  const handleRespond = async (id, approve) => {
  try { await onRespondJoin(id, approve); addMsg(approve?'Richiesta accettata':'Richiesta rifiutata'); } catch{ addMsg('Errore risposta','error'); }
  };
  const handleCancel = async (id) => {
  try { await apiService.cancelJoin(id); addMsg('Richiesta annullata'); } catch{ addMsg('Errore annullamento','error'); }
  };

  if (loading) return <div className="text-sm text-gray-500">Caricamento elenco utenti...</div>;

  // Helper per gestire differenze di casing dalle API
  const getId = u => u.Id || u.id;
  const getName = u => u.Name || u.name || '';
  // L'endpoint ora esclude l'utente corrente; ricostruiamo un selfUser sintetico se necessario
  let selfUser = users.find(u => u.isSelf);
  if (!selfUser && currentUser) {
    selfUser = { isSelf: true, id: currentUser.userId, name: currentUser.name || 'Tu' };
  }
  const otherUsers = users
    .filter(u => !u.isSelf)
    .map(u => ({ ...u, _id: getId(u) }))
    .filter(u => u._id) // scarta record senza id
    .sort((a,b) => getName(a).localeCompare(getName(b), 'it', { sensitivity: 'base' }));

  const formatSeconds = (s) => {
    if (s == null) return '';
    const m = Math.floor(s/60);
    const r = s % 60;
    return m > 0 ? `${m}:${r.toString().padStart(2,'0')}` : `${r}s`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>Utenti disponibili</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{otherUsers.length}</span>
        </h3>
        <div className="text-[11px] text-gray-500">Aggiornato {new Date(now).toLocaleTimeString()}</div>
      </div>
      {messages.length>0 && (
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} className={`text-xs px-2 py-1 rounded border ${m.tone==='error'?"bg-red-100 text-red-700 border-red-200":"bg-green-100 text-green-700 border-green-200"}`}>{m.text}</div>
          ))}
        </div>
      )}
      {selfUser && (
        <div className="p-3 border border-blue-100 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 text-sm flex items-start justify-between">
          <div>
            <div className="font-semibold text-blue-700 flex items-center gap-2">
              <span>Tu</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">online</span>
            </div>
            <div className="text-gray-700 mt-0.5 flex flex-col">
              <span className="text-sm">{selfUser.Name || selfUser.name || 'Utente'}</span>
              <span className="text-xs text-blue-600 mt-1">Codice: <span className="font-mono font-medium">{selfUser.PersonalCode || selfUser.personalCode || '—'}</span></span>
            </div>
          </div>
          <div className="text-[10px] text-blue-500 font-mono opacity-70">ID
            <div className="truncate max-w-[90px]">{selfUser.Id || selfUser.id || '-'}</div>
          </div>
        </div>
      )}
      <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
        {otherUsers.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            <div className="mb-1">Nessun altro utente online</div>
            <div className="text-[11px] text-gray-400">Invita qualcuno a connettersi</div>
          </div>
        )}
        {otherUsers.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {otherUsers.map(u => {
              const uid = getId(u) || u._id;
              const pendingOut = isPendingOutbound(uid);
              const pendingIn = isPendingInbound(uid);
              const createdOut = pendingOut ? pendingCreatedAt(uid, false) : null;
              const createdIn = pendingIn ? pendingCreatedAt(uid, true) : null;
              const rs = remainingSeconds(createdOut || createdIn);
        const isExpired = expiredTargets.has(uid);
              return (
                <li key={`user-${uid}`} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-inner" aria-label="online" />
                        <span className="truncate max-w-[120px]" title={getName(u)}>{getName(u) || 'Senza nome'}</span>
                      </span>
                      {pendingIn && <span data-testid="incoming-request-badge" className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Richiesta per te</span>}
          {pendingOut && !isExpired && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">In attesa</span>}
          {pendingOut && isExpired && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded" title="Richiesta scaduta">Scaduta</span>}
                      {rs !== null && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" title="Tempo alla scadenza">{formatSeconds(rs)}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>Codice: <span className="font-mono">{u.PersonalCode || u.personalCode || '—'}</span></span>
                      <span className="text-[10px] text-gray-400 font-mono truncate max-w-[80px]">{uid || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {pendingIn && (
                      <>
                        <button data-testid="accept-request" onClick={() => handleRespond(uid, true)} className="text-[10px] bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">Accetta</button>
                        <button data-testid="reject-request" onClick={() => handleRespond(uid, false)} className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Rifiuta</button>
                      </>
                    )}
                    {!pendingIn && !pendingOut && (
                      uid === (currentUser?.userId) ? (
                        <span className="text-[10px] text-gray-400 px-2 py-1">(tu)</span>
                      ) : (
                        <button
                          data-testid="send-request"
                          onClick={() => {
                            if (window.__lastSendClick && Date.now() - window.__lastSendClick < 800) return; // debounce 800ms
                            window.__lastSendClick = Date.now();
                            handleSend(uid);
                          }}
                          className="text-[11px] bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded shadow-sm"
                          disabled={typeof window !== 'undefined' && window.__lastSendClick && Date.now() - window.__lastSendClick < 800}
                        >Richiedi</button>
                      )
                    )}
                    {pendingOut && !isExpired && (
                      <button data-testid="cancel-request" onClick={() => handleCancel(uid)} className="text-[10px] bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded">Annulla</button>
                    )}
                    {pendingOut && isExpired && (
                      <button onClick={() => handleSend(uid)} className="text-[10px] bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded">Riprova</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
