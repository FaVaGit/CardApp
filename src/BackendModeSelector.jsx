import React, { useState } from 'react';

const BackendModeSelector = ({ onModeChange, currentMode = 'localStorage' }) => {
  const [selectedMode, setSelectedMode] = useState(currentMode);

  const modes = [
    {
      id: 'localStorage',
      name: 'LocalStorage (Default)',
      description: 'Sincronizzazione locale - funziona solo tra tab dello stesso browser',
      icon: '💾',
      pros: ['Veloce', 'Semplice', 'Nessuna configurazione'],
      cons: ['Solo stesso browser', 'Non funziona tra finestre incognito', 'Non simula ambiente reale']
    },
    {
      id: 'simulatedBackend',
      name: 'Backend Simulato',
      description: 'Simula un vero server - funziona tra finestre incognito e simula ambiente reale',
      icon: '🔧',
      pros: ['Simula ambiente reale', 'Funziona tra finestre incognito', 'Multi-device testing', 'Latenza simulata'],
      cons: ['Più complesso', 'Dati temporanei', 'Solo per testing']
    }
  ];

  const handleModeChange = (modeId) => {
    setSelectedMode(modeId);
    onModeChange(modeId);
  };

  return (
    <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
        🔧 Modalità Multi-Device
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {modes.map(mode => (
          <div
            key={mode.id}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedMode === mode.id
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => handleModeChange(mode.id)}
          >
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">{mode.icon}</span>
              <div>
                <h4 className="font-bold text-gray-800">{mode.name}</h4>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </div>
              {selectedMode === mode.id && (
                <div className="ml-auto">
                  <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-1">✅ Vantaggi:</h5>
                <ul className="text-xs text-green-600 space-y-1">
                  {mode.pros.map((pro, i) => (
                    <li key={i}>• {pro}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-orange-700 mb-1">⚠️ Limitazioni:</h5>
                <ul className="text-xs text-orange-600 space-y-1">
                  {mode.cons.map((con, i) => (
                    <li key={i}>• {con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedMode === 'simulatedBackend' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          <h4 className="font-medium text-blue-900 mb-2">🎯 Ideale per:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Testing su finestre incognito separate</li>
            <li>• Simulazione ambiente di produzione</li>
            <li>• Test multi-device realistici</li>
            <li>• Demo e presentazioni</li>
          </ul>
          
          <div className="mt-3 p-3 bg-blue-100 rounded text-xs text-blue-800">
            <strong>Come testare:</strong> Apri più finestre incognito, ognuna funzionerà come un dispositivo separato.
            Gli utenti si vedranno e potranno formare coppie come in un ambiente reale.
          </div>
        </div>
      )}
      
      {selectedMode === 'localStorage' && (
        <div className="mt-4 p-4 bg-amber-50 rounded-xl">
          <h4 className="font-medium text-amber-900 mb-2">📋 Come testare:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Usa tab normali dello stesso browser</li>
            <li>• Oppure profili: <code className="bg-amber-200 px-1 rounded">?profile=user1</code></li>
            <li>• Non funziona tra finestre incognito diverse</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BackendModeSelector;
