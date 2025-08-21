import React, { useState } from 'react';

export function DualDeviceLoginForm({ onPartnerLogin }) {
  const [formData, setFormData] = useState({
    partnerName: '',
    role: 'partner1', // 'partner1' o 'partner2'
    coupleName: '',
    partnerNameOther: ''
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Selezione ruolo, 2: Dati coppia

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

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.partnerName.trim()) {
      newErrors.partnerName = 'Il tuo nome è obbligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.coupleName.trim()) {
      newErrors.coupleName = 'Il nome della coppia è obbligatorio';
    }
    
    if (!formData.partnerNameOther.trim()) {
      newErrors.partnerNameOther = 'Il nome del partner è obbligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    const coupleId = generateCoupleId(formData.coupleName);
    
    const partnerData = {
      name: formData.partnerName.trim(),
      role: formData.role,
      coupleId: coupleId,
      coupleName: formData.coupleName.trim(),
      partnerName: formData.partnerNameOther.trim()
    };

    onPartnerLogin(partnerData);
  };

  const generateCoupleId = (coupleName) => {
    return coupleName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36);
  };

  const getRoleIcon = (role) => {
    return role === 'partner1' ? '👨' : '👩';
  };

  const getRoleColor = (role) => {
    return role === 'partner1' ? 'from-blue-500 to-cyan-500' : 'from-pink-500 to-rose-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Esperienza Dual-Device
          </h1>
          <p className="text-gray-600">
            🎮 Ogni partner usa il proprio dispositivo 🎮
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Chi sei nella coppia?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Seleziona il tuo ruolo per personalizzare l'esperienza
              </p>
            </div>

            {/* Selezione ruolo */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'partner1' }))}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                  formData.role === 'partner1'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-4xl mb-2">👨</div>
                <div className="font-semibold text-gray-800">Partner 1</div>
                <div className="text-xs text-gray-600">Ruolo Blu</div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'partner2' }))}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                  formData.role === 'partner2'
                    ? 'border-pink-500 bg-pink-50 shadow-lg'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <div className="text-4xl mb-2">👩</div>
                <div className="font-semibold text-gray-800">Partner 2</div>
                <div className="text-xs text-gray-600">Ruolo Rosa</div>
              </button>
            </div>

            {/* Nome partner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Il tuo nome *
              </label>
              <input
                type="text"
                name="partnerName"
                value={formData.partnerName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  errors.partnerName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={`Il tuo nome come ${formData.role === 'partner1' ? 'Partner 1' : 'Partner 2'}`}
              />
              {errors.partnerName && (
                <p className="text-red-500 text-sm mt-1">{errors.partnerName}</p>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!formData.partnerName.trim()}
              className={`w-full py-4 bg-gradient-to-r ${getRoleColor(formData.role)} text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none`}
            >
              {getRoleIcon(formData.role)} Continua come {formData.role === 'partner1' ? 'Partner 1' : 'Partner 2'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className={`text-2xl p-2 rounded-full bg-gradient-to-r ${getRoleColor(formData.role)} text-white`}>
                  {getRoleIcon(formData.role)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{formData.partnerName}</div>
                  <div className="text-sm text-gray-600">{formData.role === 'partner1' ? 'Partner 1' : 'Partner 2'}</div>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Configurazione Coppia
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome della Coppia *
              </label>
              <input
                type="text"
                name="coupleName"
                value={formData.coupleName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  errors.coupleName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Es: Marco & Sofia, I Romantici..."
              />
              {errors.coupleName && (
                <p className="text-red-500 text-sm mt-1">{errors.coupleName}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Questo nome identificherà la vostra sessione di coppia
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome del {formData.role === 'partner1' ? 'Partner 2' : 'Partner 1'} *
              </label>
              <input
                type="text"
                name="partnerNameOther"
                value={formData.partnerNameOther}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  errors.partnerNameOther ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={`Nome del ${formData.role === 'partner1' ? 'secondo' : 'primo'} partner`}
              />
              {errors.partnerNameOther && (
                <p className="text-red-500 text-sm mt-1">{errors.partnerNameOther}</p>
              )}
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-purple-800 mb-2">
                💡 Come funziona:
              </h4>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Ogni partner usa il proprio dispositivo</li>
                <li>• Le carte e interazioni vengono sincronizzate</li>
                <li>• Potete disegnare e scrivere note insieme</li>
                <li>• L'altro partner deve usare lo stesso nome coppia</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors duration-200"
              >
                Indietro
              </button>
              <button
                type="submit"
                className={`flex-2 py-3 bg-gradient-to-r ${getRoleColor(formData.role)} text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
              >
                🚀 Inizia Esperienza Dual-Device
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Dati salvati solo localmente - Privacy garantita
          </p>
        </div>
      </div>
    </div>
  );
}
