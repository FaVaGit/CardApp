import React, { useState } from 'react';

export function ShareCardModal({ card, isOpen, onClose, currentUser, onCreateSharedSession }) {
  const [copiedText, setCopiedText] = useState('');
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Debug: Log delle props ricevute
  console.log('🔍 ShareCardModal props:', {
    card: card?.title,
    isOpen,
    currentUser: currentUser?.name,
    onCreateSharedSession: typeof onCreateSharedSession,
    onCreateSharedSessionExists: !!onCreateSharedSession
  });

  if (!isOpen || !card) return null;

  // Genera il testo della carta da condividere
  const generateCardText = () => {
    const prompts = Array.isArray(card.prompts) ? card.prompts : [card.content];
    const promptText = prompts.join('\n\n');
    
    return `💕 Gioco della Complicità - ${card.title || 'Carta'} ${card.emoji || '🎯'}

${promptText}

---
Pescata da: ${currentUser?.name || 'Anonimo'}
🎮 Gioca anche tu su: ${window.location.origin}`;
  };

  // Copia il testo negli appunti
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setShowCopyFeedback(true);
      setTimeout(() => {
        setShowCopyFeedback(false);
        setCopiedText('');
      }, 2000);
    } catch (err) {
      console.error('Errore nella copia:', err);
      // Fallback per browser che non supportano clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedText(type);
      setShowCopyFeedback(true);
      setTimeout(() => {
        setShowCopyFeedback(false);
        setCopiedText('');
      }, 2000);
    }
  };

  // Genera link condivisibile
  const generateShareableLink = () => {
    const cardData = encodeURIComponent(JSON.stringify({
      title: card.title,
      emoji: card.emoji,
      content: Array.isArray(card.prompts) ? card.prompts : [card.content],
      category: card.category,
      color: card.color,
      sharedBy: currentUser?.name || 'Anonimo'
    }));
    
    return `${window.location.origin}?sharedCard=${cardData}`;
  };

  // Condividi via Web Share API (mobile)
  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `💕 Gioco della Complicità - ${card.title}`,
          text: generateCardText(),
          url: generateShareableLink()
        });
      } catch (err) {
        console.error('Errore nella condivisione:', err);
      }
    } else {
      // Fallback: copia il link
      copyToClipboard(generateShareableLink(), 'link');
    }
  };

  // Condividi via social media
  const shareOnSocial = (platform) => {
    const text = encodeURIComponent(generateCardText());
    const url = encodeURIComponent(generateShareableLink());
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      email: `mailto:?subject=💕 Gioco della Complicità&body=${text}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  // Salva la carta come immagine (usando canvas)
  const saveAsImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Dimensioni del canvas
      canvas.width = 600;
      canvas.height = 800;
      
      // Sfondo con gradiente
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (card.color) {
        // Estrai i colori dal gradiente Tailwind
        const colorMap = {
          'from-purple-400 to-pink-300': ['#c084fc', '#f9a8d4'],
          'from-blue-400 to-purple-300': ['#60a5fa', '#d8b4fe'],
          'from-green-400 to-cyan-300': ['#4ade80', '#67e8f9'],
          'from-yellow-400 to-orange-300': ['#facc15', '#fed7aa'],
          'from-red-400 to-pink-300': ['#f87171', '#f9a8d4'],
          'from-indigo-400 to-purple-300': ['#818cf8', '#d8b4fe']
        };
        
        const colors = colorMap[card.color] || ['#c084fc', '#f9a8d4'];
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
      } else {
        gradient.addColorStop(0, '#c084fc');
        gradient.addColorStop(1, '#f9a8d4');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Bordo arrotondato (simulato)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Emoji
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#374151';
      ctx.fillText(card.emoji || '🎯', canvas.width / 2, 150);
      
      // Titolo
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(card.title || 'Carta Speciale', canvas.width / 2, 220);
      
      // Contenuto
      ctx.font = '24px Arial';
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      
      const prompts = Array.isArray(card.prompts) ? card.prompts : [card.content];
      let yPosition = 300;
      
      prompts.forEach((prompt, index) => {
        const lines = wrapText(ctx, prompt, canvas.width - 80);
        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, canvas.width / 2, yPosition + (lineIndex * 30));
        });
        yPosition += (lines.length * 30) + 40;
      });
      
      // Footer
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('💕 Gioco della Complicità', canvas.width / 2, canvas.height - 100);
      ctx.font = '16px Arial';
      ctx.fillText(`Condiviso da: ${currentUser?.name || 'Anonimo'}`, canvas.width / 2, canvas.height - 60);
      
      // Scarica l'immagine
      const link = document.createElement('a');
      link.download = `carta-complicita-${card.title?.replace(/\s+/g, '-').toLowerCase() || 'speciale'}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
    } catch (err) {
      console.error('Errore nel salvataggio dell\'immagine:', err);
      alert('Errore nel salvataggio dell\'immagine');
    }
  };

  // Funzione per dividere il testo in righe
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">📤</span>
              Condividi Carta
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Anteprima carta */}
        <div className="p-6 bg-gray-50">
          <div className={`bg-gradient-to-br ${card.color || 'from-purple-400 to-pink-300'} p-1 rounded-2xl shadow-lg`}>
            <div className="bg-white bg-opacity-95 backdrop-blur-sm p-4 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl mb-2">{card.emoji || '🎯'}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {card.title || 'Carta Speciale'}
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  {Array.isArray(card.prompts) ? card.prompts.map((prompt, index) => (
                    <p key={index} className="leading-relaxed">{prompt}</p>
                  )) : (
                    <p className="leading-relaxed">{card.content}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opzioni di condivisione */}
        <div className="p-6 space-y-4">
          {/* Sessione Condivisa - NUOVA OPZIONE */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🎮 Sessione Condivisa
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">NUOVO</span>
            </h3>
            <button
              onClick={async () => {
                console.log('🎮 Pulsante sessione condivisa cliccato');
                console.log('onCreateSharedSession function:', onCreateSharedSession);
                console.log('Card data:', card);
                
                if (isCreatingSession) return;
                
                if (!onCreateSharedSession) {
                  console.error('❌ onCreateSharedSession function not provided');
                  alert('Funzione di creazione sessione non disponibile');
                  return;
                }
                
                setIsCreatingSession(true);
                try {
                  console.log('📡 Calling onCreateSharedSession...');
                  const result = await onCreateSharedSession(card);
                  console.log('✅ Session creation result:', result);
                  onClose();
                } catch (error) {
                  console.error('❌ Errore creazione sessione:', error);
                  alert(`Errore: ${error.message}`);
                } finally {
                  setIsCreatingSession(false);
                }
              }}
              disabled={isCreatingSession}
              className="w-full p-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingSession ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando sessione...
                </span>
              ) : (
                '🎯 Crea Sessione Real-Time'
              )}
            </button>
            <p className="text-xs text-gray-600 mt-2">
              Crea una stanza condivisa dove entrambi potete vedere la carta, chattare e disegnare insieme in tempo reale
            </p>
          </div>

          {/* Condivisione rapida */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Condivisione Rapida</h3>
            <button
              onClick={shareViaWebAPI}
              className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
            >
              📱 Condividi (Nativo)
            </button>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Social Media</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => shareOnSocial('whatsapp')}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                📱 WhatsApp
              </button>
              <button
                onClick={() => shareOnSocial('telegram')}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                ✈️ Telegram
              </button>
              <button
                onClick={() => shareOnSocial('twitter')}
                className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
              >
                🐦 Twitter
              </button>
              <button
                onClick={() => shareOnSocial('facebook')}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📘 Facebook
              </button>
            </div>
          </div>

          {/* Copia negli appunti */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Copia negli Appunti</h3>
            <div className="space-y-2">
              <button
                onClick={() => copyToClipboard(generateCardText(), 'text')}
                className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                📄 Copia Testo Carta
              </button>
              <button
                onClick={() => copyToClipboard(generateShareableLink(), 'link')}
                className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                🔗 Copia Link Condivisibile
              </button>
            </div>
          </div>

          {/* Salva come immagine */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Salva</h3>
            <div className="space-y-2">
              <button
                onClick={saveAsImage}
                className="w-full p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                🖼️ Salva come Immagine
              </button>
              <button
                onClick={() => shareOnSocial('email')}
                className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                📧 Invia via Email
              </button>
            </div>
          </div>
        </div>

        {/* Feedback copia */}
        {showCopyFeedback && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            ✅ {copiedText === 'text' ? 'Testo copiato!' : 'Link copiato!'}
          </div>
        )}
      </div>
    </div>
  );
}
