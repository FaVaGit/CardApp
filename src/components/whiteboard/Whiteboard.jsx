import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Collapse, Divider, Button, Typography, Slider } from '@mui/material';
import { styled } from '@mui/material/styles';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import BrushIcon from '@mui/icons-material/Brush';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Dynamic import Fabric to avoid SSR issues
let fabricRef = null;
async function ensureFabric() {
  if (fabricRef) return fabricRef;
  const mod = await import('fabric');
  fabricRef = mod.fabric || mod; // compat
  return fabricRef;
}

// Toolbar container with shadow
const Toolbar = styled(Box)(({ theme }) => ({
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(6px)',
  borderRadius: 12,
  padding: theme.spacing(1),
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  maxWidth: 320,
  zIndex: 20
}));

const Whiteboard = ({
  value, // { json, bgColor, version }
  onChange, // (nextState, { reason, localOps }) => void
  disabled = false,
  loading = false,
  height = 480,
  toolbarInitiallyOpen = true,
  debounceMs = 600,
  onExport // optional callback receiving dataURL
}) => {
  const canvasEl = useRef(null);
  const fabCanvas = useRef(null);
  const [open, setOpen] = useState(toolbarInitiallyOpen);
  const [strokeColor, setStrokeColor] = useState('#222');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState(value?.bgColor || '#f8f8f8');
  const [brushWidth, setBrushWidth] = useState(4);
  const [zoom, setZoom] = useState(1);
  const history = useRef([]);
  const future = useRef([]);
  const lastEmitRef = useRef(0);
  const debounceTimer = useRef(null);

  // Initialize Fabric
  useEffect(() => {
    let disposed = false;
    ensureFabric().then(fabric => {
      if (disposed) return;
      const c = new fabric.Canvas(canvasEl.current, {
        backgroundColor: bgColor,
        isDrawingMode: true,
        selection: true,
        preserveObjectStacking: true
      });
      // Attach reference for E2E / debug
      try { canvasEl.current.__fabricCanvas = c; window.__fabricCanvas = c; } catch {/* ignore */}
      c.freeDrawingBrush.color = strokeColor;
      c.freeDrawingBrush.width = brushWidth;
      fabCanvas.current = c;

      const record = (reason = 'auto') => {
        try {
          const json = c.toJSON(['id']);
          history.current.push(json);
          if (history.current.length > 50) history.current.shift();
          future.current = []; // clear redo stack
          scheduleEmit(reason);
        } catch {/* ignore */}
      };

      c.on('path:created', () => record('draw')); // drawing
      c.on('object:added', e => { if (!e?.target?._skipRecord) record('add'); });
  c.on('object:modified', () => record('modify'));
  c.on('object:removed', () => record('remove'));

      // If initial value present load it
      if (value?.json) {
        try { c.loadFromJSON(value.json, () => { c.renderAll(); }); } catch {/* ignore */}
      }
    });
    return () => { disposed = true; if (fabCanvas.current) fabCanvas.current.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once

  // External value changes (remote sync)
  useEffect(() => {
    const c = fabCanvas.current;
    if (!c) return;
    if (value?.json && value.version && value.version !== lastEmitRef.current) {
      try {
        c.loadFromJSON(value.json, () => { c.renderAll(); });
        if (value.bgColor && value.bgColor !== bgColor) {
          c.setBackgroundColor(value.bgColor, () => c.renderAll());
          setBgColor(value.bgColor);
        }
      } catch {/* ignore */}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.version]);

  const scheduleEmit = (reason) => {
    if (disabled) return;
    const now = Date.now();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const c = fabCanvas.current;
      if (!c) return;
      try {
        const json = c.toJSON(['id']);
        const next = { json, bgColor, version: now };
        lastEmitRef.current = now;
        // Expose for E2E
        try { window.__latestLavagnaState = next; } catch {/* ignore */}
        onChange && onChange(next, { reason, localOps: 1 });
      } catch {/* ignore */}
    }, debounceMs);
  };

  const handleUndo = () => {
    const c = fabCanvas.current; if (!c) return;
    if (history.current.length <= 1) return;
    const current = history.current.pop(); // remove current
    future.current.push(current);
    const prev = history.current[history.current.length - 1];
    c.loadFromJSON(prev, () => c.renderAll());
    scheduleEmit('undo');
  };

  const handleRedo = () => {
    const c = fabCanvas.current; if (!c) return;
    if (!future.current.length) return;
    const nextState = future.current.pop();
    history.current.push(nextState);
    c.loadFromJSON(nextState, () => c.renderAll());
    scheduleEmit('redo');
  };

  const addText = () => {
    const fabric = fabricRef; const c = fabCanvas.current; if (!fabric || !c) return;
    const t = new fabric.IText('Testo', { left: 50, top: 50, fill: strokeColor });
    c.add(t); c.setActiveObject(t); c.renderAll();
  };

  const addRect = () => {
    const fabric = fabricRef; const c = fabCanvas.current; if (!fabric || !c) return;
    const r = new fabric.Rect({ left: 80, top: 80, width: 120, height: 80, fill: fillColor, stroke: strokeColor, strokeWidth: 2 });
    c.add(r); c.renderAll();
  };

  const addCircle = () => {
    const fabric = fabricRef; const c = fabCanvas.current; if (!fabric || !c) return;
    const circ = new fabric.Circle({ left: 140, top: 140, radius: 50, fill: fillColor, stroke: strokeColor, strokeWidth: 2 });
    c.add(circ); c.renderAll();
  };

  const clearBoard = () => {
    const c = fabCanvas.current; if (!c) return;
    c.getObjects().forEach(o => c.remove(o));
    c.renderAll();
    scheduleEmit('clear');
  };

  const exportPNG = () => {
    const c = fabCanvas.current; if (!c) return;
    const dataURL = c.toDataURL({ format: 'png' });
    onExport && onExport(dataURL);
    // Also trigger download
    const a = document.createElement('a');
    a.href = dataURL; a.download = `lavagna-${Date.now()}.png`; a.click();
  };

  const handleZoom = (dir) => {
    const c = fabCanvas.current; if (!c) return;
    let next = zoom + (dir === 'in' ? 0.1 : -0.1);
    next = Math.max(0.4, Math.min(3, next));
    setZoom(next);
    c.setZoom(next);
  };

  const changeBg = (color) => {
    const c = fabCanvas.current; if (!c) return;
    setBgColor(color);
    c.setBackgroundColor(color, () => c.renderAll());
    scheduleEmit('background');
  };

  // Brush width slider update
  const handleBrushWidthChange = (_, v) => {
    setBrushWidth(v);
    const c = fabCanvas.current; if (!c) return;
    c.freeDrawingBrush.width = v;
  };

  // Color pickers simple inputs
  const ColorInput = ({ label, value, onChange }) => (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="caption" sx={{ minWidth: 70 }}>{label}</Typography>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 40, height: 32, border: 'none', background: 'transparent' }} />
    </Box>
  );

  useEffect(() => {
    const c = fabCanvas.current; if (!c) return;
    c.freeDrawingBrush.color = strokeColor;
  }, [strokeColor]);

  const toolbarButton = (icon, tip, handler, disabledLocal = false) => (
    <Tooltip title={tip} placement="right">
      <span>
        <IconButton size="small" onClick={handler} disabled={disabled || disabledLocal} sx={{ bgcolor: '#fff' }}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Box position="relative" width="100%">
      {loading && (
        <Box position="absolute" top={0} left={0} right={0} bottom={0} display="flex" alignItems="center" justifyContent="center" sx={{ bgcolor: 'rgba(255,255,255,0.6)', zIndex: 30 }}>
          <Typography variant="caption" color="text.secondary">Caricamento lavagna...</Typography>
        </Box>
      )}
      <Box position="absolute" top={8} left={8}>
        <Toolbar>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2">Lavagna</Typography>
            <IconButton size="small" onClick={() => setOpen(o => !o)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
          <Collapse in={open}>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {toolbarButton(<BrushIcon />, 'Disegno libero', () => { const c = fabCanvas.current; if (c) c.isDrawingMode = true; })}
                {toolbarButton(<TextFieldsIcon />, 'Testo', addText)}
                {toolbarButton(<CropSquareIcon />, 'Rettangolo', addRect)}
                {toolbarButton(<RadioButtonUncheckedIcon />, 'Cerchio', addCircle)}
                {toolbarButton(<DeleteSweepIcon />, 'Pulisci', clearBoard)}
                {toolbarButton(<SaveAltIcon />, 'Esporta PNG', exportPNG)}
                {toolbarButton(<UndoIcon />, 'Annulla', handleUndo, history.current.length <= 1)}
                {toolbarButton(<RedoIcon />, 'Ripeti', handleRedo, future.current.length === 0)}
                {toolbarButton(<ZoomInIcon />, 'Zoom +', () => handleZoom('in'))}
                {toolbarButton(<ZoomOutIcon />, 'Zoom -', () => handleZoom('out'))}
              </Box>

              <Divider sx={{ my: 1 }} />
              <ColorInput label="Colore tratto" value={strokeColor} onChange={setStrokeColor} />
              <ColorInput label="Colore riemp." value={fillColor} onChange={setFillColor} />
              <ColorInput label="Sfondo" value={bgColor} onChange={changeBg} />

              <Box>
                <Typography variant="caption">Spessore tratto</Typography>
                <Slider size="small" min={1} max={48} value={brushWidth} onChange={handleBrushWidthChange} />
              </Box>

              <Button variant="outlined" size="small" onClick={() => { const c = fabCanvas.current; if (c) c.isDrawingMode = !c.isDrawingMode; }}>
                {fabCanvas.current?.isDrawingMode ? 'Modalità Oggetti' : 'Modalità Disegno'}
              </Button>
            </Box>
          </Collapse>
        </Toolbar>
      </Box>
      <canvas ref={canvasEl} width={900} height={height} style={{ width: '100%', height, background: bgColor, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} />
    </Box>
  );
};

export default Whiteboard;
