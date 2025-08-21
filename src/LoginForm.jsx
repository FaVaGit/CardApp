import React, { useState } from 'react';

export function LoginForm({ onLogin, onBack }) {
  const [formData, setFormData] = useState({
    partnerName1: '',
    partnerName2: '',
    relationshipStart: '',
    coupleNickname: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.partnerName1.trim() && formData.partnerName2.trim()) {
      onLogin(formData);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Floating hearts */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-300 text-3xl animate-bounce opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            💕
          </div>
        ))}
      </div>

      <div className="max-w-md w-full bg-white bg-opacity-90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse">💝</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Benvenuti al Gioco della Complicità
          </h1>
          <p className="text-gray-600 text-sm">
            Iniziate il vostro viaggio romantico insieme
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="partnerName1" className="block text-sm font-medium text-gray-700 mb-1">
              Nome del primo partner ❤️
            </label>
            <input
              type="text"
              id="partnerName1"
              name="partnerName1"
              value={formData.partnerName1}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-purple-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="Il tuo nome..."
              required
            />
          </div>

          <div>
            <label htmlFor="partnerName2" className="block text-sm font-medium text-gray-700 mb-1">
              Nome del secondo partner 💖
            </label>
            <input
              type="text"
              id="partnerName2"
              name="partnerName2"
              value={formData.partnerName2}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-purple-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="Nome del partner..."
              required
            />
          </div>

          <div>
            <label htmlFor="coupleNickname" className="block text-sm font-medium text-gray-700 mb-1">
              Soprannome della coppia ✨ (opzionale)
            </label>
            <input
              type="text"
              id="coupleNickname"
              name="coupleNickname"
              value={formData.coupleNickname}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-purple-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="Il vostro soprannome insieme..."
            />
          </div>

          <div>
            <label htmlFor="relationshipStart" className="block text-sm font-medium text-gray-700 mb-1">
              Da quando state insieme? 💑 (opzionale)
            </label>
            <input
              type="date"
              id="relationshipStart"
              name="relationshipStart"
              value={formData.relationshipStart}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-purple-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          <div className="flex space-x-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                ← Indietro
              </button>
            )}
            <button
              type="submit"
              disabled={!formData.partnerName1.trim() || !formData.partnerName2.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Inizia l'Avventura 🚀
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            I vostri dati vengono salvati solo localmente sul vostro dispositivo 🔐
          </p>
        </div>
      </div>
    </div>
  );
}
