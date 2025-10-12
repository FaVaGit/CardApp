import { Stack, Button } from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import StopIcon from '@mui/icons-material/StopCircle';

/**
 * Reusable action buttons for drawing and ending the game.
 * Props:
 * - isLoading: boolean
 * - onDraw: () => void
 * - onEnd: () => void
 */
export default function CardActionButtons({ isLoading, onDraw, onEnd }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button
        onClick={onDraw}
        variant="contained"
        color="secondary"
        size="large"
        startIcon={<ShuffleIcon />}
        disabled={isLoading}
      >
        {isLoading ? 'Pescando...' : 'Pesca Carta'}
      </Button>
      <Button
        onClick={onEnd}
        variant="outlined"
        color="error"
        size="large"
        startIcon={<StopIcon />}
        disabled={isLoading}
      >
        {isLoading ? 'Terminando...' : 'Termina'}
      </Button>
    </Stack>
  );
}
