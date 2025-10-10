import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LavagnaCanvas from '../components/LavagnaCanvas.jsx';

// Mock Fabric.js
const mockCanvas = {
  setHeight: vi.fn(),
  setWidth: vi.fn(),
  renderAll: vi.fn(),
  clear: vi.fn(),
  setBackgroundColor: vi.fn(),
  dispose: vi.fn(),
  toJSON: vi.fn(() => ({ objects: [] })),
  loadFromJSON: vi.fn(),
  on: vi.fn(),
  freeDrawingBrush: {
    color: '#ffffff',
    width: 2.5
  },
  isDrawingMode: false
};

const mockFabric = {
  Canvas: vi.fn(() => mockCanvas),
  Textbox: vi.fn(() => ({ left: 40, top: 40, fontSize: 20 }))
};

vi.mock('fabric', () => ({
  fabric: mockFabric
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('LavagnaCanvas', () => {
  const mockOnSync = vi.fn();
  const mockSyncState = {
    json: { objects: [] },
    bgColor: '#2d4c2a'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with loading state', () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    expect(screen.getByText('Caricamento lavagna...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /matita/i })).toBeDisabled();
  });

  it('displays toolbar with all tools', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /matita/i })).not.toBeDisabled();
    });

    expect(screen.getByRole('button', { name: /matita/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /penna/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pennarello/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /testo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /immagine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancellino/i })).toBeInTheDocument();
  });

  it('changes tool when toolbar button is clicked', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /penna/i })).not.toBeDisabled();
    });

    const penButton = screen.getByRole('button', { name: /penna/i });
    fireEvent.click(penButton);

    // Tool should be updated (visual feedback would be checked in e2e tests)
    expect(mockCanvas.isDrawingMode).toBe(true);
  });

  it('handles color change', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      const colorInput = screen.getByTitle('Colore');
      expect(colorInput).not.toBeDisabled();
    });

    const colorInput = screen.getByTitle('Colore');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    expect(mockCanvas.freeDrawingBrush.color).toBe('#ff0000');
  });

  it('handles background color change', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      const bgColorInput = screen.getByTitle('Sfondo');
      expect(bgColorInput).not.toBeDisabled();
    });

    const bgColorInput = screen.getByTitle('Sfondo');
    fireEvent.change(bgColorInput, { target: { value: '#0000ff' } });

    expect(mockCanvas.setBackgroundColor).toHaveBeenCalledWith('#0000ff', expect.any(Function));
  });

  it('handles width/thickness change', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      const widthInput = screen.getByDisplayValue('2.5');
      expect(widthInput).not.toBeDisabled();
    });

    const widthInput = screen.getByDisplayValue('2.5');
    fireEvent.change(widthInput, { target: { value: '5' } });

    expect(mockCanvas.freeDrawingBrush.width).toBe(5);
  });

  it('handles reset button', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).not.toBeDisabled();
    });

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(mockCanvas.clear).toHaveBeenCalled();
    expect(mockOnSync).toHaveBeenCalled();
  });

  it('handles sync state updates', async () => {
    const { rerender } = render(<LavagnaCanvas height={260} onSync={mockOnSync} syncState={null} />);
    
    await waitFor(() => {
      expect(mockCanvas.loadFromJSON).not.toHaveBeenCalled();
    });

    rerender(<LavagnaCanvas height={260} onSync={mockOnSync} syncState={mockSyncState} />);

    await waitFor(() => {
      expect(mockCanvas.loadFromJSON).toHaveBeenCalledWith(mockSyncState.json, expect.any(Function));
    });
  });

  it('enables eraser mode correctly', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      const eraserButton = screen.getByRole('button', { name: /cancellino/i });
      expect(eraserButton).not.toBeDisabled();
    });

    const eraserButton = screen.getByRole('button', { name: /cancellino/i });
    fireEvent.click(eraserButton);

    // Eraser should set brush to white and increase width
    expect(mockCanvas.freeDrawingBrush.color).toBe('#fff');
    expect(mockCanvas.freeDrawingBrush.width).toBe(6.25); // 2.5 * 2.5
  });

  it('shows text input when text tool is selected', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      const textButton = screen.getByRole('button', { name: /testo/i });
      expect(textButton).not.toBeDisabled();
    });

    const textButton = screen.getByRole('button', { name: /testo/i });
    fireEvent.click(textButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Testo...')).toBeInTheDocument();
    });
  });

  it('calls onSync when canvas events occur', async () => {
    render(<LavagnaCanvas height={260} onSync={mockOnSync} />);
    
    await waitFor(() => {
      expect(mockCanvas.on).toHaveBeenCalledWith('path:created', expect.any(Function));
      expect(mockCanvas.on).toHaveBeenCalledWith('object:added', expect.any(Function));
      expect(mockCanvas.on).toHaveBeenCalledWith('object:removed', expect.any(Function));
      expect(mockCanvas.on).toHaveBeenCalledWith('object:modified', expect.any(Function));
    });
  });
});