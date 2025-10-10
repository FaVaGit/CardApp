import { useEffect, useRef, Suspense, lazy } from 'react';
import { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';
import EditIcon from '@mui/icons-material/Edit';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

/**
 * LavagnaCanvas - Canvas interattivo per disegno/annotazioni con Fabric.js
 * - Supporta disegno libero, cancellazione, reset
 * - Toolbar con strumenti: matita, penna, pennarello, testo, immagini, cancellino
 * - Sincronizzazione bidirezionale tra partner
 * - Import dinamico di Fabric.js per performance ottimizzate
 * - Responsive, stile lavagna scolastica
 */
export default function LavagnaCanvas({ height = 260, onSync, syncState = null }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#ffffff'); // bianco per lavagna verde
  const [bgColor, setBgColor] = useState('#2d4c2a'); // verde lavagna
  const [width, setWidth] = useState(2.5);
  const [textValue, setTextValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Funzione di sincronizzazione lavagna
  const syncBoard = () => {
    if (fabricRef.current && onSync) {
      const json = fabricRef.current.toJSON();
      onSync(json, bgColor);
    }
  };

  // Inizializza la canvas una sola volta con import dinamico
  useEffect(() => {
    let fabric;
    async function setup() {
      try {
        setIsLoading(true);
        // Import dinamico per ridurre bundle size iniziale
        const fabricModule = await import('fabric');
        fabric = fabricModule.fabric;
        if (!canvasRef.current || !fabric) return;
        if (canvasRef.current.__fabric) return;
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
          isDrawingMode: ['pencil','pen','marker','eraser'].includes(tool),
          backgroundColor: bgColor,
          selection: true,
        });
        fabricRef.current = fabricCanvas;
        canvasRef.current.__fabric = fabricCanvas;
        fabricCanvas.setHeight(height);
        fabricCanvas.setWidth(canvasRef.current.parentElement?.clientWidth || 420);
        // Event listener per sincronizzazione automatica
        fabricCanvas.on('path:created', syncBoard);
        fabricCanvas.on('object:added', syncBoard);
        fabricCanvas.on('object:removed', syncBoard);
        fabricCanvas.on('object:modified', syncBoard);
        window.addEventListener('resize', resize);
        // Ensure loading spinner is removed only after Fabric is fully ready and canvas is initialized
        setTimeout(() => setIsLoading(false), 100);
      } catch (e) { 
        console.warn('Errore caricamento Fabric.js:', e);
        setIsLoading(false);
      }
    }
    function resize() {
      if (!fabricRef.current || !canvasRef.current) return;
      const w = canvasRef.current.parentElement?.clientWidth || 420;
      fabricRef.current.setWidth(w);
      fabricRef.current.setHeight(height);
      fabricRef.current.renderAll();
    }
    setup();
    return () => {
      window.removeEventListener('resize', resize);
      if (fabricRef.current) try { fabricRef.current.dispose(); } catch {}
    };
  }, [height]);

  // Aggiorna tool, colore, spessore, sfondo
  useEffect(() => {
    if (!fabricRef.current) return;
    // Modalità disegno
    fabricRef.current.isDrawingMode = ['pencil','pen','marker','eraser'].includes(tool);
    if (tool === 'eraser') {
      // Eraser: brush bianca o trasparente
      fabricRef.current.freeDrawingBrush.color = '#fff';
      fabricRef.current.freeDrawingBrush.width = width * 2.5;
    } else if (fabricRef.current.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.color = color;
      fabricRef.current.freeDrawingBrush.width = width;
    }
    fabricRef.current.setBackgroundColor(bgColor, fabricRef.current.renderAll.bind(fabricRef.current));
  }, [tool, color, width, bgColor]);

  // Sync bidirezionale: ricevi stato
  useEffect(() => {
    if (!fabricRef.current || !syncState) return;
    try {
      fabricRef.current.loadFromJSON(syncState.json, () => {
        fabricRef.current.setBackgroundColor(syncState.bgColor || bgColor, fabricRef.current.renderAll.bind(fabricRef.current));
      });
    } catch {}
  }, [syncState, bgColor]);

  // Pulsante reset lavagna
  function handleReset() {
    if (fabricRef.current) fabricRef.current.clear();
    if (fabricRef.current) fabricRef.current.setBackgroundColor(bgColor, fabricRef.current.renderAll.bind(fabricRef.current));
    syncBoard();
  }

  function handleToolChange(newTool) {
    setTool(newTool);
    if (fabricRef.current) {
      fabricRef.current.isDrawingMode = ['pencil','pen','marker','eraser'].includes(newTool);
      if (newTool === 'text') {
        // Inserisci testo
        if (textValue.trim()) {
          const fabric = fabricRef.current.constructor;
          const textObj = new fabric.Textbox(textValue, { left: 40, top: 40, fontSize: 20, fill: color });
          fabricRef.current.add(textObj);
          setTextValue('');
        }
      }
    }
  }

  function handleColorChange(e) {
    setColor(e.target.value);
    if (fabricRef.current) fabricRef.current.freeDrawingBrush.color = e.target.value;
  }

  function handleBgColorChange(e) {
    setBgColor(e.target.value);
    if (fabricRef.current) fabricRef.current.setBackgroundColor(e.target.value, fabricRef.current.renderAll.bind(fabricRef.current));
    syncBoard();
  }

  function handleWidthChange(e) {
    setWidth(Number(e.target.value));
    if (fabricRef.current) fabricRef.current.freeDrawingBrush.width = Number(e.target.value);
  }

  function handleTextInput(e) {
    setTextValue(e.target.value);
  }

  function handleDrop(e) {
    e.preventDefault();
    if (!fabricRef.current) return;
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        fabricRef.current?.add(new fabricRef.current.constructor.Image.fromURL(ev.target.result, img => {
          img.set({ left: 60, top: 60, scaleX: 0.5, scaleY: 0.5 });
          fabricRef.current.add(img);
          syncBoard();
        }));
      };
      reader.readAsDataURL(files[0]);
    }
  }

  return (
    <div style={{ width: '100%', position: 'relative', marginBottom: 16 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
        <Tooltip title="Matita"><IconButton color={tool==='pencil'?'primary':'default'} onClick={()=>handleToolChange('pencil')} disabled={isLoading}><BrushIcon /></IconButton></Tooltip>
        <Tooltip title="Penna"><IconButton color={tool==='pen'?'primary':'default'} onClick={()=>handleToolChange('pen')} disabled={isLoading}><EditIcon /></IconButton></Tooltip>
        <Tooltip title="Pennarello"><IconButton color={tool==='marker'?'primary':'default'} onClick={()=>handleToolChange('marker')} disabled={isLoading}><FormatColorFillIcon /></IconButton></Tooltip>
        <Tooltip title="Testo"><IconButton color={tool==='text'?'primary':'default'} onClick={()=>handleToolChange('text')} disabled={isLoading}><TextFieldsIcon /></IconButton></Tooltip>
        <Tooltip title="Immagine"><IconButton onClick={()=>{}} disabled={isLoading}><ImageIcon /></IconButton></Tooltip>
        <Tooltip title="Cancellino"><IconButton color={tool==='eraser'?'primary':'default'} onClick={()=>handleToolChange('eraser')} disabled={isLoading}><RemoveCircleOutlineIcon /></IconButton></Tooltip>
        <input type="color" value={color} onChange={handleColorChange} title="Colore" disabled={isLoading} style={{ width:32, height:32, border:'none', borderRadius:6, marginLeft:8 }} />
        <input type="color" value={bgColor} onChange={handleBgColorChange} title="Sfondo" disabled={isLoading} style={{ width:32, height:32, border:'none', borderRadius:6 }} />
        <input type="range" min={1} max={12} value={width} onChange={handleWidthChange} disabled={isLoading} style={{ width:60 }} />
        {tool==='text' && <input type="text" value={textValue} onChange={handleTextInput} placeholder="Testo..." disabled={isLoading} style={{ padding:'2px 8px', borderRadius:6, fontSize:13 }} />}
        {isLoading && <CircularProgress size={20} />}
        <span style={{ fontSize:12, color:'#888' }}>Trascina immagini qui</span>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} data-testid="lavagna-canvas" style={{ width: '100%', height, borderRadius: 18, boxShadow: '0 2px 12px -6px #2d4c2a44', background: bgColor, border: '2px solid #3a5c37', display: 'block' }} />
        {isLoading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }}>
            <CircularProgress />
            <span style={{ fontSize: 12, color: '#666' }}>Caricamento lavagna...</span>
          </div>
        )}
      </div>
      <button type="button" onClick={handleReset} disabled={isLoading} style={{ position: 'absolute', top: 8, right: 12, background: '#ec407a', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px -4px #ec407a44' }}>Reset</button>
    </div>
  );
}
