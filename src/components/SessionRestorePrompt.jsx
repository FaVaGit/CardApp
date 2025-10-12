import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

/**
 * SessionRestorePrompt - UI component for session restoration confirmation
 * Replaces native browser confirm dialog with integrated Material-UI design
 */
export default function SessionRestorePrompt({ 
  sessionInfo, 
  onRestore, 
  onTerminate, 
  partnerInfo 
}) {
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await onRestore();
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async () => {
    setLoading(true);
    try {
      await onTerminate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      p: 2 
    }}>
      <Card sx={{ maxWidth: 500, width: '100%' }} elevation={6}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <InfoIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Sessione Esistente Trovata
              </Typography>
              <Typography variant="body1" color="text.secondary">
                È stata rilevata una sessione di gioco precedente
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Dettagli Sessione:
              </Typography>
              <Stack spacing={1}>
                <Chip 
                  label={`Sessione: ${sessionInfo?.sessionId?.substring(0, 8) || 'N/A'}`} 
                  variant="outlined" 
                  size="small" 
                />
                {partnerInfo ? (
                  <Chip 
                    label={`Partner: ${partnerInfo.name || 'Sconosciuto'}`} 
                    color="secondary" 
                    variant="outlined" 
                    size="small" 
                  />
                ) : (
                  <Chip 
                    label="Partner: In attesa di connessione" 
                    color="warning" 
                    variant="outlined" 
                    size="small" 
                  />
                )}
              </Stack>
            </Box>

            <Divider />

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Vuoi riprendere la partita o iniziare una nuova sessione?
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleRestore}
                disabled={loading}
                size="large"
                fullWidth
              >
                Riprendi Partita
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleTerminate}
                disabled={loading}
                size="large"
                fullWidth
                color="error"
              >
                Termina e Ricomincia
              </Button>
            </Stack>

            {partnerInfo && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                Il tuo partner verrà notificato della tua scelta
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}