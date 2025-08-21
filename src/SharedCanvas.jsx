import React, { useRef, useEffect, useState, useCallback } from 'react';

export const SharedCanvas = ({ 
  strokes = [], 
  notes = [], 
  onAddStroke, 
  onAddNote, 
  onClearCanvas,
  isReadOnly = false,
  participants = []
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 });

  const colors = [
    '#6366f1', // Indigo
    '#ec4899', // Pink  
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#6b7280'  // Gray
  ];

  const tools = [
    { id: 'pen', name: 'Penna', icon: '✏️' },
    { id: 'marker', name: 'Evidenziatore', icon: '🖍️' },
    { id: 'eraser', name: 'Gomma', icon: '🧽' },
    { id: 'note', name: 'Nota', icon: '📝' }
  ];

  // Ridisegna il canvas quando cambiano i tratti
  useEffect(() => {
    redrawCanvas();
  }, [strokes, notes]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegna tutti i tratti
    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color || '#6366f1';
      ctx.lineWidth = stroke.size || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.tool === 'marker') {
        ctx.globalAlpha = 0.5;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      
      const firstPoint = stroke.points[0];
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      stroke.points.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    });
  }, [strokes]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (isReadOnly) return;
    
    const coords = getCanvasCoordinates(e);
    
    if (selectedTool === 'note') {
      setNotePosition(coords);
      setShowNoteInput(true);
      return;
    }
    
    setIsDrawing(true);
    setCurrentStroke([coords]);
  };

  const draw = (e) => {
    if (!isDrawing || isReadOnly || selectedTool === 'note') return;
    
    const coords = getCanvasCoordinates(e);
    const newStroke = [...currentStroke, coords];
    setCurrentStroke(newStroke);
    
    // Disegna in tempo reale
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (selectedTool === 'marker') {
      ctx.globalAlpha = 0.5;
    } else if (selectedTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    
    if (currentStroke.length === 1) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else {
      const prevCoords = currentStroke[currentStroke.length - 2];
      ctx.beginPath();
      ctx.moveTo(prevCoords.x, prevCoords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const stopDrawing = () => {
    if (!isDrawing || isReadOnly) return;
    
    setIsDrawing(false);
    
    if (currentStroke.length > 1) {
      const stroke = {
        id: Date.now() + Math.random(),
        points: currentStroke,
        color: selectedColor,
        size: brushSize,
        tool: selectedTool,
        timestamp: Date.now(),
        userId: 'current-user' // TODO: sostituire con ID utente reale
      };
      
      onAddStroke(stroke);
    }
    
    setCurrentStroke([]);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    
    const note = {
      id: Date.now() + Math.random(),
      text: noteText,
      position: notePosition,
      timestamp: Date.now(),
      userId: 'current-user' // TODO: sostituire con ID utente reale
    };
    
    onAddNote(note);
    setNoteText('');
    setShowNoteInput(false);
  };

  // Gestione touch per mobile
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex flex-wrap items-center gap-4">
          {/* Strumenti */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Strumenti:</span>
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                disabled={isReadOnly}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  selectedTool === tool.id
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                title={tool.name}
              >
                <span className="text-lg">{tool.icon}</span>
              </button>
            ))}
          </div>

          {/* Colori */}
          {selectedTool !== 'eraser' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Colori:</span>
              <div className="flex space-x-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    disabled={isReadOnly}
                    className={`w-8 h-8 rounded-full transition-transform duration-200 ${
                      selectedColor === color ? 'scale-110 ring-2 ring-gray-400' : 'hover:scale-105'
                    } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dimensione pennello */}
          {selectedTool !== 'note' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Dimensione:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                disabled={isReadOnly}
                className="w-16"
              />
              <span className="text-sm text-gray-600 w-6">{brushSize}</span>
            </div>
          )}

          {/* Pulsante cancella tutto */}
          <button
            onClick={onClearCanvas}
            disabled={isReadOnly}
            className={`px-4 py-2 bg-red-100 text-red-700 rounded-lg transition-colors duration-200 ${
              isReadOnly 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-red-200 hover:shadow-md'
            }`}
          >
            🗑️ Cancella tutto
          </button>
        </div>

        {/* Info partecipanti */}
        {participants.length > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Partecipanti:</span>
            <div className="flex space-x-2">
              {participants.map((participant, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                >
                  {participant}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full cursor-crosshair bg-white touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ maxHeight: '60vh' }}
        />

        {/* Note visuali */}
        {notes.map(note => (
          <div
            key={note.id}
            className="absolute bg-yellow-200 border border-yellow-400 rounded-lg p-2 shadow-lg max-w-xs"
            style={{
              left: `${(note.position.x / 800) * 100}%`,
              top: `${(note.position.y / 600) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <p className="text-sm text-gray-800">{note.text}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(note.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}

        {/* Input per nuova nota */}
        {showNoteInput && (
          <div
            className="absolute bg-white border-2 border-purple-400 rounded-lg p-3 shadow-xl z-10"
            style={{
              left: `${(notePosition.x / 800) * 100}%`,
              top: `${(notePosition.y / 600) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Scrivi una nota..."
              className="w-48 h-20 p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowNoteInput(false)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleAddNote}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                Aggiungi
              </button>
            </div>
          </div>
        )}

        {/* Overlay per modalità sola lettura */}
        {isReadOnly && (
          <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-gray-600 font-medium">👀 Modalità sola lettura</p>
              <p className="text-sm text-gray-500">Puoi visualizzare ma non modificare</p>
            </div>
          </div>
        )}
      </div>

      {/* Statistiche */}
      <div className="p-3 bg-gray-50 border-t text-center">
        <p className="text-sm text-gray-600">
          {strokes.length} tratti • {notes.length} note • 
          Canvas condiviso in tempo reale 🎨
        </p>
      </div>
    </div>
  );
};
