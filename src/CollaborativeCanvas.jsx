import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Canvas collaborativo per sessioni condivise
 * Permette a più utenti di disegnare simultaneamente
 */
export function SharedCanvas({ canvasData, onCanvasUpdate, currentUser, participants, isActive = true }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#8B5CF6');
  const [brushSize, setBrushSize] = useState(3);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // Colori disponibili
  const colors = [
    '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#3B82F6', '#6366F1', '#8B5A2B'
  ];

  // Strumenti disponibili
  const tools = [
    { id: 'pen', icon: '✏️', name: 'Matita' },
    { id: 'brush', icon: '🖌️', name: 'Pennello' },
    { id: 'eraser', icon: '🧽', name: 'Gomma' }
  ];

  // Inizializza canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Imposta dimensioni responsive
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Stile di default
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    
    // Sfondo bianco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Aggiorna canvas quando arrivano dati esterni
  useEffect(() => {
    if (!canvasData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
    };
    
    img.src = canvasData;
  }, [canvasData]);

  // Ottieni coordinate relative al canvas
  const getCanvasCoordinates = useCallback((event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: (event.clientX - rect.left) * (canvas.offsetWidth / rect.width),
      y: (event.clientY - rect.top) * (canvas.offsetHeight / rect.height)
    };
  }, []);

  // Inizia a disegnare
  const startDrawing = useCallback((event) => {
    if (!isActive) return;
    
    event.preventDefault();
    const pos = getCanvasCoordinates(event);
    setIsDrawing(true);
    setLastPosition(pos);
  }, [isActive, getCanvasCoordinates]);

  // Disegna
  const draw = useCallback((event) => {
    if (!isDrawing || !isActive) return;
    
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasCoordinates(event);
    
    // Configura lo strumento
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentTool === 'brush' ? brushSize * 2 : brushSize;
    
    // Disegna linea
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    setLastPosition(pos);
    
    // Throttle degli aggiornamenti per performance
    if (!draw.lastUpdate || Date.now() - draw.lastUpdate > 100) {
      const imageData = canvas.toDataURL('image/png', 0.8);
      onCanvasUpdate(imageData);
      draw.lastUpdate = Date.now();
    }
  }, [isDrawing, isActive, getCanvasCoordinates, currentTool, currentColor, brushSize, lastPosition, onCanvasUpdate]);

  // Smetti di disegnare
  const stopDrawing = useCallback((event) => {
    if (!isDrawing) return;
    
    event.preventDefault();
    setIsDrawing(false);
    
    // Invia aggiornamento finale
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png', 0.8);
    onCanvasUpdate(imageData);
  }, [isDrawing, onCanvasUpdate]);

  // Pulisci canvas
  const clearCanvas = useCallback(() => {
    if (!isActive) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png', 0.8);
    onCanvasUpdate(imageData);
  }, [isActive, onCanvasUpdate]);

  // Touch events per dispositivi mobili
  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  };

  const handleTouchEnd = (event) => {
    const mouseEvent = new MouseEvent('mouseup', {});
    stopDrawing(mouseEvent);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          {/* Strumenti */}
          <div className="flex items-center gap-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id)}
                disabled={!isActive}
                className={`p-2 rounded-lg transition-colors ${
                  currentTool === tool.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                } ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={tool.name}
              >
                <span className="text-lg">{tool.icon}</span>
              </button>
            ))}
          </div>

          {/* Dimensione pennello */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Dimensione:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              disabled={!isActive}
              className="w-16"
            />
            <span className="text-sm text-gray-500 w-6">{brushSize}</span>
          </div>

          {/* Azioni */}
          <button
            onClick={clearCanvas}
            disabled={!isActive}
            className={`px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors ${
              !isActive ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            🗑️ Pulisci
          </button>
        </div>

        {/* Tavolozza colori */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm text-gray-600">Colore:</span>
          <div className="flex gap-1">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                disabled={!isActive}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                } ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />
        
        {/* Overlay quando non attivo */}
        {!isActive && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
            <span className="text-gray-500 font-medium">Canvas in sola lettura</span>
          </div>
        )}
      </div>

      {/* Info partecipanti */}
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>👥 {participants.length} partecipant{participants.length !== 1 ? 'i' : 'e'}</span>
          <span>🎨 Canvas condiviso</span>
        </div>
      </div>
    </div>
  );
}
