import React, { useContext } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { ColorModeContext } from '../theme/ColorModeProvider';

export default function DarkModeToggle() {
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  return (
    <Tooltip title={mode === 'light' ? 'Tema scuro' : 'Tema chiaro'}>
      <IconButton size="small" onClick={toggleColorMode} color="inherit" aria-label="toggle color mode">
        {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
}
