import { createContext, useCallback, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from './AppTheme';

export const ColorModeContext = createContext({ mode: 'light', toggleColorMode: () => {} });

export default function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => window.localStorage.getItem('complicity_color_mode') || 'light');
  const toggleColorMode = useCallback(() => {
    setMode(m => { const next = m === 'light' ? 'dark' : 'light'; window.localStorage.setItem('complicity_color_mode', next); return next; });
  }, []);
  const value = useMemo(() => ({ mode, toggleColorMode }), [mode, toggleColorMode]);
  const theme = useMemo(() => buildTheme(mode), [mode]);
  return <ColorModeContext.Provider value={value}><ThemeProvider theme={theme}>{children}</ThemeProvider></ColorModeContext.Provider>;
}
