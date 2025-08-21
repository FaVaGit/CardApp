import React from 'react';

export function HistoryModal({ isOpen, onClose, history, stats, onClearHistory }) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">La Vostra Storia 📖</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Statistiche */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">📊 Le Vostre Statistiche</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white bg-opacity-70 p-3 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">{stats.totalCards}</div>
                <div className="text-sm text-gray-600">Carte Pescate</div>
              </div>
              <div className="bg-white bg-opacity-70 p-3 rounded-xl">
                <div className="text-2xl font-bold text-pink-600">{stats.uniqueCards}</div>
                <div className="text-sm text-gray-600">Carte Uniche</div>
              </div>
            </div>
            
            {stats.favoriteCategories.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">🏆 Categorie Preferite</h4>
                <div className="flex flex-wrap gap-2">
                  {stats.favoriteCategories.map(([category, count]) => (
                    <span key={category} className="bg-white bg-opacity-70 px-3 py-1 rounded-full text-sm">
                      {category} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* History delle carte */}
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">🎲 Carte Pescate</h3>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-4 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors duration-200"
              >
                Cancella Cronologia
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎴</div>
              <p>Nessuna carta pescata ancora!</p>
              <p className="text-sm">Iniziate a giocare per vedere la vostra cronologia qui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((card, index) => (
                <div
                  key={card.id}
                  className={`p-4 rounded-2xl border-l-4 bg-gradient-to-r ${card.color} bg-opacity-20 border-purple-400`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{card.emoji}</span>
                        <h4 className="font-semibold text-gray-800">{card.title}</h4>
                        <span className="text-sm bg-white bg-opacity-70 px-2 py-1 rounded-full">
                          #{card.originalId || card.id}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {card.prompts.map((prompt, i) => (
                          <p key={i} className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-medium">{i + 1}.</span> {prompt}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-right">
                    Pescata il {formatDate(card.playedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
