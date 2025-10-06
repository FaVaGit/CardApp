import { useEffect, useRef, useCallback } from 'react';
import fabric, { loadFabric } from '../fabricShim';

/**
 * CanvasCardTable
 * - Visualizza la carta corrente con Fabric.js
 * - Animazione di ingresso su nuova carta
 * - API imperativa via ref: expose renderCard(card)
 */
export default function CanvasCardTable({ card, onReady }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const currentGroupRef = useRef(null);

  const fabricLibRef = useRef(null);
  const pendingCardRef = useRef(null); // memorizza carta arrivata prima del load

  const renderCard = useCallback((c) => {
    if (!fabricRef.current || !fabricLibRef.current) return;
    const canvas = fabricRef.current;
    const F = fabricLibRef.current;
    // Rimuovi gruppo precedente
    if (currentGroupRef.current) {
      canvas.remove(currentGroupRef.current);
      currentGroupRef.current = null;
    }

    if (!c) {
      canvas.renderAll();
      return;
    }

    const WIDTH = canvas.getWidth();
    const HEIGHT = canvas.getHeight();

    const cardWidth = Math.min(420, WIDTH * 0.9);
    const cardHeight = Math.min(260, HEIGHT * 0.6);

  if (!F.Rect || !F.Gradient || !F.Textbox || !F.Group || !F.util) return;
  const bg = new F.Rect({
      rx: 24,
      ry: 24,
      width: cardWidth,
      height: cardHeight,
      fill: 'linear-gradient(#8e24aa,#ec407a)', // fallback, gradient verrà sovrascritto
      left: -cardWidth / 2,
      top: -cardHeight / 2,
      shadow: {
        color: 'rgba(0,0,0,0.25)',
        blur: 18,
        offsetX: 0,
        offsetY: 6
      }
    });

    // Simula gradient con pattern semplice (Fabric non supporta string gradient CSS diretta)
  const gradient = new F.Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: cardWidth, y2: cardHeight },
      colorStops: [
        { offset: 0, color: '#8e24aa' },
        { offset: 1, color: '#ec407a' }
      ]
    });
    bg.set('fill', gradient);

  const text = new F.Textbox(c.content || c.title || 'Carta', {
      width: cardWidth - 48,
      fontSize: 20,
      fill: '#ffffff',
      textAlign: 'center',
      fontFamily: 'Poppins, Nunito, system-ui, sans-serif'
    });
    text.set({ left: -text.width / 2, top: -text.height / 2 });

  const group = new F.Group([bg, text], {
      left: WIDTH / 2,
      top: HEIGHT / 2,
      originX: 'center',
      originY: 'center',
      opacity: 0,
      scaleX: 0.9,
      scaleY: 0.9,
      angle: -6
    });

    canvas.add(group);
    currentGroupRef.current = group;

    // composite animation: opacity, scale, angle overshoot
    try {
      F.util.animate({
      startValue: 0,
      endValue: 1,
      duration: 520,
        easing: (F.util.ease && (F.util.ease.easeOutCubic || F.util.ease.quadOut)) || (t=>t),
      onChange: v => {
        const overshoot = v < 0.7 ? (v/0.7) : (1 - (v-0.7)/0.3 * 0.4); // quick rise then slight settle
        const scale = 0.9 + overshoot * 0.12; // 0.9 -> ~1.02 -> 1.0
        const angle = -6 + v * 6; // -6 to 0
        group.set({ opacity: v, scaleX: scale, scaleY: scale, angle });
        canvas.renderAll();
      }
      });
    } catch { canvas.renderAll(); }
  }, []);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ensure = async () => {
      // Controllo più robusto: se esiste già un canvas fabric attivo su questo elemento, disposalo prima
      if (fabricRef.current) {
        try {
          if (!fabricRef.current.disposed) fabricRef.current.dispose();
        } catch { /* ignore */ }
        fabricRef.current = null;
        fabricLibRef.current = null;
      }
      
      // Controlla se l'elemento canvas DOM ha già attributi Fabric
      if (canvasEl.hasAttribute('data-fabric')) {
        return; // Element already initialized by Fabric, skip
      }
      
      const F = fabric || await loadFabric();
      if (!F) return;
      fabricLibRef.current = F;
      
      try {
        const fabricCanvas = new F.Canvas(canvasEl, {
          selection: false,
          backgroundColor: '#fdf3f7'
        });
        fabricRef.current = fabricCanvas;

        const resize = () => {
          const parent = canvasEl.parentElement;
          const w = parent.clientWidth;
          const h = Math.min(400, Math.max(260, w * 0.55));
          fabricCanvas.setWidth(w);
          fabricCanvas.setHeight(h);
          fabricCanvas.renderAll();
          if (currentGroupRef.current) {
            // Re-centra il gruppo corrente su resize
            const WIDTH = fabricCanvas.getWidth();
            const HEIGHT = fabricCanvas.getHeight();
            currentGroupRef.current.set({ left: WIDTH / 2, top: HEIGHT / 2, originX: 'center', originY: 'center' });
            fabricCanvas.renderAll();
          } else if (card) {
            renderCard(card);
          }
        };
        resize();
        window.addEventListener('resize', resize);

        if (onReady) onReady({ renderCard });

        // Se era arrivata una carta mentre Fabric non era pronto, renderizzala ora
        if (pendingCardRef.current) {
          const pc = pendingCardRef.current;
          pendingCardRef.current = null;
          try { renderCard(pc); } catch { /* ignore */ }
        }

        return () => {
          window.removeEventListener('resize', resize);
          try {
            // Dispose solo se ancora attivo e non già nullo
            if (fabricRef.current && !fabricRef.current.disposed) {
              fabricRef.current.dispose();
            }
          } catch { /* ignore dispose errors */ }
          fabricRef.current = null;
          fabricLibRef.current = null;
        };
      } catch (fabricError) {
        console.warn('Canvas initialization failed:', fabricError);
        return () => {}; // empty cleanup
      }
    };
    const cleanupPromise = ensure();
    return () => { cleanupPromise.then(()=>{}).catch(()=>{}); };
  }, [card, onReady, renderCard]);

  // Re-render quando prop card cambia
  useEffect(() => {
    if (!card) {
      renderCard(null);
      return;
    }
    if (!fabricRef.current || !fabricLibRef.current) {
      // Libreria non ancora pronta: accoda
      pendingCardRef.current = card;
      return;
    }
    renderCard(card);
  }, [card, renderCard]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block', borderRadius: 24 }} />
    </div>
  );
}
