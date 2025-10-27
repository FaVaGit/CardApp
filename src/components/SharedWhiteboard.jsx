import { useState, useRef, useEffect, useCallback } from 'react';
// Import namespace for fabric to avoid named export issue during build
import * as fabric from 'fabric';
import { 
  PaintBrushIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

export function SharedWhiteboard({ 
  strokes = [], 
  notes = [],
  currentUser,
  onAddStroke, 
  onAddNote, 
  onClearCanvas,
  onUndo,
  onRedo,
  isReadOnly = false,
  className = "",
  height = 500 
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [zoom, setZoom] = useState(1);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Configurazione strumenti
  const tools = [
    { id: 'brush', icon: PaintBrushIcon, label: 'Pennello', color: 'purple' },
    { id: 'pen', icon: PencilIcon, label: 'Penna', color: 'blue' },
    { id: 'eraser', icon: TrashIcon, label: 'Gomma', color: 'red' },
    { id: 'note', icon: ChatBubbleLeftEllipsisIcon, label: 'Nota', color: 'yellow' }
  ];

  const colors = [
    '#8b5cf6', '#ef4444', '#22c55e', '#3b82f6', 
    '#f59e0b', '#ec4899', '#10b981', '#f97316',
    '#6366f1', '#14b8a6', '#84cc16', '#000000'
  ];

  const brushSizes = [1, 2, 3, 5, 8, 12, 16, 20];

  // Inizializza FabricJS Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Previeni doppia inizializzazione
    if (fabricCanvasRef.current) {
      return;
    }

    // Crea canvas Fabric
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: height,
      backgroundColor: '#ffffff',
      selection: false,
      allowTouchScrolling: false,
      stopContextMenu: true,
      fireRightClick: true,
      fireMiddleClick: true,
      enableRetinaScaling: true,
      isDrawingMode: selectedTool === 'brush' || selectedTool === 'pen',
    });

    fabricCanvasRef.current = canvas;

    // Configura drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = selectedColor;
    }

    // Event listeners per disegno collaborativo
    canvas.on('path:created', handlePathCreated);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:wheel', handleMouseWheel);

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggiorna configurazione strumenti
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    if (selectedTool === 'brush' || selectedTool === 'pen') {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = selectedColor;
        
        if (selectedTool === 'pen') {
          canvas.freeDrawingBrush.opacity = 1;
        } else {
          canvas.freeDrawingBrush.opacity = 0.8;
        }
      }
    } else if (selectedTool === 'eraser') {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = brushSize * 2;
        canvas.freeDrawingBrush.color = '#ffffff';
      }
    } else {
      canvas.isDrawingMode = false;
    }
  }, [selectedTool, brushSize, selectedColor]);

  // Sincronizza strokes dal props
  useEffect(() => {
    if (!fabricCanvasRef.current || !strokes) return;

    const canvas = fabricCanvasRef.current;
    
    // Rimuovi tutti gli oggetti esistenti
    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    // Ricrea tutti gli strokes
    strokes.forEach(stroke => {
      if (stroke.type === 'path' && stroke.pathData) {
        fabric.Path.fromSVG(stroke.pathData, (objects) => {
          objects.forEach(obj => {
            obj.set({
              stroke: stroke.color,
              strokeWidth: stroke.width,
              fill: '',
              selectable: false,
              evented: false
            });
            canvas.add(obj);
          });
        });
      }
    });

    canvas.renderAll();
  }, [strokes]);

  // Handlers
  const handlePathCreated = useCallback((e) => {
    if (isReadOnly) return;

    const path = e.path;
    const pathData = path.toSVG();
    
    const strokeData = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'path',
      pathData: pathData,
      color: selectedColor,
      width: brushSize,
      tool: selectedTool,
      timestamp: Date.now(),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Anonimo'
    };

    // Salva stato per undo
    saveCanvasState();

    // Invia stroke al backend
    onAddStroke && onAddStroke(strokeData);
  }, [selectedTool, selectedColor, brushSize, currentUser, isReadOnly, onAddStroke]);

  const handleMouseDown = useCallback((e) => {
    if (selectedTool === 'note' && !isReadOnly) {
      const pointer = fabricCanvasRef.current.getPointer(e.e);
      setNotePosition(pointer);
      setShowNoteModal(true);
    }
  }, [selectedTool, isReadOnly]);

  const handleMouseWheel = useCallback((e) => {
    const delta = e.e.deltaY;
    let newZoom = zoom;
    
    if (delta > 0) {
      newZoom = Math.max(0.5, zoom - 0.1);
    } else {
      newZoom = Math.min(2, zoom + 0.1);
    }
    
    setZoom(newZoom);
    fabricCanvasRef.current.setZoom(newZoom);
    e.e.preventDefault();
    e.e.stopPropagation();
  }, [zoom]);

  const saveCanvasState = () => {
    if (!fabricCanvasRef.current) return;
    
    const state = JSON.stringify(fabricCanvasRef.current.toJSON());
    setUndoStack(prev => [...prev.slice(-9), state]); // Mantieni solo ultimi 10 stati
    setRedoStack([]); // Pulisci redo stack quando aggiungi nuovo stato
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvasRef.current.toJSON());
    const previousState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    fabricCanvasRef.current.loadFromJSON(previousState, () => {
      fabricCanvasRef.current.renderAll();
    });

    onUndo && onUndo();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvasRef.current.toJSON());
    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    fabricCanvasRef.current.loadFromJSON(nextState, () => {
      fabricCanvasRef.current.renderAll();
    });

    onRedo && onRedo();
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    const noteData = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: noteText.trim(),
      position: notePosition,
      timestamp: Date.now(),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Anonimo'
    };

    onAddNote && onAddNote(noteData);
    setNoteText('');
    setShowNoteModal(false);
  };

  const handleClear = () => {
    if (fabricCanvasRef.current) {
      saveCanvasState();
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      fabricCanvasRef.current.renderAll();
    }
    onClearCanvas && onClearCanvas();
  };

  const handleExport = () => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1
    });
    
    const link = document.createElement('a');
    link.download = `lavagna_condivisa_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden ${className}`} data-testid="shared-whiteboard">
      {/* Header con titolo */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <PaintBrushIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Lavagna Condivisa
              </h3>
              <p className="text-sm text-gray-600">
                {strokes?.length || 0} disegni • {notes?.length || 0} note
              </p>
            </div>
          </div>
          
          {!isReadOnly && (
            <div className="flex items-center space-x-2">
              {/* Undo/Redo */}
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title="Annulla"
                data-testid="undo-button"
              >
                <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title="Ripeti"
                data-testid="redo-button"
              >
                <ArrowUturnRightIcon className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Export */}
              <button
                onClick={handleExport}
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                title="Esporta"
                data-testid="export-button"
              >
                <DocumentArrowDownIcon className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Clear */}
              <button
                onClick={handleClear}
                className="p-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-all duration-200"
                title="Pulisci tutto"
                data-testid="clear-canvas"
              >
                <TrashIcon className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {!isReadOnly && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Strumenti */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Strumenti:</span>
              <div className="flex space-x-1">
                {tools.map(tool => {
                  const IconComponent = tool.icon;
                  const isSelected = selectedTool === tool.id;
                  
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className={`p-2 rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? `bg-${tool.color}-100 border-${tool.color}-300 text-${tool.color}-700`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      title={tool.label}
                      data-testid={`tool-${tool.id}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colori */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Colore:</span>
              <div className="flex space-x-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                      selectedColor === color 
                        ? 'border-gray-400 scale-110' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    data-testid={`color-${color === '#ef4444' ? 'red' : color === '#22c55e' ? 'green' : color === '#3b82f6' ? 'blue' : 'other'}`}
                  />
                ))}
              </div>
            </div>

            {/* Dimensione pennello */}
            {(selectedTool === 'brush' || selectedTool === 'pen' || selectedTool === 'eraser') && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Dimensione:</span>
                <div className="flex space-x-1">
                  {brushSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`w-8 h-8 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                        brushSize === size
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      title={`${size}px`}
                      data-testid={`brush-size-${size}`}
                    >
                      <div
                        className="rounded-full bg-current"
                        style={{
                          width: Math.min(size, 16),
                          height: Math.min(size, 16)
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zoom */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Zoom:</span>
              <button
                onClick={() => {
                  const newZoom = Math.max(0.5, zoom - 0.1);
                  setZoom(newZoom);
                  fabricCanvasRef.current?.setZoom(newZoom);
                }}
                className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                data-testid="zoom-out"
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => {
                  const newZoom = Math.min(2, zoom + 0.1);
                  setZoom(newZoom);
                  fabricCanvasRef.current?.setZoom(newZoom);
                }}
                className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                data-testid="zoom-in"
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Canvas */}
      <div className="relative bg-white overflow-hidden" style={{ height: height + 'px' }}>
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          data-testid="whiteboard-canvas"
        />

        {/* Note visuali */}
        {notes?.map(note => (
          <div
            key={note.id}
            className="absolute bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 shadow-lg max-w-xs z-10 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(note.position.x / 800) * 100}%`,
              top: `${(note.position.y / height) * 100}%`,
            }}
          >
            <div className="text-sm text-gray-800 font-medium">{note.text}</div>
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
              <span>{note.userName}</span>
              <span>{new Date(note.timestamp).toLocaleTimeString('it-IT')}</span>
            </div>
          </div>
        ))}

        {/* Indicatore di stato read-only */}
        {isReadOnly && (
          <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
            Solo visualizzazione
          </div>
        )}
      </div>

      {/* Modal per aggiungere note */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Aggiungi Nota</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Scrivi la tua nota..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
              data-testid="note-textarea"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                data-testid="add-note-button"
              >
                Aggiungi
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                }}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                data-testid="cancel-note-button"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}