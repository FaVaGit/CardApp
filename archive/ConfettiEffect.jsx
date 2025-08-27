import { useEffect, useState } from 'react';

export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return { showConfetti, triggerConfetti };
}

export function ConfettiEffect({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-full animate-ping`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#ff69b4', '#ff1493', '#9370db', '#4169e1', '#00ced1', '#ffd700'][Math.floor(Math.random() * 6)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}
