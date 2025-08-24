import React, { useState, useRef, useEffect } from 'react';
import { expandedCards } from './expandedCards';
import { ShareCardModal } from './ShareCardModal';
import { useCardSharing } from './useCardSharing';

export function DualDeviceGameSession({ 
  currentPartner, 
  partnerConnection, 
  coupleSession, 
  sharedCanvas,
  sharedNotes,
  onDrawCard, 
  onAddCanvasStroke, 
  onAddNote, 
  onClearCanvas,
  onLogout 
}) {
  const [current, setCurrent] = useState(coupleSession?.currentCard || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCanvas, setShowCanvas] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Hook per la condivisione carte
  const {
    isShareModalOpen,
    cardToShare,
    openShareModal,
    closeShareModal
  } = useCardSharing();
  const [newNote, setNewNote] = useState('');
  const [drawingMode, setDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState(currentPartner?.preferences.drawingColor || '#8b5cf6');
  const [brushSize, setBrushSize] = useState(3);
  
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const categories = [
    { id: 'all', name: 'Tutte', emoji: '🎲' },
    { id: 'viaggi', name: 'Viaggi', emoji: '✈️' },
    { id: 'svago', name: 'Svago', emoji: '🎮' },
    { id: 'famiglia', name: 'Famiglia', emoji: '👨‍👩‍👧‍👦' },
    { id: 'gossip', name: 'Gossip', emoji: '🗣️' },
    { id: 'cibo', name: 'Cibo', emoji: '🍕' },
    { id: 'obiettivi', name: 'Obiettivi', emoji: '🎯' },
    { id: 'natura', name: 'Natura', emoji: '🌲' },
    { id: 'cultura', name: 'Cultura', emoji: '📚' },
    { id: 'intimita', name: 'Intimità', emoji: '💕' },
    { id: 'speciali', name: 'Speciali', emoji: '🦸' },
    { id: 'jolly', name: 'Jolly', emoji: '⚡' },
    { id: 'festivita', name: 'Festività', emoji: '🎉' },
    { id: 'connessione', name: 'Connessione', emoji: '🤝' }
  ];

  useEffect(() => {
    if (coupleSession?.currentCard) {
      setCurrent(coupleSession.currentCard);
    }
  }, [coupleSession?.currentCard]);

  useEffect(() => {
    redrawCanvas();
  }, [sharedCanvas]);

  const getFilteredCards = () => {
    if (selectedCategory === 'all') return expandedCards;
    return expandedCards.filter(card => card.category === selectedCategory);
  };

  const drawCard = () => {
    setIsDrawing(true);
    setTimeout(() => {
      const filteredCards = getFilteredCards();
      const idx = Math.floor(Math.random() * filteredCards.length);
      const selectedCard = filteredCards[idx];
      setCurrent(selectedCard);
      onDrawCard(selectedCard);
      setIsDrawing(false);
    }, 800);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegna tutti i tratti condivisi
    sharedCanvas.forEach(stroke => {
      if (stroke.type === 'path') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    });
  };

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
    if (!drawingMode) return;
    
    isDrawingRef.current = true;
    const point = getCanvasCoordinates(e);
    lastPointRef.current = point;
    
    // Inizia un nuovo tratto
    const newStroke = {
      type: 'path',
      points: [point],
      color: brushColor,
      size: brushSize
    };
    
    onAddCanvasStroke(newStroke);
  };

  const draw = (e) => {
    if (!drawingMode || !isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPoint = getCanvasCoordinates(e);
    
    // Disegna localmente per feedback immediato
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    
    lastPointRef.current = currentPoint;
    
    // Aggiorna l'ultimo tratto con il nuovo punto
    if (sharedCanvas.length > 0) {
      const lastStroke = sharedCanvas[sharedCanvas.length - 1];
      if (lastStroke.authorId === currentPartner.id) {
        const updatedStroke = {
          ...lastStroke,
          points: [...lastStroke.points, currentPoint]
        };
        onAddCanvasStroke(updatedStroke);
      }
    }
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPartnerRole = (role) => {
    return role === 'partner1' ? '👨' : '👩';
  };

  const getPartnerColor = (role) => {
    return role === 'partner1' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      {/* Header con info partner e connessione */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`text-2xl p-2 rounded-full ${getPartnerColor(currentPartner.role)}`}>
                {getPartnerRole(currentPartner.role)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {currentPartner.name} - {coupleSession.coupleName}
                </h1>
                <div className="flex items-center space-x-2 text-sm">
                  {partnerConnection ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>{partnerConnection.name} è online</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>In attesa del partner...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCanvas(!showCanvas)}
                className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                  showCanvas ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                🎨 Canvas
              </button>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                  showNotes ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                📝 Note ({sharedNotes.length})
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-6">
        {/* Area principale del gioco */}
        <div className={`${showCanvas || showNotes ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* Selettore categoria */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Scegli la categoria di carte 🎯
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-lg mb-1">{category.emoji}</div>
                  <div className="text-xs">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pulsante pesca carta */}
          <div className="text-center mb-6">
            <button
              className={`px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95 ${
                isDrawing ? 'animate-pulse' : 'hover:from-purple-600 hover:to-pink-600'
              }`}
              onClick={drawCard}
              disabled={isDrawing}
            >
              {isDrawing ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Pescando...
                </span>
              ) : (
                'Pesca una Carta per Entrambi 🎲'
              )}
            </button>
          </div>

          {/* Carta attuale */}
          {current ? (
            <div className={`max-w-md mx-auto bg-gradient-to-br ${current.color} p-1 rounded-3xl shadow-2xl transform transition-all duration-700 hover:scale-105`}>
              <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-3xl">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2 animate-bounce cursor-pointer hover:scale-110 transition-transform duration-200">
                    {current.emoji}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Carta #{current.id}
                  </h2>
                  <h3 className="text-xl font-semibold text-gray-700 mt-1">
                    {current.title}
                  </h3>
                  {current.drawnBy && current.drawnBy !== currentPartner.id && (
                    <p className="text-sm text-purple-600 mt-2">
                      Pescata da: {current.drawnByName}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  {current.prompts.map((p, i) => (
                    <div key={i} className="bg-white bg-opacity-50 p-4 rounded-2xl border-l-4 border-purple-400 hover:bg-opacity-70 transition-all duration-200 hover:shadow-md">
                      <p className="text-gray-800 leading-relaxed font-medium">
                        <span className="text-purple-600 font-bold text-lg">{i + 1}.</span> {p}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                      onClick={() => openShareModal(current)}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-400 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 hover:from-cyan-500 hover:to-blue-500"
                    >
                      📤 Condividi Carta
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    💡 Rispondete insieme e usate canvas e note per condividere le idee!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center">
              <div className="bg-white bg-opacity-80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
                <div className="text-6xl mb-4 animate-pulse">
                  {getPartnerRole(currentPartner.role)}
                </div>
                <p className="text-xl text-gray-700 font-medium leading-relaxed mb-4">
                  Benvenuto {currentPartner.name}!<br />
                  Pesca una carta per iniziare l'esperienza dual-device.
                </p>
                {!partnerConnection && (
                  <p className="text-sm text-gray-600">
                    💡 Il tuo partner può unirsi usando lo stesso nome coppia
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pannello laterale Canvas e Note */}
        {(showCanvas || showNotes) && (
          <div className="lg:col-span-4 space-y-6">
            {/* Canvas condiviso */}
            {showCanvas && (
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center">
                      <span className="mr-2">🎨</span>
                      Canvas Condiviso
                    </h3>
                    <button
                      onClick={onClearCanvas}
                      className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded-full hover:bg-red-200 transition-colors duration-200"
                    >
                      Pulisci
                    </button>
                  </div>
                  
                  {/* Controlli disegno */}
                  <div className="flex items-center space-x-2 mb-3">
                    <button
                      onClick={() => setDrawingMode(!drawingMode)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                        drawingMode 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {drawingMode ? '✏️ Disegno ON' : '👆 Disegno OFF'}
                    </button>
                    
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300"
                    />
                    
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={brushSize}
                      onChange={(e) => setBrushSize(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600">{brushSize}px</span>
                  </div>
                </div>
                
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="w-full border-b border-gray-200 cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ touchAction: 'none' }}
                />
                
                <div className="p-2 text-xs text-gray-600 text-center">
                  Disegni sincronizzati tra i dispositivi in tempo reale
                </div>
              </div>
            )}

            {/* Note condivise */}
            {showNotes && (
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <span className="mr-2">📝</span>
                    Note Condivise ({sharedNotes.length})
                  </h3>
                </div>
                
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {sharedNotes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-3 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          note.authorId === currentPartner.id 
                            ? getPartnerColor(currentPartner.role)
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {note.authorName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(note.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{note.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                      placeholder="Scrivi una nota..."
                      className="flex-1 px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50"
                    >
                      <span className="text-sm">➤</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share Card Modal */}
        <ShareCardModal
          card={cardToShare}
          isOpen={isShareModalOpen}
          onClose={closeShareModal}
          currentUser={currentPartner}
        />
      </div>
    </div>
  );
}
