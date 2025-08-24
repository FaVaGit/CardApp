import { useState, useCallback } from 'react';

export function useCardSharing() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [cardToShare, setCardToShare] = useState(null);

  // Apre il modal di condivisione per una carta specifica
  const openShareModal = useCallback((card) => {
    setCardToShare(card);
    setIsShareModalOpen(true);
  }, []);

  // Chiude il modal di condivisione
  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
    setCardToShare(null);
  }, []);

  // Condivisione rapida senza modal (per azioni dirette)
  const quickShare = useCallback(async (card, currentUser, method = 'native') => {
    const prompts = Array.isArray(card.prompts) ? card.prompts : [card.content];
    const promptText = prompts.join('\n\n');
    
    const cardText = `💕 Gioco della Complicità - ${card.title || 'Carta'} ${card.emoji || '🎯'}

${promptText}

---
Pescata da: ${currentUser?.name || 'Anonimo'}
🎮 Gioca anche tu su: ${window.location.origin}`;

    const cardData = encodeURIComponent(JSON.stringify({
      title: card.title,
      emoji: card.emoji,
      content: prompts,
      category: card.category,
      color: card.color,
      sharedBy: currentUser?.name || 'Anonimo'
    }));
    
    const shareableLink = `${window.location.origin}?sharedCard=${cardData}`;

    try {
      switch (method) {
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: `💕 Gioco della Complicità - ${card.title}`,
              text: cardText,
              url: shareableLink
            });
          } else {
            throw new Error('Web Share API not supported');
          }
          break;

        case 'clipboard':
          await navigator.clipboard.writeText(cardText);
          return 'text';

        case 'link':
          await navigator.clipboard.writeText(shareableLink);
          return 'link';

        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(cardText)}`;
          window.open(whatsappUrl, '_blank');
          break;

        default:
          throw new Error('Metodo di condivisione non supportato');
      }
      
      return 'success';
    } catch (error) {
      console.error('Errore nella condivisione:', error);
      throw error;
    }
  }, []);

  // Funzione per gestire carte condivise in arrivo (da URL)
  const handleIncomingSharedCard = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCardData = urlParams.get('sharedCard');
    
    if (sharedCardData) {
      try {
        const cardData = JSON.parse(decodeURIComponent(sharedCardData));
        
        // Rimuovi il parametro dall'URL per evitare conflitti
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        return {
          ...cardData,
          isShared: true,
          id: `shared_${Date.now()}`
        };
      } catch (error) {
        console.error('Errore nel parsing della carta condivisa:', error);
        return null;
      }
    }
    
    return null;
  }, []);

  // Genera statistiche di condivisione
  const getShareStats = useCallback((card) => {
    const prompts = Array.isArray(card.prompts) ? card.prompts : [card.content];
    const totalLength = prompts.join(' ').length;
    
    return {
      category: card.category || 'generale',
      complexity: totalLength > 200 ? 'alta' : totalLength > 100 ? 'media' : 'bassa',
      promptCount: prompts.length,
      estimatedReadTime: Math.ceil(totalLength / 200) // parole al minuto
    };
  }, []);

  return {
    isShareModalOpen,
    cardToShare,
    openShareModal,
    closeShareModal,
    quickShare,
    handleIncomingSharedCard,
    getShareStats
  };
}
