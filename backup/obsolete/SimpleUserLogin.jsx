import React, { useState } from 'react';

export function SimpleUserLogin({ onLogin, onlineUsers, clearAllUsers, forceRefreshData }) {
  const [isNewUser, setIsNewUser] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    personalCode: '',
    gameType: 'Single'
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }

    // For login, require personal code
    if (!isNewUser && !formData.personalCode.trim()) {
      newErrors.personalCode = 'Il codice personale è obbligatorio per accedere';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isNewUser) {
        // Register new user
        await onLogin({
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || formData.name.trim(),
          gameType: formData.gameType,
          isOnline: true,
          availableForPairing: true
        });
      } else {
        // Login existing user by personal code
        const existingUser = onlineUsers.find(u => u.personalCode === formData.personalCode.trim());
        if (!existingUser) {
          setErrors({ personalCode: 'Codice personale non trovato' });
          return;
        }
        
        await onLogin({
          ...existingUser,
          isOnline: true,
          availableForPairing: true
        });
      }
    } catch (error) {
      setErrors({ general: error.message });
    }
  };
      name: formData.name.trim(),
      nickname: formData.nickname.trim() || null,
      personalCode: formData.personalCode.trim() || null,  // For login
      coupleCode: formData.coupleCode.trim() || null,      // For joining couple
      gameType
    };

    console.log('👤 User login data:', userData);
    onLogin(userData);
  };

  const gameTypeInfo = {
    couple: {
      title: 'Coppie',
      emoji: '💑',
      color: 'from-pink-500 to-rose-500',
      description: 'Gioco per coppie'
    },
    family: {
      title: 'Famiglie',
      emoji: '👨‍👩‍👧‍👦',
      color: 'from-green-500 to-emerald-500',
      description: 'Gioco per famiglie'
    }
  };

  const info = gameTypeInfo[gameType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center p-4">
      {/* Admin Controls Panel */}
      <div className="fixed top-4 left-4 flex space-x-2 z-50">
        {clearAllUsers && (
          <button
            onClick={clearAllUsers}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            title="Cancella tutti gli utenti dal database"
          >
            🗑️ Clear Users
          </button>
        )}
        {forceRefreshData && (
          <button
            onClick={forceRefreshData}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            title="Ricarica tutti i dati"
          >
            🔄 Refresh
          </button>
        )}
      </div>

      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{info.emoji}</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {isNewUser ? 'Crea Account' : 'Accedi'}
          </h1>
          <p className="text-gray-600">
            {info.description}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setIsNewUser(true)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              isNewUser
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🆕 Nuovo Account
          </button>
          <button
            type="button"
            onClick={() => setIsNewUser(false)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              !isNewUser
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🔐 Accedi
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Il tuo nome *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Es. Marco"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {!isNewUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice Personale *
              </label>
              <input
                type="text"
                name="personalCode"
                value={formData.personalCode}
                onChange={(e) => setFormData(prev => ({ ...prev, personalCode: e.target.value.toUpperCase() }))}
                maxLength={6}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-center text-xl font-mono ${
                  errors.personalCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ABC123"
              />
              {errors.personalCode && (
                <p className="text-red-500 text-sm mt-1">{errors.personalCode}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Il codice personale che hai ricevuto quando hai creato l'account
              </p>
            </div>
          )}

          {isNewUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname (opzionale)
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                placeholder="Es. MarcoBello"
              />
              <p className="text-xs text-gray-500 mt-1">
                Un soprannome per distinguerti dagli altri utenti
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice Coppia (opzionale)
            </label>
            <input
              type="text"
              name="coupleCode"
              value={formData.coupleCode}
              onChange={(e) => setFormData(prev => ({ ...prev, coupleCode: e.target.value.toUpperCase() }))}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-center text-xl font-mono"
              placeholder="ABC123"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se hai ricevuto un codice dal tuo partner, inseriscilo qui
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              type="submit"
              className={`w-full py-4 bg-gradient-to-r ${info.color} text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
            >
              {isNewUser ? `${info.emoji} Crea Account` : `🚀 Accedi`}
              {formData.coupleCode && ` & Unisciti`}
            </button>
            
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all duration-200"
              >
                ← Indietro
              </button>
            )}
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 I dati vengono salvati solo localmente sul tuo dispositivo
          </p>
        </div>
      </div>
    </div>
  );
}
