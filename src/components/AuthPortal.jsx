import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Tabs, Tab, Stack, Alert, InputAdornment, IconButton, Fade, Chip } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LoginIcon from '@mui/icons-material/Login';
import { hashPassword, hashWithNewSalt } from '../utils/passwordHash.js';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Suspense } from 'react';
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
      onAuthSuccess({ ...newUser, userId: connect.userId, connectionId: connect.connectionId, status: connect });
    } catch (e){ setError(e.message); } finally { setLoading(false); resetFields(); }
  };

  const handleLogin = async () => {
    if (!name.trim()) return setError('Nome richiesto');
    const existing = users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
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
      onAuthSuccess({ ...existing, userId: connect.userId, personalCode: connect.personalCode, connectionId: connect.connectionId, status: connect });
    } catch(e){ setError(e.message); } finally { setLoading(false); resetFields(); }
  };

  const [enableBg, setEnableBg] = useState(false);
  useEffect(()=>{
    const run = ()=> setEnableBg(true);
    if('requestIdleCallback' in window){ window.requestIdleCallback(run, { timeout:1800 }); } else { setTimeout(run, 800); }
  },[]);

  return (
    <Box sx={{ minHeight:'100vh', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', p:3, background:'radial-gradient(circle at 30% 30%, #ffe1f1 0%, #f3e5f5 60%)' }}>
      {enableBg && (
        <Suspense fallback={null}>
          <LazyBg opacity={0.18} />
        </Suspense>
      )}
      <Paper elevation={8} sx={{ p:5, width:'100%', maxWidth:520, position:'relative', overflow:'hidden', backdropFilter:'blur(6px)', background:'rgba(255,255,255,0.88)' }}>
        <Box sx={{ display:'flex', alignItems:'center', mb:1 }}>
          <FavoriteIcon color="secondary" sx={{ mr:1 }} />
          <Typography variant="h4" fontWeight={700}>Complicità</Typography>
        </Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb:2 }}>Crea il tuo spazio di coppia o entra con il tuo profilo</Typography>
        <Chip size="small" label={mode==='login' ? 'Accesso' : 'Nuovo Account'} color={mode==='login' ? 'primary':'secondary'} sx={{ mb:2 }} />
        <Tabs value={mode} onChange={(_,v)=>{ setMode(v); resetFields(); }} sx={{ mb:2 }}>
          <Tab value="login" label="Login" icon={<LoginIcon fontSize="small"/>} iconPosition="start" />
          <Tab value="register" label="Registrati" icon={<PersonAddAlt1Icon fontSize="small"/>} iconPosition="start" />
        </Tabs>
        <Stack spacing={2} component="form" onSubmit={e=>{ e.preventDefault(); mode==='login'?handleLogin():handleRegister(); }}>
          <TextField label="Nome" value={name} onChange={e=>setName(e.target.value)} required size="small" autoFocus disabled={loading} />
          <TextField label="Nickname" value={nickname} onChange={e=>setNickname(e.target.value)} size="small" disabled={loading || mode==='login'} helperText={mode==='register'? 'Opzionale':'(definito in fase di registrazione)'} />
          <TextField label="Password" value={password} onChange={e=>setPassword(e.target.value)} type={showPwd?'text':'password'} size="small" disabled={loading} InputProps={{ endAdornment:(<InputAdornment position="end"><IconButton size="small" onClick={()=>setShowPwd(p=>!p)}>{showPwd? <VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment>) }} required />
          {mode==='register' && <Fade in={mode==='register'}><TextField label="Conferma Password" value={confirm} onChange={e=>setConfirm(e.target.value)} type={showPwd?'text':'password'} size="small" disabled={loading} required /></Fade>}
          {error && <Alert severity="error" variant="outlined" onClose={()=>setError('')}>{error}</Alert>}
          <Button disabled={loading || !name.trim() || !password} type="submit" variant="contained" size="large" startIcon={mode==='login'? <LockOpenIcon/>:<PersonAddAlt1Icon/>} sx={{ py:1.2, fontWeight:600, letterSpacing:'.5px', background: mode==='login'? 'linear-gradient(90deg,#8e24aa,#ec407a)' : 'linear-gradient(90deg,#ec407a,#ba68c8)', boxShadow:'0 4px 14px -4px rgba(236,64,122,.5)' }}>{loading? 'Attendere...': mode==='login'? 'Entra':'Crea Account'}</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
