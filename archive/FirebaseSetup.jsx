import React, { useState, useEffect } from 'react';

const FirebaseSetup = ({ onComplete }) => {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [showInstructions, setShowInstructions] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if Firebase is already configured
    const savedConfig = localStorage.getItem('firebaseConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setIsConfigured(true);
        setShowInstructions(false);
      } catch (err) {
        console.error('Error parsing saved config:', err);
      }
    }
  }, []);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveConfig = () => {
    // Validate required fields
    const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      alert(`Campi mancanti: ${missingFields.join(', ')}`);
      return;
    }

    // Save to localStorage
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    setIsConfigured(true);
    
    // Update the firebase.js file would require a page reload
    alert('Configurazione salvata! Ricarica la pagina per applicare le modifiche.');
  };

  const useDemoMode = () => {
    // Use localStorage as fallback for demo
    localStorage.setItem('useDemoMode', 'true');
    onComplete();
  };

  if (isConfigured) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ✅ Firebase Configurato
          </h2>
          <p className="text-gray-600 mb-6">
            La configurazione Firebase è stata salvata. 
            L'app ora supporta la sincronizzazione tra dispositivi diversi.
          </p>
          <button
            onClick={onComplete}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continua con l'App
          </button>
          <div className="mt-4">
            <button
              onClick={() => setIsConfigured(false)}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Modifica Configurazione
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-center mb-6">
          🔥 Setup Firebase per Sincronizzazione Real-time
        </h1>
        
        {showInstructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              📋 Istruzioni per Setup Firebase
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Vai su <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
              <li>Crea un nuovo progetto o seleziona uno esistente</li>
              <li>Vai su "Project Settings" (icona ingranaggio)</li>
              <li>Scorri fino a "Your apps" e clicca "Web app" (&lt;/&gt;)</li>
              <li>Registra l'app con un nome (es. "CardApp")</li>
              <li>Copia la configurazione Firebase e incollala nei campi sotto</li>
              <li>Vai su "Realtime Database" nella sidebar sinistra</li>
              <li>Clicca "Create Database" e scegli "Test mode"</li>
            </ol>
            <div className="mt-4">
              <button
                onClick={() => setShowInstructions(false)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Nascondi Istruzioni
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key *
            </label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="AIzaSy..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auth Domain *
            </label>
            <input
              type="text"
              value={config.authDomain}
              onChange={(e) => handleConfigChange('authDomain', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-project.firebaseapp.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Database URL *
            </label>
            <input
              type="text"
              value={config.databaseURL}
              onChange={(e) => handleConfigChange('databaseURL', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://your-project-default-rtdb.firebaseio.com/"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project ID *
            </label>
            <input
              type="text"
              value={config.projectId}
              onChange={(e) => handleConfigChange('projectId', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-project-id"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Bucket
            </label>
            <input
              type="text"
              value={config.storageBucket}
              onChange={(e) => handleConfigChange('storageBucket', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-project.appspot.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Messaging Sender ID
            </label>
            <input
              type="text"
              value={config.messagingSenderId}
              onChange={(e) => handleConfigChange('messagingSenderId', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123456789"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              App ID
            </label>
            <input
              type="text"
              value={config.appId}
              onChange={(e) => handleConfigChange('appId', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1:123456789:web:abcdef"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={saveConfig}
            className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            💾 Salva Configurazione Firebase
          </button>
          
          <button
            onClick={useDemoMode}
            className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            🚀 Usa Modalità Demo (Solo Locale)
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-600 text-center">
          <p>
            <strong>Modalità Demo:</strong> Funziona solo sullo stesso browser/dispositivo (localStorage).
          </p>
          <p>
            <strong>Firebase:</strong> Sincronizzazione real-time tra tutti i dispositivi e browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetup;
