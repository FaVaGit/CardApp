import React, { useState } from 'react';

function SimpleUserLoginUnified({ onLogin, onlineUsers, clearAllUsers, forceRefreshData }) {
  const [isNewUser, setIsNewUser] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    personalCode: '',
    gameType: 'Single'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    setErrors({});

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
          setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleClearUsers = async () => {
    try {
      await clearAllUsers();
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  const handleRefresh = async () => {
    try {
      await forceRefreshData();
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
      {/* Admin Panel */}
      <div className="fixed top-4 left-4 bg-white rounded-lg shadow-md p-4 z-10">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Admin Controls</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleClearUsers}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Clear Users
          </button>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Login Form */}
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">CardApp</h1>
            <p className="text-gray-600 mt-2">Accedi o registrati per continuare</p>
          </div>

          {/* Toggle between login and register */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIsNewUser(true);
                setErrors({});
                setFormData(prev => ({ ...prev, personalCode: '' }));
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isNewUser
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Nuovo Utente
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNewUser(false);
                setErrors({});
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isNewUser
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Accedi
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Inserisci il tuo nome"
                disabled={isLoading}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Nickname field (only for new users) */}
            {isNewUser && (
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname (opzionale)
                </label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Inserisci un nickname"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Game Type field (only for new users) */}
            {isNewUser && (
              <div>
                <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo di Gioco
                </label>
                <select
                  id="gameType"
                  name="gameType"
                  value={formData.gameType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="Single">Single</option>
                  <option value="Couple">Couple</option>
                  <option value="Group">Group</option>
                </select>
              </div>
            )}

            {/* Personal Code field (only for existing users) */}
            {!isNewUser && (
              <div>
                <label htmlFor="personalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Personale *
                </label>
                <input
                  type="text"
                  id="personalCode"
                  name="personalCode"
                  value={formData.personalCode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.personalCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Inserisci il tuo codice personale"
                  disabled={isLoading}
                />
                {errors.personalCode && <p className="text-red-500 text-sm mt-1">{errors.personalCode}</p>}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isNewUser ? 'Registrazione...' : 'Accesso...'}
                </span>
              ) : (
                isNewUser ? 'Registrati' : 'Accedi'
              )}
            </button>
          </form>

          {/* Online users info */}
          {onlineUsers.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Utenti Online ({onlineUsers.length})
              </h3>
              <div className="space-y-1">
                {onlineUsers.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">{user.name || user.nickname}</span>
                    <span className="text-xs text-gray-400">({user.personalCode})</span>
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <p className="text-xs text-gray-400">...e altri {onlineUsers.length - 5}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimpleUserLoginUnified;
