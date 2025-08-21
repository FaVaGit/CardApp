import React, { useState } from 'react';

export function AdvancedLoginForm({ 
  onRegister, 
  onLogin, 
  onBack,
  allUsers, 
  gameMode, 
  entityType, 
  playMode 
}) {
  const [isNewEntity, setIsNewEntity] = useState(true);
  const [currentPartner, setCurrentPartner] = useState('partner1'); // Per dual-device
  const [formData, setFormData] = useState({
    // Dati comuni
    nickname: '',
    memberNames: ['', ''],
    relationshipStart: '',
    
    // Dati famiglia (estende memberNames)
    familySize: 2,
    childrenAges: [],
    
    // Dati dual-device
    partner1Name: '',
    partner2Name: '',
    coupleId: '',
    
    // Login
    loginIdentifier: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset errori
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMemberNameChange = (index, value) => {
    const newMemberNames = [...formData.memberNames];
    newMemberNames[index] = value;
    setFormData(prev => ({
      ...prev,
      memberNames: newMemberNames
    }));
  };

  const addFamilyMember = () => {
    if (formData.memberNames.length < 8) { // Limite massimo famiglia
      setFormData(prev => ({
        ...prev,
        memberNames: [...prev.memberNames, ''],
        familySize: prev.familySize + 1
      }));
    }
  };

  const removeFamilyMember = (index) => {
    if (formData.memberNames.length > 2) { // Minimo 2 membri
      const newMemberNames = formData.memberNames.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        memberNames: newMemberNames,
        familySize: prev.familySize - 1
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isNewEntity) {
      // Validazione registrazione
      if (gameMode === 'dual-device') {
        if (!formData.partner1Name.trim()) {
          newErrors.partner1Name = 'Nome del primo partner obbligatorio';
        }
        if (!formData.partner2Name.trim()) {
          newErrors.partner2Name = 'Nome del secondo partner obbligatorio';
        }
      } else {
        // Validazione nomi membri
        formData.memberNames.forEach((name, index) => {
          if (!name.trim()) {
            newErrors[`member${index}`] = `Nome membro ${index + 1} obbligatorio`;
          }
        });
      }

      // Verifica nickname duplicato
      if (formData.nickname.trim()) {
        const existingEntity = allUsers.find(user => 
          user.nickname && user.nickname.toLowerCase() === formData.nickname.toLowerCase()
        );
        if (existingEntity) {
          newErrors.nickname = 'Questo nickname è già in uso';
        }
      }
    } else {
      // Validazione login
      if (gameMode === 'dual-device') {
        if (!formData.coupleId.trim()) {
          newErrors.coupleId = 'ID coppia obbligatorio per dual-device';
        }
        if (!formData.partner1Name.trim() && !formData.partner2Name.trim()) {
          newErrors.partner1Name = 'Nome di almeno un partner obbligatorio';
        }
      } else {
        if (!formData.loginIdentifier.trim()) {
          newErrors.loginIdentifier = 'Inserisci nickname o nomi membri';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('📝 AdvancedLoginForm submit:', { isNewEntity, gameMode, entityType, formData }); // Debug
    
    if (!validateForm()) {
      console.log('❌ Form validation failed'); // Debug
      return;
    }

    if (isNewEntity) {
      // Registrazione
      const entityData = {
        action: 'register',
        entityType,
        gameMode,
        playMode,
        nickname: formData.nickname.trim() || null,
        memberNames: gameMode === 'dual-device' 
          ? [formData.partner1Name.trim(), formData.partner2Name.trim()]
          : formData.memberNames.filter(name => name.trim()),
        relationshipStart: formData.relationshipStart || null,
        currentPartner: gameMode === 'dual-device' ? currentPartner : null,
        partner1Name: formData.partner1Name.trim(),
        partner2Name: formData.partner2Name.trim()
      };

      if (entityType === 'family') {
        entityData.familySize = formData.memberNames.filter(name => name.trim()).length;
        entityData.childrenAges = formData.childrenAges;
      }

      console.log('📝 Sending registration data:', entityData); // Debug
      onRegister(entityData);
    } else {
      // Login
      if (gameMode === 'dual-device') {
        const loginData = {
          action: 'login',
          isDualDevice: true,
          coupleId: formData.coupleId.trim(),
          partnerRole: currentPartner,
          partnerName: currentPartner === 'partner1' ? formData.partner1Name.trim() : formData.partner2Name.trim(),
          entityType
        };
        console.log('📝 Sending dual-device login data:', loginData); // Debug
        onLogin(loginData);
      } else {
        const loginData = {
          action: 'login',
          identifier: formData.loginIdentifier.trim(),
          entityType,
          isDualDevice: false
        };
        
        const foundEntity = allUsers.find(user => {
          const identifier = loginData.identifier.toLowerCase();
          return user.entityType === entityType && (
            (user.nickname && user.nickname.toLowerCase() === identifier) ||
            user.memberNames?.some(name => name.toLowerCase().includes(identifier))
          );
        });

        if (foundEntity) {
          console.log('📝 Sending login data:', foundEntity); // Debug
          onLogin({ ...foundEntity, action: 'login' });
        } else {
          console.log('❌ Entity not found for login'); // Debug
          setErrors({ loginIdentifier: `${entityType === 'couple' ? 'Coppia' : 'Famiglia'} non trovata` });
        }
      }
    }
  };

  const getEntityDisplayInfo = () => {
    const info = {
      couple: {
        title: 'Coppia',
        emoji: '💑',
        color: 'from-pink-500 to-rose-500'
      },
      family: {
        title: 'Famiglia',
        emoji: '👨‍👩‍👧‍👦',
        color: 'from-green-500 to-emerald-500'
      }
    };
    return info[entityType];
  };

  const getGameModeDisplayInfo = () => {
    const info = {
      single: {
        title: 'Dispositivo Singolo',
        emoji: '📱'
      },
      'dual-device': {
        title: 'Due Dispositivi',
        emoji: '📱📱'
      }
    };
    return info[gameMode];
  };

  const entityInfo = getEntityDisplayInfo();
  const modeInfo = getGameModeDisplayInfo();
  const existingEntities = allUsers.filter(user => user.entityType === entityType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Accesso {entityInfo.title}
          </h1>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>{modeInfo.emoji}</span>
              <span>{modeInfo.title}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{entityInfo.emoji}</span>
              <span>{entityInfo.title}</span>
            </div>
          </div>
          
          {existingEntities.length > 0 && (
            <div className="mt-3 p-3 bg-purple-50 rounded-xl">
              <p className="text-sm text-purple-700">
                {entityInfo.title === 'Coppia' ? 'Coppie' : 'Famiglie'} registrate: <strong>{existingEntities.length}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Toggle registrazione/login */}
        {gameMode !== 'dual-device' && (
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => {
                setIsNewEntity(true);
                setFormData({
                  nickname: '',
                  memberNames: entityType === 'family' ? ['', '', ''] : ['', ''],
                  relationshipStart: '',
                  familySize: entityType === 'family' ? 3 : 2,
                  childrenAges: [],
                  loginIdentifier: ''
                });
                setErrors({});
              }}
              className={`flex-1 py-3 px-4 rounded-l-xl font-semibold transition-all duration-200 ${
                isNewEntity
                  ? `bg-gradient-to-r ${entityInfo.color} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Nuova {entityInfo.title}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNewEntity(false);
                setFormData({
                  nickname: '',
                  memberNames: ['', ''],
                  relationshipStart: '',
                  familySize: 2,
                  childrenAges: [],
                  loginIdentifier: ''
                });
                setErrors({});
              }}
              className={`flex-1 py-3 px-4 rounded-r-xl font-semibold transition-all duration-200 ${
                !isNewEntity
                  ? `bg-gradient-to-r ${entityInfo.color} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Accedi
            </button>
          </div>
        )}

        {/* Dual-device partner selector */}
        {gameMode === 'dual-device' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quale partner sei?
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPartner('partner1')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  currentPartner === 'partner1'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👨 Partner 1
              </button>
              <button
                type="button"
                onClick={() => setCurrentPartner('partner2')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  currentPartner === 'partner2'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👩 Partner 2
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isNewEntity ? (
            // Form registrazione
            <>
              {gameMode === 'dual-device' ? (
                // Dual-device registration
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Partner 1 *
                    </label>
                    <input
                      type="text"
                      name="partner1Name"
                      value={formData.partner1Name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                        errors.partner1Name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nome del primo partner"
                    />
                    {errors.partner1Name && (
                      <p className="text-red-500 text-sm mt-1">{errors.partner1Name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Partner 2 *
                    </label>
                    <input
                      type="text"
                      name="partner2Name"
                      value={formData.partner2Name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                        errors.partner2Name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nome del secondo partner"
                    />
                    {errors.partner2Name && (
                      <p className="text-red-500 text-sm mt-1">{errors.partner2Name}</p>
                    )}
                  </div>
                </>
              ) : (
                // Single device registration
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membri {entityInfo.title} *
                    </label>
                    {formData.memberNames.map((name, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleMemberNameChange(index, e.target.value)}
                          className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                            errors[`member${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder={`Nome membro ${index + 1}`}
                        />
                        {entityType === 'family' && formData.memberNames.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(index)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            ✖
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {entityType === 'family' && formData.memberNames.length < 8 && (
                      <button
                        type="button"
                        onClick={addFamilyMember}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                      >
                        + Aggiungi membro famiglia
                      </button>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname {entityInfo.title} (opzionale)
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    errors.nickname ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Es: ${entityType === 'couple' ? 'I Romantici' : 'Famiglia Rossi'}`}
                />
                {errors.nickname && (
                  <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>
                )}
              </div>

              {entityType === 'couple' && (
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
              )}
            </>
          ) : (
            // Form login
            <>
              {gameMode === 'dual-device' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Coppia *
                    </label>
                    <input
                      type="text"
                      name="coupleId"
                      value={formData.coupleId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                        errors.coupleId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="ID della coppia (fornito dal partner)"
                    />
                    {errors.coupleId && (
                      <p className="text-red-500 text-sm mt-1">{errors.coupleId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Il tuo nome *
                    </label>
                    <input
                      type="text"
                      name={currentPartner === 'partner1' ? 'partner1Name' : 'partner2Name'}
                      value={currentPartner === 'partner1' ? formData.partner1Name : formData.partner2Name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                        errors.partner1Name || errors.partner2Name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Il tuo nome"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nickname {entityInfo.title} o Nomi Membri *
                  </label>
                  <input
                    type="text"
                    name="loginIdentifier"
                    value={formData.loginIdentifier}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                      errors.loginIdentifier ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`Es: ${entityType === 'couple' ? 'I Romantici o Marco & Sofia' : 'Famiglia Rossi o Marco'}`}
                  />
                  {errors.loginIdentifier && (
                    <p className="text-red-500 text-sm mt-1">{errors.loginIdentifier}</p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              className={`w-full py-4 bg-gradient-to-r ${entityInfo.color} text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
            >
              {isNewEntity 
                ? `${entityInfo.emoji} Registra ${entityInfo.title}` 
                : `🚀 Accedi${gameMode === 'dual-device' ? ` come ${currentPartner === 'partner1' ? 'Partner 1' : 'Partner 2'}` : ''}`
              }
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

        {/* Entities list per login normale */}
        {!isNewEntity && gameMode !== 'dual-device' && existingEntities.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {entityInfo.title === 'Coppia' ? 'Coppie' : 'Famiglie'} Registrate:
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {existingEntities.slice(0, 5).map((entity, index) => (
                <div key={index} className="text-sm text-gray-600">
                  • {entity.nickname || entity.memberNames?.join(' & ') || 'Sconosciuto'}
                </div>
              ))}
              {existingEntities.length > 5 && (
                <div className="text-xs text-gray-500">
                  ... e altre {existingEntities.length - 5} {entityInfo.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 I dati vengono salvati solo localmente sul tuo dispositivo
          </p>
        </div>
      </div>
    </div>
  );
}
