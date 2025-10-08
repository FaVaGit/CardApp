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
const SessionRestorePrompt = lazy(()=>import('./components/SessionRestorePrompt'));
const UserDirectory = lazy(()=>import('./UserDirectory'));
const TTLSettings = lazy(()=>import('./TTLSettings'));
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, Divider, Drawer, Tabs, Tab, Button } from '@mui/material';
import DarkModeToggle from './components/DarkModeToggle.jsx';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';
import TerminalIcon from '@mui/icons-material/Terminal';
// Componenti decorativi
import FloatingHearts from './components/FloatingHearts.jsx';
import GradientOverlay from './components/GradientOverlay.jsx';
import FloatingParticles from './components/FloatingParticles.jsx';
const CanvasCardTable = lazy(()=>import('./components/CanvasCardTable'));

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
  // Session restore prompt state
  const [sessionRestoreData, setSessionRestoreData] = useState(null); // null | { sessionId, partnerName, lastPlayed }
  // Toast system semplificato: per ora solo log, nessuno stato React per evitare lint errors
  const pushToast = (text, tone='info') => console.log('[toast]', tone, text);
  // Info / Diagnostics UI
  const [infoAnchor, setInfoAnchor] = useState(null); // menu anchor
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoTab, setInfoTab] = useState(0); // 0=Info,1=TTL,2=Debug

  const openInfoMenu = (e)=> setInfoAnchor(e.currentTarget);
  const closeInfoMenu = ()=> setInfoAnchor(null);
  const openDiagnostics = (tabIndex=0)=>{ 
    // Chiudi prima il menu per evitare che il backdrop intercetti click sul drawer
    closeInfoMenu();
    setInfoTab(tabIndex); 
    setDrawerOpen(true); 
  };

  // Session restore handlers
  const handleRestoreSession = async (_sessionId) => {
    try {
      setSelectedGameType(prev => prev || { id: 'Couple', name: 'Gioco di Coppia' });
      setCurrentScreen('playing');
      setSessionRestoreData(null); // Chiudi il prompt
      pushToast('Sessione di gioco ripristinata!','success');
    } catch (error) {
      console.error('Errore durante il ripristino della sessione:', error);
      pushToast('Errore durante il ripristino','error');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await apiService.endGame(sessionId);
      setSessionRestoreData(null); // Chiudi il prompt
      pushToast('Sessione precedente terminata','info');
    } catch (error) {
      console.error('Errore durante la terminazione della sessione:', error);
      pushToast('Errore durante la terminazione','error');
    }
  };

  // (pushToast definito sopra)

  console.log('🚀 SimpleApp rendering...', { currentScreen, authenticatedUser, selectedGameType });

  // Cleanup on unmount
  useEffect(() => {
    // Espone apiService per test Playwright solo se flag VITE_E2E === '1'
    if (typeof window !== 'undefined') {
      if (import.meta?.env?.VITE_E2E === '1') {
        window.__apiService = apiService;
      } else if (window.__apiService) {
        // Rimuovi se presente da build precedente
        try { delete window.__apiService; } catch { window.__apiService = undefined; }
      }
    }
  }, [apiService]);

  useEffect(() => {
    return () => {
      apiService.disconnectUser().catch(console.error);
    };
  }, [apiService]);

  // Auto switch to playing when backend starts a game session (e.g., dopo accept join coppia)
  useEffect(() => {
    const handler = (payload) => {
      console.log('🎮 gameSessionStarted event ricevuto:', payload);
      
      // Se siamo già in playing, procedi normalmente
      if (currentScreen === 'playing') {
        return;
      }
      
      // Se è una nuova sessione (appena creata da join/acceptance), procedi direttamente
      if (payload.isNewSession || payload.partnerInfo) {
        setSelectedGameType(prev => prev || { id: 'Couple', name: 'Gioco di Coppia' });
        setCurrentScreen('playing');
        pushToast('Partita di coppia avviata!','success');
      } else {
        // È un ripristino di sessione esistente - SEMPRE mostra il prompt di conferma
        setSessionRestoreData({
          sessionId: payload.sessionId,
          partnerName: payload.partnerName || 'Partner sconosciuto',
          lastPlayed: payload.lastPlayed || new Date().toISOString()
        });
        // Non procedere automaticamente - attendere decisione utente
      }
    };
    apiService.on('gameSessionStarted', handler);
    return () => apiService.off('gameSessionStarted', handler);
  }, [apiService, currentScreen]);

  useEffect(() => {
  const coupleHandler = async (data) => {
      console.log('🎉 coupleJoined event received:', data, 'currentScreen:', currentScreen);
      
      if (currentScreen === 'game-selection') pushToast('Coppia formata, avvio in corso...','info');
      
      // Se abbiamo informazioni sulla sessione di gioco, avviala immediatamente
      if (data.gameSession || data.sessionId) {
        const sessionId = data.gameSession?.id || data.sessionId;
        console.log('✅ Session info available in coupleJoined, starting game with sessionId:', sessionId);
        if (sessionId) {
          setSelectedGameType(prev => prev || { id: 'Couple', name: 'Gioco di Coppia' });
          setCurrentScreen('playing');
          pushToast('Partita di coppia avviata!','success');
        }
      } else {
        console.log('⏳ No session info in coupleJoined, triggering polling for session detection');
        // Forza un poll immediato e poi uno ritardato
        apiService.pollForUpdates();
        setTimeout(() => {
          console.log('⏳ Delayed polling for session...');
          apiService.pollForUpdates();
        }, 1000);
        
        // Fallback aggressivo: se dopo 1.5 secondi non abbiamo una sessione, forza transizione
        setTimeout(async () => {
          if (currentScreen !== 'playing') {
            console.log('🔄 Fallback: forcing session check after 1.5s delay');
            // Verifica se abbiamo un sessionId nel service
            if (apiService.sessionId) {
              console.log('✅ Found sessionId in service, transitioning to game');
              setSelectedGameType(prev => prev || { id: 'Couple', name: 'Gioco di Coppia' });
              setCurrentScreen('playing');
              pushToast('Partita di coppia avviata!','success');
            }
          }
        }, 1500);
      }
    };
    apiService.on('coupleJoined', coupleHandler);
    return () => apiService.off('coupleJoined', coupleHandler);
  }, [apiService, currentScreen]);

  // Listen for session termination events from partner
  useEffect(() => {
    const sessionEndedHandler = (data) => {
      console.log('🎮 gameSessionEnded event ricevuto:', data);
      // Se il nostro partner ha terminato la sessione, notifichiamo l'utente
      if (currentScreen === 'playing' && data.sessionId) {
        pushToast('Il partner ha terminato la sessione di gioco','warning');
        // Torna alla lobby automaticamente
        handleBackToLobby();
      }
      // Se abbiamo il prompt aperto e la sessione viene terminata dall'esterno, chiudilo
      if (sessionRestoreData && sessionRestoreData.sessionId === data.sessionId) {
        setSessionRestoreData(null);
        pushToast('La sessione è stata terminata','info');
      }
    };
    apiService.on('gameSessionEnded', sessionEndedHandler);
    return () => apiService.off('gameSessionEnded', sessionEndedHandler);
  }, [apiService, currentScreen, sessionRestoreData]);

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
    <Box sx={{ 
      minHeight:'100vh', 
      position: 'relative',
      overflow: 'hidden',
      p:3 
    }}>
      {/* Elementi decorativi per la lobby */}
      <GradientOverlay variant="gentle" intensity="low" />
      <FloatingHearts count={4} size="small" speed="slow" />
      <FloatingParticles count={6} type="flowers" color="purple" size="small" speed="normal" />
      
      <AppBar 
        position="sticky" 
        color="primary" 
        elevation={4} 
        sx={{ mb:3 }}
        className="glass-effect animate-slide-up"
      >
        <Toolbar variant="dense" sx={{ display:'flex', alignItems:'center' }}>
          <Typography 
            variant="h6" 
            fontWeight={600} 
            sx={{ display:'flex', alignItems:'center', gap:1 }}
            className="text-gradient"
          >
            💑 Lobby di Coppia
          </Typography>
          <Box sx={{ flexGrow:1 }} />
          <Typography 
            variant="caption" 
            sx={{ mr:2, fontWeight:600 }}
            className="animate-twinkle"
          >
            Codice: {authenticatedUser?.userCode}
          </Typography>
          <DarkModeToggle />
          <IconButton data-testid="info-button" color="inherit" size="small" onClick={openInfoMenu}><InfoOutlinedIcon/></IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ maxWidth:960, mx:'auto', display:'grid', gap:3, gridTemplateColumns:{ xs:'1fr', md:'1fr 1fr' } }}>
        <Box>
          <Box 
            sx={{ 
              mb:2, 
              p:2.5, 
              bgcolor:'background.paper', 
              borderRadius:3, 
              border:'1px solid', 
              borderColor:'divider' 
            }}
            className="glass-effect animate-fade-in shadow-soft"
          >
            <Typography variant="subtitle1" fontWeight={700}>Ciao {authenticatedUser?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Invita un partner tramite la directory utenti oppure fai accedere il secondo utente cliccando "Accesso Secondo Utente" qui sotto.
            </Typography>
            <Typography variant="body2" color="primary.main" sx={{ mt:1, fontWeight:500 }}>
              💡 Per il gioco di coppia: entrambi gli utenti devono essere connessi
            </Typography>
          </Box>
          <Box 
            sx={{ 
              p:2.5, 
              bgcolor:'background.paper', 
              borderRadius:3, 
              mb:2, 
              border:'1px solid', 
              borderColor:'divider' 
            }}
            className="glass-effect animate-scale-in shadow-romantic"
          >
            <Button 
              fullWidth 
              variant="contained" 
              size="large" 
              onClick={() => handleGameTypeSelected({ id: 'Single', name: 'Gioco Singolo' }, authenticatedUser)} 
              sx={{ 
                background:'linear-gradient(90deg,#ec407a,#ba68c8)', 
                fontWeight:600, 
                letterSpacing:'.5px', 
                py:1.2 
              }}
              className="animate-bounce-soft"
            >
              🎴 Avvia Gioco Singolo
            </Button>
          </Box>
          <Box 
            sx={{ 
              p:2.5, 
              bgcolor:'background.paper', 
              borderRadius:3, 
              border:'1px solid', 
              borderColor:'divider' 
            }}
            className="glass-effect animate-slide-up shadow-soft"
          >
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
          <Box sx={{ mt:3, display:'flex', gap:1, flexDirection:'column' }}>
            <Box sx={{ display:'flex', gap:1 }}>
              <Button onClick={handleLogout} variant="outlined" color="inherit" fullWidth>Logout</Button>
              <Button onClick={clearAllUsers} variant="contained" color="error" fullWidth>Pulisci</Button>
            </Box>
            <Button 
              onClick={() => { 
                localStorage.removeItem('complicity_auth'); 
                setAuthenticatedUser(null); 
                setCurrentScreen('auth'); 
              }} 
              variant="contained" 
              color="secondary" 
              fullWidth
              size="large"
              sx={{
                background:'linear-gradient(90deg,#ba68c8,#8e24aa)', 
                fontWeight:600, 
                letterSpacing:'.5px', 
                py:1.2,
                mt:1
              }}
              className="animate-pulse-soft"
            >
              👥 Accesso Secondo Utente
            </Button>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              align="center"
              sx={{ mt:1 }}
            >
              Per il gioco di coppia, il secondo utente deve accedere da qui
            </Typography>
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
        <MenuItem onClick={()=>{openDiagnostics(0); closeInfoMenu();}}><InfoOutlinedIcon fontSize="small" style={{marginRight:8}}/> Info</MenuItem>
        <MenuItem data-testid="menu-ttl" onClick={()=>{openDiagnostics(1); closeInfoMenu();}}><SettingsIcon fontSize="small" style={{marginRight:8}}/> TTL / Impostazioni</MenuItem>
        <MenuItem onClick={()=>{openDiagnostics(2); closeInfoMenu();}}><BugReportIcon fontSize="small" style={{marginRight:8}}/> Debug</MenuItem>
        <MenuItem onClick={()=>{openDiagnostics(3); closeInfoMenu();}}><TerminalIcon fontSize="small" style={{marginRight:8}}/> Canvas</MenuItem>
      </Menu>
      <Drawer anchor="right" open={drawerOpen} onClose={()=>setDrawerOpen(false)} data-testid="diagnostics-drawer">
        <Box sx={{ width:{ xs:300, sm:380 }, p:2 }} role="presentation" data-testid="diagnostics-content">
          <Tabs value={infoTab} onChange={(_,v)=>setInfoTab(v)} variant="scrollable" allowScrollButtonsMobile size="small" sx={{ mb:2 }}>
            <Tab label="Info" />
            <Tab label="TTL" data-testid="ttl-tab" />
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
         
         {/* Session Restore Prompt - Integrated UI for session confirmation */}
         {sessionRestoreData && (
           <SessionRestorePrompt
             sessionInfo={sessionRestoreData}
             partnerInfo={{ name: sessionRestoreData.partnerName }}
             onRestore={() => handleRestoreSession(sessionRestoreData.sessionId)}
             onTerminate={() => handleTerminateSession(sessionRestoreData.sessionId)}
           />
         )}
       </Suspense>
     </ErrorBoundary>
   );
}
