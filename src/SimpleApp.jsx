import { useState, useEffect } from 'react';

function ErrorBoundary({ children }) {
  const [err, setErr] = useState(null);
  useEffect(() => {
    const orig = console.error;
    console.error = (...a) => { orig(...a); if (!err && a[0] instanceof Error) setErr(a[0]); };
    return () => { console.error = orig; };
  }, [err]);
  if (err) {
    return <div className="p-6 text-sm text-red-700 bg-red-50">Errore runtime: {String(err.message || err)}<pre className="mt-2 text-xs whitespace-pre-wrap">{err.stack}</pre></div>;
  }
  return children;
}
// Auth replaced with modern AuthPortal (MUI + password)
import AuthPortal from './components/AuthPortal.jsx';
import { Suspense, lazy } from 'react';
import EventDrivenApiService from './EventDrivenApiService';
// Lazy loaded heavy modules
const SimpleCardGame = lazy(()=>import('./SimpleCardGame'));
const CoupleGame = lazy(()=>import('./CoupleGame'));
const UserDirectory = lazy(()=>import('./UserDirectory'));
const TTLSettings = lazy(()=>import('./TTLSettings'));
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, Divider, Drawer, Tabs, Tab, Button } from '@mui/material';
import DarkModeToggle from './components/DarkModeToggle.jsx';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BugReportIcon from '@mui/icons-material/BugReport';
import TerminalIcon from '@mui/icons-material/Terminal';
import SettingsIcon from '@mui/icons-material/Settings';
import CanvasCardTable from './components/CanvasCardTable.jsx';

/**
 * MODERNIZED APP ARCHITECTURE - Event-Driven RabbitMQ
 * 
 * Clear separation of concerns:
 * 1. Authentication with auto-user creation
 * 2. Game Type Selection using new EventDrivenGameController API
 * 3. Card Game with RabbitMQ event publishing
 * 
 * Each component uses the unified EventDrivenApiService
 * Real-time updates via RabbitMQ event system
 */
export default function SimpleApp() {
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth', 'lobby', 'playing'
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState(null); // null / Single / auto 'Couple'
  const [apiService] = useState(new EventDrivenApiService());
  const [purging, setPurging] = useState(false);
  const [joinCounts, setJoinCounts] = useState({ incoming: 0, outgoing: 0 });
  const [toasts, setToasts] = useState([]);
  // Info / Diagnostics UI
  const [infoAnchor, setInfoAnchor] = useState(null); // menu anchor
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoTab, setInfoTab] = useState(0); // 0=Info,1=TTL,2=Debug

  const openInfoMenu = (e)=> setInfoAnchor(e.currentTarget);
  const closeInfoMenu = ()=> setInfoAnchor(null);
  const openDiagnostics = (tabIndex=0)=>{ setInfoTab(tabIndex); setDrawerOpen(true); closeInfoMenu(); };

  const pushToast = (text, tone='info') => {
    const id = Date.now()+Math.random();
    setToasts(t => [...t, { id, text, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  console.log('🚀 SimpleApp rendering...', { currentScreen, authenticatedUser, selectedGameType });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiService.disconnectUser().catch(console.error);
    };
  }, [apiService]);

  // Auto switch to playing when backend starts a game session (e.g., dopo accept join coppia)
  useEffect(() => {
    const handler = (payload) => {
      console.log('🎮 gameSessionStarted event ricevuto:', payload);
      setSelectedGameType(prev => prev || { id: 'Couple', name: 'Gioco di Coppia' });
      setCurrentScreen('playing');
      pushToast('Partita di coppia avviata!','success');
    };
    apiService.on('gameSessionStarted', handler);
    return () => apiService.off('gameSessionStarted', handler);
  }, [apiService]);

  useEffect(() => {
    const coupleHandler = (data) => {
      if (currentScreen === 'game-selection') pushToast('Coppia formata, avvio in corso...','info');
    };
    apiService.on('coupleJoined', coupleHandler);
    return () => apiService.off('coupleJoined', coupleHandler);
  }, [apiService, currentScreen]);

  // Clear all users (admin function) - using new API
  const clearAllUsers = async () => {
    try {
      if (purging) return;
      if (!window.confirm('Sei sicuro di voler eliminare TUTTI gli utenti? Operazione distruttiva.')) return;
      setPurging(true);
      console.log('🧹 Avvio purge utenti (admin)...');
      const res = await apiService.purgeAllUsers();
      if (!res.success) {
        console.warn('Purge backend fallita, fallback a reset locale:', res.error);
        await apiService.disconnectUser();
      } else {
        console.log('✅ Purge backend completata');
      }
      // Reset stato app comunque
      localStorage.removeItem('complicity_auth');
      setCurrentScreen('auth');
      setAuthenticatedUser(null);
      setSelectedGameType(null);
    } catch (error) {
      console.error('❌ Error during reset:', error);
  } finally { setPurging(false); }
  };

  // Authentication successful - user is already connected via apiService
  const handleAuthSuccess = async (user) => {
    console.log('✅ Authentication successful:', user);
  setAuthenticatedUser(user);
  setCurrentScreen('lobby');
  };

  // Game type selected
  const handleGameTypeSelected = (gameType, updatedUser) => {
    console.log('✅ Game type selected:', gameType, updatedUser);
    setSelectedGameType(gameType);
    setAuthenticatedUser(updatedUser);
    if (gameType.id === 'Couple' || gameType.id === 'Coppia') {
      // Rimani in game-selection: la sessione di coppia partirà dopo join approvata
      return;
    }
    setCurrentScreen('playing');
  };

  // Logout with proper cleanup
  const handleLogout = async () => {
    console.log('🔄 Logging out...');
    
    try {
      // Attempt backend logout if token stored
      try {
        const stored = localStorage.getItem('complicity_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.authToken && apiService?.userId === parsed.userId) {
            await apiService.logout(parsed.authToken);
          } else {
            await apiService.disconnectUser();
          }
        } else {
          await apiService.disconnectUser();
        }
      } catch (e) {
        console.warn('Fallback disconnect:', e.message);
        await apiService.disconnectUser();
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
    
    // Clear stored auth to allow new registration
    localStorage.removeItem('complicity_auth');
    setCurrentScreen('auth');
    setAuthenticatedUser(null);
    setSelectedGameType(null);
  };

  // Back to game selection
  const handleBackToLobby = () => {
    console.log('🔄 Back to lobby...');
    setCurrentScreen('lobby');
    setSelectedGameType(null);
  };

   // Render game type selection screen
  const renderLobby = () => (
    <Box sx={{ minHeight:'100vh', background:(theme)=> theme.palette.gradient?.soft || 'linear-gradient(145deg,#fdf3f7 0%,#f3e5f5 60%)', p:3 }}>
      <AppBar position="sticky" color="primary" elevation={4} sx={{ mb:3, background:'linear-gradient(90deg,#8e24aa,#ec407a)' }}>
        <Toolbar variant="dense" sx={{ display:'flex', alignItems:'center' }}>
          <Typography variant="h6" fontWeight={600} sx={{ display:'flex', alignItems:'center', gap:1 }}>💑 Lobby di Coppia</Typography>
          <Box sx={{ flexGrow:1 }} />
          <Typography variant="caption" sx={{ mr:2, fontWeight:600 }}>Codice: {authenticatedUser?.userCode}</Typography>
          <DarkModeToggle />
          <IconButton color="inherit" size="small" onClick={openInfoMenu}><InfoOutlinedIcon/></IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ maxWidth:960, mx:'auto', display:'grid', gap:3, gridTemplateColumns:{ xs:'1fr', md:'1fr 1fr' } }}>
        <Box>
          <Box sx={{ mb:2, p:2.5, bgcolor:'background.paper', borderRadius:3, boxShadow:'0 4px 18px -6px rgba(142,36,170,.25)', border:'1px solid', borderColor:'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Ciao {authenticatedUser?.name}</Typography>
            <Typography variant="body2" color="text.secondary">Invita un partner o avvia una partita singola per iniziare subito.</Typography>
          </Box>
          <Box sx={{ p:2.5, bgcolor:'background.paper', borderRadius:3, boxShadow:'0 4px 18px -6px rgba(236,64,122,.35)', mb:2, border:'1px solid', borderColor:'divider' }}>
            <Button fullWidth variant="contained" size="large" onClick={() => handleGameTypeSelected({ id: 'Single', name: 'Gioco Singolo' }, authenticatedUser)} sx={{ background:'linear-gradient(90deg,#ec407a,#ba68c8)', fontWeight:600, letterSpacing:'.5px', py:1.2 }}>🎴 Avvia Gioco Singolo</Button>
          </Box>
          <Box sx={{ p:2.5, bgcolor:'background.paper', borderRadius:3, boxShadow:'0 4px 18px -6px rgba(142,36,170,.25)', border:'1px solid', borderColor:'divider' }}>
            <UserDirectory
              apiService={apiService}
              currentUser={authenticatedUser}
              onSendJoin={async (targetId) => { try { await apiService.requestJoin(targetId); } catch(e){ console.error(e);} }}
              onRespondJoin={async (requestingUserId, approve) => {
                try {
                  const jr = await apiService.listJoinRequests();
                  const incoming = jr.incoming || [];
                  const match = incoming.find(r => (r.RequestingUserId || r.requestingUserId) === requestingUserId);
                  if (match) { const reqId = match.Id || match.id; if (reqId) await apiService.respondJoin(reqId, approve); }
                } catch(e){ console.error('respondJoin error', e);} }}
              showCounts={true}
              onCountsChange={setJoinCounts}
            />
            <Box sx={{ mt:2, fontSize:12, p:1.2, borderRadius:2, background:'linear-gradient(90deg,#8e24aa0d,#ec407a14)', color:'secondary.dark', border:'1px solid', borderColor:'divider', display:'flex', justifyContent:'space-between' }}>
              <span>Richieste In: <b>{joinCounts.incoming}</b></span>
              <span>Out: <b>{joinCounts.outgoing}</b></span>
            </Box>
          </Box>
          <Box sx={{ mt:3, display:'flex', gap:1 }}>
            <Button onClick={handleLogout} variant="outlined" color="inherit" fullWidth>Logout</Button>
            <Button onClick={() => { localStorage.removeItem('complicity_auth'); setAuthenticatedUser(null); setCurrentScreen('auth'); }} variant="outlined" color="warning" fullWidth>Nuovo</Button>
            <Button onClick={clearAllUsers} variant="contained" color="error" fullWidth>Pulisci</Button>
          </Box>
        </Box>
        <Box sx={{ display:{ xs:'none', md:'block' } }}>
          <Box sx={{ p:2.5, bgcolor:'background.paper', borderRadius:3, boxShadow:'0 4px 22px -8px rgba(0,0,0,.15)', height:'100%', minHeight:400, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', border:'1px solid', borderColor:'divider' }}>
            <Typography variant="h6" gutterBottom>💞 Pronti a giocare</Typography>
            <Typography variant="body2" color="text.secondary" align="center">Crea connessione emotiva: pesca carte, condividi risposte, rafforza la vostra complicità.</Typography>
          </Box>
        </Box>
      </Box>
      <Menu anchorEl={infoAnchor} open={Boolean(infoAnchor)} onClose={closeInfoMenu} keepMounted>
        <MenuItem onClick={()=>openDiagnostics(0)}><InfoOutlinedIcon fontSize="small" style={{marginRight:8}}/> Info</MenuItem>
        <MenuItem onClick={()=>openDiagnostics(1)}><SettingsIcon fontSize="small" style={{marginRight:8}}/> TTL / Impostazioni</MenuItem>
        <MenuItem onClick={()=>openDiagnostics(2)}><BugReportIcon fontSize="small" style={{marginRight:8}}/> Debug</MenuItem>
        <MenuItem onClick={()=>openDiagnostics(3)}><TerminalIcon fontSize="small" style={{marginRight:8}}/> Canvas</MenuItem>
      </Menu>
      <Drawer anchor="right" open={drawerOpen} onClose={()=>setDrawerOpen(false)}>
        <Box sx={{ width:{ xs:300, sm:380 }, p:2 }} role="presentation">
          <Tabs value={infoTab} onChange={(_,v)=>setInfoTab(v)} variant="scrollable" allowScrollButtonsMobile size="small" sx={{ mb:2 }}>
            <Tab label="Info" />
            <Tab label="TTL" />
            <Tab label="Debug" />
            <Tab label="Canvas" />
          </Tabs>
          {infoTab===0 && <Box sx={{ fontSize:13, lineHeight:1.5 }}>
            <Typography variant="subtitle2" gutterBottom>Informazioni</Typography>
            <ul style={{ paddingLeft:18, margin:0 }}>
              <li>Utente: {authenticatedUser?.name}</li>
              <li>Codice: {authenticatedUser?.userCode}</li>
              <li>UserId: {apiService.userId}</li>
              <li>SessionId: {apiService.sessionId || '—'}</li>
            </ul>
          </Box>}
          {infoTab===1 && <Box><TTLSettings apiService={apiService} /></Box>}
          {infoTab===2 && <Box sx={{ fontSize:12 }}>
            <Typography variant="subtitle2">Diagnostics</Typography>
            <Divider sx={{ my:1 }} />
            <pre style={{ maxHeight:300, overflow:'auto', background:'#fafafa', padding:8, borderRadius:8 }}>{JSON.stringify({ joinCache: apiService.joinRequestCache, pruned: apiService.prunedJoinCount }, null, 2)}</pre>
          </Box>}
          {infoTab===3 && <Box sx={{ height:260, width:'100%' }}><CanvasCardTable card={{ content:'Canvas Debug' }} /></Box>}
        </Box>
      </Drawer>
    </Box>
  );

   return (
     <ErrorBoundary>
       <Suspense fallback={<div style={{ padding: 32 }}>Caricamento...</div>}>
         {currentScreen === 'auth' && (
           <AuthPortal apiService={apiService} onAuthSuccess={handleAuthSuccess} />
         )}
         {currentScreen === 'lobby' && renderLobby()}
         {currentScreen === 'playing' && selectedGameType && selectedGameType.id === 'Couple' && (
           <CoupleGame user={authenticatedUser} apiService={apiService} onExit={handleBackToLobby} />
         )}
         {currentScreen === 'playing' && selectedGameType && selectedGameType.id !== 'Couple' && (
           <SimpleCardGame user={authenticatedUser} gameType={selectedGameType} apiService={apiService} onExit={handleBackToLobby} />
         )}
         {!(currentScreen === 'auth' || currentScreen === 'lobby' || currentScreen === 'playing') && (
           <div className="min-h-screen bg-red-100 flex items-center justify-center">
             <div className="text-center">
               <h1 className="text-2xl font-bold text-red-800 mb-4">❌ Errore</h1>
               <p className="text-red-600 mb-4">Schermata sconosciuta: {currentScreen}</p>
               <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Torna al login</button>
             </div>
           </div>
         )}
       </Suspense>
     </ErrorBoundary>
   );
}
