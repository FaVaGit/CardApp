import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CoupleGame from '../CoupleGame.jsx';

// Mock dei componenti
vi.mock('../components/LavagnaCanvas.jsx', () => ({
  default: ({ onSync, syncState }) => (
    <div data-testid="lavagna-canvas">
      <button onClick={() => onSync({ objects: [] }, '#2d4c2a')}>Mock Draw</button>
      {syncState && <div data-testid="sync-state">Synced</div>}
    </div>
  )
}));

vi.mock('../components/CanvasCardTable.jsx', () => ({
  default: ({ card }) => (
    <div data-testid="canvas-card-table">
      {card && <div data-testid="current-card">{card.content}</div>}
    </div>
  )
}));

vi.mock('../components/CardActionButtons.jsx', () => ({
  default: ({ onDraw, onEnd, isLoading }) => (
    <div data-testid="card-action-buttons">
      <button onClick={onDraw} disabled={isLoading}>Draw Card</button>
      <button onClick={onEnd} disabled={isLoading}>End Game</button>
    </div>
  )
}));

// Mock floating components
vi.mock('../components/FloatingHearts.jsx', () => ({ default: () => null }));
vi.mock('../components/GradientOverlay.jsx', () => ({ default: () => null }));
vi.mock('../components/AnimatedBorder.jsx', () => ({ default: () => null }));
vi.mock('../components/FloatingParticles.jsx', () => ({ default: () => null }));

describe('CoupleGame with Lavagna Integration', () => {
  const mockUser = {
    id: 'user1',
    name: 'Test User',
    userCode: 'ABC123'
  };

  const mockApiService = {
    on: vi.fn(),
    off: vi.fn(),
    drawCard: vi.fn(),
    endGame: vi.fn(),
    publishEvent: vi.fn(),
    sessionId: 'session123'
  };

  const mockOnExit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lavagna canvas in the game interface', () => {
    render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    expect(screen.getByTestId('lavagna-canvas')).toBeInTheDocument();
  });

  it('handles lavagna sync events', async () => {
    render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    const mockDrawButton = screen.getByText('Mock Draw');
    fireEvent.click(mockDrawButton);

    await waitFor(() => {
      expect(mockApiService.publishEvent).toHaveBeenCalledWith('lavagnaSync', {
        sessionId: 'session123',
        json: { objects: [] },
        bgColor: '#2d4c2a',
        timestamp: expect.any(Number)
      });
    });
  });

  it('displays game session info correctly', () => {
    render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();
  });

  it('shows activity log', () => {
    render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    expect(screen.getByText('Log Attività')).toBeInTheDocument();
  });

  it('sets up lavagna sync event listeners', () => {
    render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    expect(mockApiService.on).toHaveBeenCalledWith('lavagnaSync', expect.any(Function));
  });

  it('cleans up lavagna sync event listeners on unmount', () => {
    const { unmount } = render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    unmount();
    
    expect(mockApiService.off).toHaveBeenCalledWith('lavagnaSync', expect.any(Function));
  });

  it('handles lavagna state updates from partner', async () => {
    render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    // Simulate receiving lavagna sync event
    const lavagnaSyncHandler = mockApiService.on.mock.calls.find(
      call => call[0] === 'lavagnaSync'
    )[1];

    const mockLavagnaData = {
      json: { objects: [{ type: 'path' }] },
      bgColor: '#ff0000'
    };

    lavagnaSyncHandler(mockLavagnaData);

    await waitFor(() => {
      expect(screen.getByTestId('sync-state')).toBeInTheDocument();
    });
  });

  it('displays card content when available', async () => {
    mockApiService.drawCard.mockResolvedValue({
      id: 'card1',
      content: 'Test card content'
    });

    render(<CoupleGame user={mockUser} apiService={mockApiService} onExit={mockOnExit} />);
    
    const drawButton = screen.getByText('Draw Card');
    fireEvent.click(drawButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-card')).toHaveTextContent('Test card content');
    });
  });
});