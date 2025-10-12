import { useState, useEffect, useRef, useCallback } from 'react';
// Whiteboard
import { SharedCanvas } from './SharedCanvas.jsx';
import { useBackend } from './useBackend.js';
import {
  Box,
  Grid,
  Snackbar,
  Alert,
  Stack,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BugReportIcon from '@mui/icons-material/BugReport';
import CardActionButtons from './components/CardActionButtons.jsx';
import CanvasCardTable from './components/CanvasCardTable.jsx';
import Whiteboard from './components/whiteboard/Whiteboard.jsx';
// Componenti decorativi
import FloatingHearts from './components/FloatingHearts.jsx';
import GradientOverlay from './components/GradientOverlay.jsx';
import AnimatedBorder from './components/AnimatedBorder.jsx';
import FloatingParticles from './components/FloatingParticles.jsx';

/**
 * Modern Couple Game Component - Event-Driven Architecture
 * 
 * Uses EventDrivenApiService with RabbitMQ backend
 * Features:
 * - Auto-couple matching with user codes
 * - Automatic game session creation
 * - Card drawing with event publishing
 * - Real-time partner status updates
 */
export default function CoupleGame({ user, apiService, onExit }) {
  // Rimuoviamo completamente lo stato intermedio: la UI di gioco viene montata subito.
  // Mostreremo un piccolo banner se la sessione non è ancora avviata, ma niente schermata separata.
  const [gameState] = useState('playing'); // stato fisso
  const [gameSession, setGameSession] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerInfo, setPartnerInfo] = useState(null); // Stores partner details (personalCode, name)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  // Whiteboard panel collapsed state (lavagna sempre montata)
  const [whiteboardCollapsed, setWhiteboardCollapsed] = useState(false);
  const {
    drawingStrokes,
    drawingNotes,
    addDrawingStroke,
    addDrawingNote,
    clearDrawing,
    undoDrawing,
    redoDrawing,
    getDrawingData
  } = useBackend();
  const [isRestoredSession, setIsRestoredSession] = useState(false); // Track if this is a restored session
  const [lavagnaState, setLavagnaState] = useState(null); // Stato sincronizzato della lavagna
  // Drawer rimossa – evitiamo duplicazione del log (unica colonna destra)
  const [snack, setSnack] = useState(null); // {text, type}
  // Flags per deduplicare i log
  const flagsRef = useRef({
    loggedWelcome: false,
    loggedWaiting: false,
    loggedCoupleFormed: false,
    loggedGameStarted: false,
  loggedSessionSync: false,
  loggedPartnerSyncDelay: false
  });
  const msgIdRef = useRef(0);
  const nextMsgId = useCallback(() => `${Date.now()}-${msgIdRef.current++}`, []);

  // Add status message helper
  const addMessage = useCallback((text, type = 'info') => {
    const message = {
      id: nextMsgId(),
      text,
      type, // 'info', 'success', 'error'
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev.slice(-9), message]); // Keep last 10 messages
    // mostra snackbar per success / error
    if (type === 'success' || type === 'error') setSnack({ text, type });
  }, [nextMsgId]);

  // Initialize couple game and setup event-driven listeners
  useEffect(() => {
    const displayCode = user.userCode || user.personalCode || 'N/A';
    const displayName = user.nickname || user.name || 'Utente';
    console.log('🚀 Initializing Couple Game for user:', displayName, 'with code:', displayCode);
    if (!flagsRef.current.loggedWelcome) {
      flagsRef.current.loggedWelcome = true;
      setMessages(prev => [...prev, { id: nextMsgId(), text: `Benvenuto ${displayName}! Il tuo codice è: ${displayCode}`, type: 'info', timestamp: new Date().toLocaleTimeString() }]);
    }
    const hasEstablished = !!(gameSession?.id || partnerInfo);
    if (!flagsRef.current.loggedWaiting && !hasEstablished) {
      addMessage('Attendi la conferma della coppia (richiesta/approvazione).', 'info');
      flagsRef.current.loggedWaiting = true;
    }

    // Setup event-driven listeners for RabbitMQ events (via polling)
    const setupEventListeners = () => {
      // Listen for couple joined events (RabbitMQ: CoupleCreated/CoupleUpdated)
      const handleCoupleJoined = (data) => {
        console.log('💑 Received couple joined event:', data);
        if (!flagsRef.current.loggedCoupleFormed) {
          addMessage('💑 Partner si è collegato alla coppia!', 'success');
        }
        if (data?.partner) {
          setPartnerInfo(data.partner);
          if (!partnerCode) {
            setPartnerCode(data.partner.personalCode || data.partner.userCode || '');
          }
          // Extra confirmation log for clarity (only if not already logged)
          const partnerDisplay = data.partner.personalCode || data.partner.userCode;
          if (partnerDisplay && !flagsRef.current.loggedCoupleFormed) {
            addMessage(`✅ Coppia formata con ${partnerDisplay}!`, 'success');
            flagsRef.current.loggedCoupleFormed = true;
          }
        }
        
        if (gameState === 'idle') {
          addMessage('⏳ Avvio automatico della sessione in corso...', 'info');
        }
      };

      // Listen for game session started events (RabbitMQ: GameSessionStarted)
      const handleGameSessionStarted = (data) => {
        console.log('🎮 Received game session started event:', data);
        
        // Controlla se questa è una sessione ripristinata confrontando con l'esistenza di partnerInfo
        if (partnerInfo && !flagsRef.current.loggedGameStarted) {
          setIsRestoredSession(true);
          addMessage('🔄 Sessione di gioco ripristinata', 'info');
        } else if (!flagsRef.current.loggedGameStarted) {
          addMessage('🎮 Partita avviata automaticamente!', 'success');
        }
        
        flagsRef.current.loggedGameStarted = true;
        if (data.sessionId) {
          setGameSession({ id: data.sessionId, isActive: true });
        }
      };

      // Listen for game session ended events (NEW)
      const handleGameSessionEnded = (data) => {
        console.log('🛑 Received game session ended event:', data);
        if (gameSession?.id && data?.sessionId === gameSession.id) {
          addMessage('🔚 Partita terminata (partner).', 'info');
        } else {
          addMessage('🔚 Partita terminata.', 'info');
        }
        setGameSession(null);
        setCurrentCard(null);
        // Non chiudiamo immediatamente la schermata per permettere eventuale nuova sessione; delega a onExit dal lato attivo
      };

      // Listen for card drawn events (RabbitMQ: CardDrawn)
      const handleCardDrawn = (cardData) => {
        console.log('🎴 Received card drawn event from partner:', cardData);
        if (cardData.card) {
          addMessage(`🎴 Partner ha pescato una carta`, 'info');
        }
      };

      // Listen for session updates (NEW - for card synchronization)
      const handleSessionUpdated = (updateData) => {
        console.log('🔄 Session updated:', updateData);
        
        if (updateData.type === 'cardDrawn' && updateData.card) {
          // Update current card for both partners
          setCurrentCard(updateData.card);
          
          // Add to activity log ONLY for partner actions (avoid duplicates)
          if (updateData.drawnBy !== user.userId) {
            addMessage(`🎴 Partner ha pescato: ${updateData.card.content}`, 'success');
          }
          // For own actions, the immediate response in handleDrawCard handles the message
        }
      };

      // Listen for partner updates (NEW - for partner info synchronization)
      const handlePartnerUpdated = (partnerData) => {
        console.log('👥 Partner updated:', partnerData);
        if (!partnerData) return;
        setPartnerInfo(partnerData);
        // Update partnerCode for second user (who didn't type it)
        if (!partnerCode) {
          setPartnerCode(partnerData.personalCode || partnerData.userCode || '');
        }
        if (!flagsRef.current.loggedCoupleFormed) {
          addMessage(`✅ Coppia formata con ${partnerData.personalCode || partnerData.userCode || 'partner'}!`, 'success');
          flagsRef.current.loggedCoupleFormed = true;
        }
      };

      // Diagnostica ritardo sincronizzazione partner
      const handlePartnerSyncDelay = (info) => {
        if (!flagsRef.current.loggedPartnerSyncDelay) {
          addMessage('⏱️ Ritardo nella sincronizzazione del partner... (diagnostica)', 'info');
          flagsRef.current.loggedPartnerSyncDelay = true;
        }
        console.warn('Partner sync delay diagnostic event:', info);
      };

      // Handler per sincronizzazione lavagna
      const handleLavagnaSync = (data) => {
        try {
          setLavagnaState(data);
          addMessage('🎨 Lavagna sincronizzata', 'info');
        } catch (e) {
          console.warn('Errore sync lavagna:', e);
        }
      };

      // Remove existing listeners to prevent duplicates
      apiService.off('coupleJoined', handleCoupleJoined);
      apiService.off('gameSessionStarted', handleGameSessionStarted);
  apiService.off('gameSessionEnded', handleGameSessionEnded);
      apiService.off('cardDrawn', handleCardDrawn);
      apiService.off('sessionUpdated', handleSessionUpdated);
      apiService.off('partnerUpdated', handlePartnerUpdated);
  apiService.off('partnerSyncDelay', handlePartnerSyncDelay);
      apiService.off('lavagnaSync', handleLavagnaSync);

      // Add listeners
      apiService.on('coupleJoined', handleCoupleJoined);
      apiService.on('gameSessionStarted', handleGameSessionStarted);
  apiService.on('gameSessionEnded', handleGameSessionEnded);
      apiService.on('cardDrawn', handleCardDrawn);
      apiService.on('sessionUpdated', handleSessionUpdated);
      apiService.on('partnerUpdated', handlePartnerUpdated);
  apiService.on('partnerSyncDelay', handlePartnerSyncDelay);
      apiService.on('lavagnaSync', handleLavagnaSync);

  return { handleCoupleJoined, handleGameSessionStarted, handleGameSessionEnded, handleCardDrawn, handleSessionUpdated, handlePartnerUpdated, handleLavagnaSync };
    };

    const listeners = setupEventListeners();

    // Cleanup event listeners on unmount
    return () => {
      apiService.off('coupleJoined', listeners.handleCoupleJoined);
      apiService.off('gameSessionStarted', listeners.handleGameSessionStarted);
  apiService.off('gameSessionEnded', listeners.handleGameSessionEnded);
      apiService.off('cardDrawn', listeners.handleCardDrawn);
      apiService.off('sessionUpdated', listeners.handleSessionUpdated);
      apiService.off('partnerUpdated', listeners.handlePartnerUpdated);
  apiService.off('partnerSyncDelay', listeners.handlePartnerSyncDelay);
      apiService.off('lavagnaSync', listeners.handleLavagnaSync);
    };
  // Nota dipendenze: intentionally non includiamo gameSession, partnerInfo, messages per evitare duplicazione listener.
  // addMessage è memoized; partnerCode viene letto solo inizialmente per eventuale set.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, apiService, gameState, partnerCode, addMessage, nextMsgId]);

  // Fallback: se il service ha già sessionId ma lo stato locale no, aggiorniamo
  useEffect(() => {
    if (!gameSession?.id && apiService.sessionId) {
      setGameSession({ id: apiService.sessionId, isActive: true });
      if (!flagsRef.current.loggedSessionSync) {
        addMessage('🔁 Sessione sincronizzata dal service.', 'info');
        flagsRef.current.loggedSessionSync = true;
      }
    }
    // Synthetic emission: se abbiamo partnerInfo o sessione tramite stato esterno ma non abbiamo ancora loggato coppia / partita
    if (partnerInfo && !flagsRef.current.loggedCoupleFormed) {
      addMessage(`✅ Coppia formata con ${partnerInfo.personalCode || partnerInfo.userCode || 'partner'}!`, 'success');
      flagsRef.current.loggedCoupleFormed = true;
    }
    if (gameSession?.id && !flagsRef.current.loggedGameStarted) {
      addMessage('🎮 Partita avviata automaticamente!', 'success');
      flagsRef.current.loggedGameStarted = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiService.sessionId, gameSession, addMessage]);

  // Rimosso flusso manuale: la coppia si forma via UserDirectory (join request)

  // Manual start removed: session avvia solo automaticamente

  // Handle drawing a card
  const handleDrawCard = async () => {
    if (!gameSession?.id) {
      setError('Nessuna sessione di gioco attiva');
      return;
    }

    setIsLoading(true);
    setError('');
    addMessage('🎴 Pescando carta...', 'info');

    try {
      const card = await apiService.drawCard(gameSession.id);
      
      // Update card immediately as fallback (sync will handle partner updates)
      if (card) {
        setCurrentCard(card);
        addMessage(`✅ Carta pescata: ${card.content || card.title || 'Carta'} 🎴`, 'success');
        console.log('🎴 Card draw successful:', card);
      }
      
      // The sessionUpdated event will handle partner synchronization
    } catch (error) {
      console.error('❌ Error drawing card:', error);
      setError(`Errore nel pescare la carta: ${error.message}`);
      addMessage(`❌ Errore nella pesca: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ending the game
  const handleEndGame = async () => {
    if (!gameSession?.id) {
      onExit();
      return;
    }

    setIsLoading(true);
    addMessage('🔚 Terminando partita...', 'info');

    try {
      await apiService.endGame(gameSession.id);
      addMessage('✅ Partita terminata!', 'success');
    } catch (error) {
      console.error('❌ Error ending game:', error);
      addMessage(`❌ Errore nella chiusura: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      onExit();
    }
  };

  // Funzione per inviare sincronizzazione lavagna
  const handleLavagnaChange = useCallback(async (nextState, meta) => {
    if (!gameSession?.id) return;
    try {
      await apiService.syncLavagna({
        sessionId: gameSession.id,
        json: nextState.json,
        bgColor: nextState.bgColor,
        version: nextState.version
      });
    } catch (e) {
      console.warn('Errore invio sync lavagna:', e);
    }
  }, [gameSession?.id, apiService]);

  // (Schermata partner search rimossa) Anche la schermata di preparazione è stata eliminata.

  // Render playing screen (ora sempre mostrata). Se la sessione non è ancora pronta mostriamo un badge "In attesa".
  const renderPlaying = () => (
    <Box sx={{ maxWidth: 1480, mx: 'auto', px: 2, py: 3 }}>
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={4} sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
              <FavoriteIcon color="secondary" />
              <Typography variant="h5" fontWeight={600}>Gioco di Coppia</Typography>
              {!gameSession?.id && (
                <Chip icon={<AccessTimeIcon />} color="warning" size="small" label="Sessione in avvio" sx={{ ml: 1 }} />
              )}
              {isRestoredSession && (
                <Chip icon={<AccessTimeIcon />} color="info" size="small" label="Sessione ripristinata" sx={{ ml: 1 }} />
              )}
              {flagsRef.current.loggedPartnerSyncDelay && !partnerInfo && (
                <Chip icon={<BugReportIcon />} color="warning" size="small" label="Diagnostica partner" />
              )}
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`Tu: ${user.name || user.Name || 'Tu'} (${user.userCode})`} color="primary" variant="outlined" />
              {partnerInfo && (
                <Chip label={`Partner: ${(partnerInfo?.name || partnerInfo?.Name || '—')} (${partnerInfo?.personalCode || partnerInfo?.userCode || partnerCode || '—'})`} color="secondary" variant="outlined" />
              )}
              {!partnerInfo && (
                <Chip label="Partner in sincronizzazione" color="warning" variant="outlined" />
              )}
              {gameSession?.id && (
                <Chip label={`Sessione ${gameSession.id.substring(0, 8)}`} size="small" />
              )}
            </Stack>

            <Box sx={{ mb: 3 }}>
              <Whiteboard
                height={360}
                value={lavagnaState}
                onChange={handleLavagnaChange}
                sessionId={gameSession?.id}
                userId={user.userId}
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <CanvasCardTable card={currentCard} />
            </Box>

            <CardActionButtons
              isLoading={isLoading}
              onDraw={handleDrawCard}
              onEnd={handleEndGame}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}
            {/* Hint lavagna mobile */}
            <Box sx={{ mt: 2, display: { md: 'none' } }}>
              <Chip size="small" variant="outlined" label="Lavagna sempre disponibile sotto" />
            </Box>
          </Paper>
        </Grid>
  <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 2, height: { md: '100%' } }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Log Attività</Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nessuna attività</Typography>
              ) : (
                <List dense>
                  {messages.map(m => (
                    <ListItem key={m.id} sx={{ py: 0.4 }}>
                      <ListItemText
                        primaryTypographyProps={{ fontSize: 13 }}
                        primary={`${m.timestamp} • ${m.text}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // Drawer/log duplicato rimosso – manteniamo solo la colonna destra per il log

  // Main render
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementi decorativi di sfondo */}
      <GradientOverlay variant="sunset" intensity="low" />
      <FloatingHearts count={6} size="small" speed="slow" />
      <FloatingParticles count={8} type="hearts" color="pink" size="small" speed="slow" />
      
      <AppBar position="sticky" elevation={3} color="primary" className="glass-effect">
        <Toolbar variant="dense">
          <Typography 
            variant="subtitle1" 
            sx={{ fontWeight: 600 }}
            className="text-gradient"
          >
            Complicità • Coppia
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {/* Whiteboard Indicator */}
          <Chip
            size="small"
            variant={whiteboardCollapsed ? 'outlined' : 'filled'}
            color={whiteboardCollapsed ? 'default' : 'secondary'}
            label={whiteboardCollapsed ? 'Lavagna (minimizzata)' : 'Lavagna aperta'}
            onClick={() => setWhiteboardCollapsed(v => !v)}
            sx={{ mr: 1, cursor: 'pointer' }}
          />
          {partnerInfo && (
            <Chip 
              size="small" 
              color="secondary" 
              label={partnerInfo.personalCode || partnerInfo.userCode} 
              sx={{ mr: 1 }}
              className="animate-pulse-soft" 
            />
          )}
          <Chip 
            size="small" 
            label={user.userCode} 
            variant="outlined"
            className="animate-twinkle" 
          />
        </Toolbar>
      </AppBar>
      {renderPlaying()}
      {/* Whiteboard Section always mounted with collapse */}
      <Box sx={{ maxWidth: 1480, mx: 'auto', px: 2, pb: 6 }}>
        <Paper elevation={6} sx={{ mt: 3, p: 2, position: 'relative', borderRadius: 4, background: 'linear-gradient(135deg, #ffffffcc, #f5f3ffcc)', backdropFilter: 'blur(10px)' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎨 Lavagna Condivisa
            </Typography>
            <Chip size="small" label={`${drawingStrokes.length} tratti`} variant="outlined" />
            <Chip size="small" label={`${drawingNotes.length} note`} variant="outlined" />
            <Box sx={{ flexGrow: 1 }} />
            <Chip
              size="small"
              variant={whiteboardCollapsed ? 'outlined' : 'filled'}
              color={whiteboardCollapsed ? 'default' : 'secondary'}
              label={whiteboardCollapsed ? 'Espandi' : 'Minimizza'}
              onClick={() => setWhiteboardCollapsed(v => !v)}
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
          {!whiteboardCollapsed && (
            <SharedCanvas
              strokes={drawingStrokes}
              notes={drawingNotes}
              currentUser={{ id: user.userId || user.id, name: user.name }}
              sessionId={gameSession?.id}
              onAddStroke={(s) => gameSession?.id && addDrawingStroke(gameSession.id, s)}
              onAddNote={(n) => gameSession?.id && addDrawingNote(gameSession.id, n)}
              onClearCanvas={() => gameSession?.id && clearDrawing(gameSession.id)}
              onUndo={() => gameSession?.id && undoDrawing(gameSession.id)}
              onRedo={() => gameSession?.id && redoDrawing(gameSession.id)}
              isReadOnly={!gameSession?.id}
            />
          )}
        </Paper>
      </Box>
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        {snack && <Alert onClose={() => setSnack(null)} severity={snack.type === 'error' ? 'error' : snack.type === 'success' ? 'success' : 'info'} sx={{ width: '100%' }}>{snack.text}</Alert>}
      </Snackbar>
    </Box>
  );
}
