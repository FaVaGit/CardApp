import React, { useState } from 'react';

export function MultiUserLoginForm({ onRegister, onLogin, allUsers }) {
  const [isNewCouple, setIsNewCouple] = useState(true);
  const [formData, setFormData] = useState({
    partnerName1: '',
    partnerName2: '',
    coupleNickname: '',
    relationshipStart: '',
    loginIdentifier: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Rimuovi l'errore quando l'utente inizia a scrivere
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isNewCouple) {
      if (!formData.partnerName1.trim()) {
        newErrors.partnerName1 = 'Il nome del primo partner è obbligatorio';
      }
      if (!formData.partnerName2.trim()) {
        newErrors.partnerName2 = 'Il nome del secondo partner è obbligatorio';
      }
      // Verifica che il nickname non sia già in uso
      if (formData.coupleNickname.trim()) {
        const existingCouple = allUsers.find(user => 
          user.coupleNickname && user.coupleNickname.toLowerCase() === formData.coupleNickname.toLowerCase()
        );
        if (existingCouple) {
          newErrors.coupleNickname = 'Questo nickname è già in uso da un\'altra coppia';
        }
      }
    } else {
      if (!formData.loginIdentifier.trim()) {
        newErrors.loginIdentifier = 'Inserisci il nickname di coppia o i nomi dei partner';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isNewCouple) {
      // Registrazione nuova coppia
      const newCoupleData = {
        partnerName1: formData.partnerName1.trim(),
        partnerName2: formData.partnerName2.trim(),
        coupleNickname: formData.coupleNickname.trim() || null,
        relationshipStart: formData.relationshipStart || null
      };
      onRegister(newCoupleData);
    } else {
      // Login coppia esistente
      const loginData = {
        identifier: formData.loginIdentifier.trim()
      };
      
      // Cerca per nickname o nomi
      const foundCouple = allUsers.find(user => {
        const identifier = loginData.identifier.toLowerCase();
        const coupleNickname = user.coupleNickname?.toLowerCase();
        const namesCombo1 = `${user.partnerName1.toLowerCase()} & ${user.partnerName2.toLowerCase()}`;
        const namesCombo2 = `${user.partnerName2.toLowerCase()} & ${user.partnerName1.toLowerCase()}`;
        
        return coupleNickname === identifier || 
               namesCombo1.includes(identifier) || 
               namesCombo2.includes(identifier);
      });

      if (foundCouple) {
        onLogin(foundCouple);
      } else {
        setErrors({ loginIdentifier: 'Coppia non trovata. Verifica i dati inseriti.' });
      }
    }
  };

  const getExistingCouplesPreview = () => {
    return allUsers.slice(0, 3).map(user => 
      user.coupleNickname || `${user.partnerName1} & ${user.partnerName2}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gioco della Complicità
          </h1>
          <p className="text-gray-600">
            🌟 Versione Multi-Coppia 🌟
          </p>
          <div className="mt-4 p-3 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-700">
              Coppie registrate: <strong>{allUsers.length}</strong>
            </p>
            {allUsers.length > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                Es: {getExistingCouplesPreview().join(', ')}
                {allUsers.length > 3 && '...'}
              </p>
            )}
          </div>
        </div>

        {/* Toggle tra registrazione e login */}
        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => {
              setIsNewCouple(true);
              setFormData({
                partnerName1: '',
                partnerName2: '',
                coupleNickname: '',
                relationshipStart: '',
                loginIdentifier: ''
              });
              setErrors({});
            }}
            className={`flex-1 py-3 px-4 rounded-l-xl font-semibold transition-all duration-200 ${
              isNewCouple
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Nuova Coppia
          </button>
          <button
            type="button"
            onClick={() => {
              setIsNewCouple(false);
              setFormData({
                partnerName1: '',
                partnerName2: '',
                coupleNickname: '',
                relationshipStart: '',
                loginIdentifier: ''
              });
              setErrors({});
            }}
            className={`flex-1 py-3 px-4 rounded-r-xl font-semibold transition-all duration-200 ${
              !isNewCouple
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Accedi
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isNewCouple ? (
            // Form per nuova registrazione
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Primo Partner *
                </label>
                <input
                  type="text"
                  name="partnerName1"
                  value={formData.partnerName1}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    errors.partnerName1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Es: Marco"
                />
                {errors.partnerName1 && (
                  <p className="text-red-500 text-sm mt-1">{errors.partnerName1}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Secondo Partner *
                </label>
                <input
                  type="text"
                  name="partnerName2"
                  value={formData.partnerName2}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    errors.partnerName2 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Es: Sofia"
                />
                {errors.partnerName2 && (
                  <p className="text-red-500 text-sm mt-1">{errors.partnerName2}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname di Coppia (opzionale)
                </label>
                <input
                  type="text"
                  name="coupleNickname"
                  value={formData.coupleNickname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    errors.coupleNickname ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Es: I Romantici, Team Amore..."
                />
                {errors.coupleNickname && (
                  <p className="text-red-500 text-sm mt-1">{errors.coupleNickname}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Il nickname vi identificherà nelle sessioni multiplayer
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inizio Relazione (opzionale)
                </label>
                <input
                  type="date"
                  name="relationshipStart"
                  value={formData.relationshipStart}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
              </div>
            </>
          ) : (
            // Form per login
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname di Coppia o Nomi Partner *
                </label>
                <input
                  type="text"
                  name="loginIdentifier"
                  value={formData.loginIdentifier}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    errors.loginIdentifier ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Es: I Romantici o Marco & Sofia"
                />
                {errors.loginIdentifier && (
                  <p className="text-red-500 text-sm mt-1">{errors.loginIdentifier}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Inserisci il vostro nickname di coppia o i nomi dei partner
                </p>
              </div>

              {allUsers.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Coppie Registrate:
                  </h4>
                  <div className="space-y-1">
                    {allUsers.slice(0, 5).map((user, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {user.coupleNickname || `${user.partnerName1} & ${user.partnerName2}`}
                      </div>
                    ))}
                    {allUsers.length > 5 && (
                      <div className="text-xs text-gray-500">
                        ... e altre {allUsers.length - 5} coppie
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 hover:from-purple-600 hover:to-pink-600"
          >
            {isNewCouple ? '💕 Registra Coppia' : '🚀 Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 I dati vengono salvati solo localmente sul tuo dispositivo
          </p>
        </div>
      </div>
    </div>
  );
}
