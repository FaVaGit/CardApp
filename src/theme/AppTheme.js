import { createTheme } from '@mui/material/styles';

export const couplePalette = {
  gradientBgLight: 'linear-gradient(135deg,#FFF5FA 0%,#FDE8FF 45%,#F6E3FF 70%,#FFE3F1 100%)',
  gradientBgDark: 'linear-gradient(135deg,#1B0F20 0%,#25102F 45%,#2D1538 70%,#3A1C42 100%)',
  heartPink: '#FF4F93',
  heartPinkSoft: '#FF8DB7',
  violetDeep: '#7C3AED',
  accent: '#FFB347'
};

export function buildTheme(mode = 'light') {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#B59CFF' : '#7C3AED' },
      secondary: { main: isDark ? '#FF8DB7' : '#FF4F93' },
      background: {
        default: isDark ? '#140A17' : '#FFFFFF',
        paper: isDark ? '#1F1324' : '#FFFFFF'
      }
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: 'Poppins, Nunito, system-ui, sans-serif',
      h4: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' }
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 14 } } },
      MuiAppBar: { styleOverrides: { root: { backdropFilter: 'blur(10px)' } } }
    }
  });
}

const theme = buildTheme('light');
export default theme;
