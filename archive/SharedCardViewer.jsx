import React from 'react';

export function SharedCardViewer({ sharedCard, onClose, onPlayGame }) {
  if (!sharedCard) return null;

  const prompts = Array.isArray(sharedCard.content) ? sharedCard.content : [sharedCard.content];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 text-center">
          <div className="text-2xl mb-2">🎁</div>
          <h2 className="text-xl font-bold text-gray-800">
            Carta Condivisa!
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {sharedCard.sharedBy} ha condiviso questa carta con te
          </p>
        </div>

        {/* Carta condivisa */}
        <div className="p-6">
          <div className={`bg-gradient-to-br ${sharedCard.color || 'from-purple-400 to-pink-300'} p-1 rounded-2xl shadow-lg`}>
            <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-center">
                <div className="text-6xl mb-3 animate-bounce">
                  {sharedCard.emoji || '🎯'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {sharedCard.title || 'Carta Speciale'}
                </h3>
                <div className="space-y-3">
                  {prompts.map((prompt, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        <span className="text-purple-600 font-bold">{index + 1}.</span> {prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Informazioni aggiuntive */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              📂 Categoria: <span className="font-medium capitalize">{sharedCard.category || 'Generale'}</span>
            </p>
            {prompts.length > 1 && (
              <p className="mt-1">
                🎯 {prompts.length} domande da esplorare insieme
              </p>
            )}
          </div>
        </div>

        {/* Azioni */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={onPlayGame}
            className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
          >
            🎮 Gioca Anche Tu!
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const text = `💕 Ho ricevuto questa carta dal Gioco della Complicità!\n\n${sharedCard.title} ${sharedCard.emoji}\n\n${prompts.join('\n\n')}\n\n🎮 Gioca anche tu su: ${window.location.origin}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              📱 Condividi
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              ❌ Chiudi
            </button>
          </div>

          {/* Call to action */}
          <div className="mt-4 p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-sm text-purple-700 font-medium">
              💕 Gioco della Complicità
            </p>
            <p className="text-xs text-purple-600 mt-1">
              150+ carte per rafforzare il vostro legame
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
