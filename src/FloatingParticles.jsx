// Floating particles component
export function FloatingParticles() {
  const particles = [
    '💕', '💖', '💗', '💘', '💝', '💞', '💟', '❤️', '🧡', '💛', 
    '💚', '💙', '💜', '🤍', '🖤', '🤎', '❣️', '💋', '👑', '✨'
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className={`absolute text-lg opacity-30 ${
            i % 3 === 0 ? 'animate-float' : i % 3 === 1 ? 'animate-float-delayed' : 'animate-bounce'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        >
          {particles[Math.floor(Math.random() * particles.length)]}
        </div>
      ))}
    </div>
  );
}
