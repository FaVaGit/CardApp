import React from 'react';

export function ShareDemoButton() {
  const handleGenerateTestLink = () => {
    const testCard = {
      title: "Ricordi speciali",
      emoji: "💝",
      content: [
        "Qual è il primo ricordo che hai di noi insieme?",
        "Racconta un momento in cui ti sei sentito/a particolarmente vicino/a a me"
      ],
      category: "intimita",
      color: "from-purple-400 to-pink-300",
      sharedBy: "Demo User"
    };

    const cardData = encodeURIComponent(JSON.stringify(testCard));
    const shareableLink = `${window.location.origin}?sharedCard=${cardData}`;
    
    // Apri in una nuova finestra per testare
    window.open(shareableLink, '_blank');
    
    // Copia anche negli appunti
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert('Link di test copiato negli appunti e aperto in nuova finestra!');
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleGenerateTestLink}
        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium"
      >
        🧪 Test Link Condivisione
      </button>
    </div>
  );
}
