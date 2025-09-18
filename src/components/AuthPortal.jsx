import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Tabs, Tab, Stack, Alert, InputAdornment, IconButton, Fade } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LoginIcon from '@mui/icons-material/Login';
import { hashPassword, hashWithNewSalt } from '../utils/passwordHash.js';

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

  return (
    <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', p:3, background:'linear-gradient(145deg,#ffe6f4 0%,#f3e5f5 60%)' }}>
      <Paper elevation={6} sx={{ p:5, width:'100%', maxWidth:500, position:'relative', overflow:'hidden' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Gioco della Complicità</Typography>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb:3 }}>Accedi o registrati per iniziare</Typography>
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
          <Button disabled={loading || !name.trim() || !password} type="submit" variant="contained" size="large" startIcon={mode==='login'? <LockOpenIcon/>:<PersonAddAlt1Icon/>}>{loading? 'Attendere...': mode==='login'? 'Entra':'Crea Account'}</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
