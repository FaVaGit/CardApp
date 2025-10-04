import { useEffect, useRef } from 'react';
import fabric, { loadFabric } from '../fabricShim';

/** Animated subtle hearts background using Fabric.js */
export default function CoupleBackgroundCanvas({ opacity=0.25 }) {
  const ref = useRef(null);
  const fabricRef = useRef(null);

  useEffect(()=>{
  (async () => {
    // Evita doppia inizializzazione (StrictMode o rimontaggi rapidi)
    if (fabricRef.current) return;
    const F = fabric || await loadFabric();
    if(!ref.current || !F) return;
    try {
      const canvas = new F.Canvas(ref.current, { selection:false });
      fabricRef.current = canvas;

    const resize = ()=>{
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.calcOffset();
    };
    resize();
    window.addEventListener('resize', resize);

  const colors = ['#ec407a','#f06292','#ba68c8','#ab47bc'];

    function makeHeart(x,y,scale,delay){
      if (!F || !F.Path) return; // safety
      const path = new F.Path('M 272.70117 121.65039 C 234.94831 68.182385 181.07397 51.369585 138.11523 72.929688 C 95.15652 51.369585 41.282166 68.182385 3.5292969 121.65039 C -40.176074 183.03355 -6.189385 257.99878 23.984375 292.95312 C 59.523235 333.99939 131.86144 399.51138 138.11523 399.51172 C 144.36902 399.51138 216.70723 333.99939 252.24609 292.95312 C 282.41986 257.99878 316.40655 183.03355 272.70117 121.65039 z', { 
        left:x, top:y, fill: colors[Math.floor(Math.random()*colors.length)], opacity:0, originX:'center', originY:'center', scaleX:scale, scaleY:scale });
      canvas.add(path);
      const float = ()=>{
        const toY = y - 40 - Math.random()*60;
        path.animate('top', toY, { duration: 8000 + Math.random()*4000, onChange: canvas.renderAll.bind(canvas), easing: fabric.util.ease.easeInOutSine, onComplete: ()=>{ path.top = y; float(); } });
      };
      setTimeout(()=>{
        path.animate('opacity', opacity, { duration: 1800, onChange: canvas.renderAll.bind(canvas) });
        float();
      }, delay);
    }

    const count = 14;
    for(let i=0;i<count;i++){
      makeHeart(Math.random()*window.innerWidth, Math.random()*window.innerHeight, 0.25 + Math.random()*0.4, i*260);
    }

    return ()=>{ 
      window.removeEventListener('resize', resize); 
      try { canvas.dispose(); } catch { /* ignore */ }
      fabricRef.current = null;
    };
    } catch { /* silent init failure */ }
  })();
  },[opacity]);

  return <canvas ref={ref} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', filter:'blur(0.4px)' }} />;
}
