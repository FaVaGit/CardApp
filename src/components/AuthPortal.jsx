import React, { useState, useEffect, Suspense } from 'react';
import { Box, Paper, Typography, TextField, Button, Tabs, Tab, Stack, Alert, InputAdornment, IconButton, Fade, Chip } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LoginIcon from '@mui/icons-material/Login';
import { hashPassword, hashWithNewSalt } from '../utils/passwordHash.js';
import FavoriteIcon from '@mui/icons-material/Favorite';
// Componenti decorativi
import FloatingHearts from './FloatingHearts.jsx';
import GradientOverlay from './GradientOverlay.jsx';
import AnimatedBorder from './AnimatedBorder.jsx';
import FloatingParticles from './FloatingParticles.jsx';
// Lazy load heavy Fabric background after idle
const LazyBg = React.lazy(()=> import('./CoupleBackgroundCanvas.jsx'));

/** Local user store structure in localStorage:
 * complicity_users = [{ id, name, nickname, userCode, personalCode, salt, hash }]
 */
const LS_USERS_KEY = 'complicity_users_v2';

function loadUsers(){
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY))||[]; } catch { return []; }
}
function saveUsers(users){ localStorage.setItem(LS_USERS_KEY, JSON.stringify(users)); }

export default function AuthPortal({ apiService, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [users, setUsers] = useState(loadUsers());

  useEffect(()=>{ setUsers(loadUsers()); }, []);
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      if (window.__E2E_AUTO_REGISTER) {
        console.log('[E2E] Auto register mode attivo');
      }
    }
  },[]);

  const resetFields = () => { setPassword(''); setConfirm(''); setError(''); };

  const handleRegister = async () => {
    if (!name.trim()) return setError('Nome richiesto');
    if (password.length < 4) return setError('Password minima 4 caratteri');
    if (password !== confirm) return setError('Password non coincidono');
    if (users.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) return setError('Utente esistente');
    setLoading(true); setError('');
    try {
      const { salt, hash } = await hashWithNewSalt(password);
      // Connect backend to get personalCode & IDs
      const connect = await apiService.connectUser(name.trim(), 'Coppia');
      const newUser = { id: connect.userId, name: name.trim(), nickname: nickname.trim(), userCode: connect.personalCode, personalCode: connect.personalCode, salt, hash };
      const updated = [...users, newUser];
      saveUsers(updated); setUsers(updated);
      localStorage.setItem('complicity_auth', JSON.stringify({ userId: connect.userId, personalCode: connect.personalCode, name: newUser.name, nickname: newUser.nickname, authToken: connect.authToken }));
  console.log('[AuthPortal] Registrazione completata', { user: newUser.name, id: connect.userId });
  if (typeof window !== 'undefined') window.__LAST_AUTH_SUCCESS = 'register';
  onAuthSuccess({ ...newUser, userId: connect.userId, connectionId: connect.connectionId, status: connect });
    } catch (e){ setError(e.message); } finally { setLoading(false); resetFields(); }
  };

  const handleLogin = async () => {
    if (!name.trim()) return setError('Nome richiesto');
    if (!password) {
      // In ambiente E2E possiamo consentire password vuota per semplificare test rapidi
      if (typeof window !== 'undefined' && window.__ALLOW_E2E_EMPTY_PWD) {
        setPassword('e2e');
      } else {
        return setError('Password richiesta');
      }
    }
  let existing = users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
    const autoRegister = typeof window !== 'undefined' && window.__E2E_AUTO_REGISTER;
    if (!existing && autoRegister) {
      // Fallback registrazione automatica durante E2E per retro-compatibilità con vecchi test senza tab switch
      try {
        const { salt, hash } = await hashWithNewSalt(password || 'e2e');
        const connect = await apiService.connectUser(name.trim(), 'Coppia');
        const newUser = { id: connect.userId, name: name.trim(), nickname: nickname.trim(), userCode: connect.personalCode, personalCode: connect.personalCode, salt, hash };
        const updated = [...users, newUser];
        saveUsers(updated); setUsers(updated);
        localStorage.setItem('complicity_auth', JSON.stringify({ userId: connect.userId, personalCode: connect.personalCode, name: newUser.name, nickname: newUser.nickname, authToken: connect.authToken }));
        onAuthSuccess({ ...newUser, userId: connect.userId, connectionId: connect.connectionId, status: connect });
        resetFields();
        return; // login flow completo
      } catch (e) {
        setError(e.message || 'Auto-registrazione fallita');
        return;
      }
    }
    if (!existing) return setError('Utente non registrato');
    setLoading(true); setError('');
    try {
      const hashed = await hashPassword(password, existing.salt);
      if (hashed !== existing.hash) { setError('Credenziali errate'); setLoading(false); return; }
      // Reconnect if same userId present else connect again (fresh session)
      let connect;
      try {
        connect = await apiService.reconnect(existing.id, localStorage.getItem('complicity_auth') ? JSON.parse(localStorage.getItem('complicity_auth')).authToken : undefined);
        if (connect?.invalidToken || !connect?.userId) {
          connect = await apiService.connectUser(existing.name, 'Coppia');
        }
      } catch { connect = await apiService.connectUser(existing.name, 'Coppia'); }
      localStorage.setItem('complicity_auth', JSON.stringify({ userId: connect.userId, personalCode: connect.personalCode, name: existing.name, nickname: existing.nickname, authToken: connect.authToken }));
  console.log('[AuthPortal] Login completato', { user: existing.name, id: connect.userId });
  if (typeof window !== 'undefined') window.__LAST_AUTH_SUCCESS = 'login';
  onAuthSuccess({ ...existing, userId: connect.userId, personalCode: connect.personalCode, connectionId: connect.connectionId, status: connect });
    } catch(e){ setError(e.message); } finally { setLoading(false); resetFields(); }
  };

  const [enableBg, setEnableBg] = useState(false);
  useEffect(()=>{
    const run = ()=> setEnableBg(true);
    if('requestIdleCallback' in window){ window.requestIdleCallback(run, { timeout:1800 }); } else { setTimeout(run, 800); }
  },[]);

  return (
    <Box data-testid="auth-portal" sx={{ 
      minHeight:'100vh', 
      width: '100vw',
      position:'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center', 
      p:3, 
      overflow: 'hidden'
    }}>
      {/* Elementi decorativi di sfondo - COMPLETAMENTE ISOLATI */}
      <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 0, 
        pointerEvents: 'none',
        isolation: 'isolate'
      }}>
        <GradientOverlay variant="romantic" intensity="medium" />
        <FloatingHearts count={8} size="medium" speed="normal" />
        <FloatingParticles count={12} type="sparkle" color="mixed" size="varied" speed="normal" />
      </Box>
      
      {enableBg && (
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: 0, 
          pointerEvents: 'none',
          isolation: 'isolate'
        }}>
          <Suspense fallback={null}>
            <LazyBg opacity={0.18} />
          </Suspense>
        </Box>
      )}
      
      <AnimatedBorder variant="glow" color="purple" speed="normal">
        <Paper 
          elevation={8} 
          className="glass-effect animate-fade-in" 
          sx={{ 
            p:5, 
            width:'100%', 
            maxWidth:520, 
            position:'relative', 
            overflow:'hidden',
            zIndex: 100,
            margin: 'auto'
          }}
        >
          <Box sx={{ display:'flex', alignItems:'center', mb:1 }}>
            <FavoriteIcon 
              color="secondary" 
              sx={{ mr:1 }} 
              className="animate-heartbeat text-pink-500" 
            />
            <Typography 
              variant="h4" 
              fontWeight={700}
              className="text-gradient"
            >
              Complicità
            </Typography>
          </Box>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            sx={{ mb:2 }}
            className="animate-slide-up"
          >
            Crea il tuo spazio di coppia o entra con il tuo profilo
          </Typography>
          <Chip 
            size="small" 
            label={mode==='login' ? 'Accesso' : 'Nuovo Account'} 
            color={mode==='login' ? 'primary':'secondary'} 
            sx={{ mb:2 }}
            className="animate-pulse-soft" 
          />
          <Tabs value={mode} onChange={(_,v)=>{ setMode(v); resetFields(); }} sx={{ mb:2 }}>
            <Tab value="login" label="Login" icon={<LoginIcon fontSize="small"/>} iconPosition="start" />
            <Tab value="register" label="Registrati" icon={<PersonAddAlt1Icon fontSize="small"/>} iconPosition="start" />
          </Tabs>
          <Stack spacing={2} component="form" onSubmit={e=>{ e.preventDefault(); mode==='login'?handleLogin():handleRegister(); }}>
            <TextField label="Nome" placeholder="Il tuo nome" inputProps={{ 'data-testid':'name-input' }} value={name} onChange={e=>setName(e.target.value)} required size="small" autoFocus disabled={loading} />
            <TextField label="Nickname" value={nickname} onChange={e=>setNickname(e.target.value)} size="small" disabled={loading || mode==='login'} helperText={mode==='register'? 'Opzionale':'(definito in fase di registrazione)'} />
            <TextField label="Password" placeholder="Password" inputProps={{ 'data-testid':'password-input' }} value={password} onChange={e=>setPassword(e.target.value)} type={showPwd?'text':'password'} size="small" disabled={loading} InputProps={{ endAdornment:(<InputAdornment position="end"><IconButton size="small" onClick={()=>setShowPwd(p=>!p)}>{showPwd? <VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment>) }} required />
            {mode==='register' && <Fade in={mode==='register'}><TextField label="Conferma Password" inputProps={{ 'data-testid':'confirm-password-input' }} value={confirm} onChange={e=>setConfirm(e.target.value)} type={showPwd?'text':'password'} size="small" disabled={loading} required /></Fade>}
            {error && <Alert severity="error" variant="outlined" onClose={()=>setError('')}>{error}</Alert>}
            <Button 
              data-testid="submit-auth" 
              disabled={loading || !name.trim()} 
              type="submit" 
              variant="contained" 
              size="large" 
              startIcon={mode==='login'? <LockOpenIcon/>:<PersonAddAlt1Icon/>} 
              className="animate-bounce-soft shadow-romantic"
              sx={{ 
                py:1.2, 
                fontWeight:600, 
                letterSpacing:'.5px', 
                background: mode==='login'? 'linear-gradient(90deg,#8e24aa,#ec407a)' : 'linear-gradient(90deg,#ec407a,#ba68c8)', 
                boxShadow:'0 4px 14px -4px rgba(236,64,122,.5)' 
              }}
            >
              {loading? 'Attendere...': mode==='login'? 'Entra':'Crea Account'}
            </Button>
          </Stack>
        </Paper>
      </AnimatedBorder>
    </Box>
  );
}
