import React, { useState, useEffect } from 'react';
import { ModeSelector } from './ModeSelector';
import { SimpleUserLogin } from './SimpleUserLogin';
import { PartnerManagement } from './PartnerManagement';
import { useBackend } from './useBackend';

export default function App() {
  console.log('🚀 App rendering...');
  
  const [currentStep, setCurrentStep] = useState('connecting');

  const {
    isConnected,
    isConnecting,
    error: backendError,
    currentUser,
    onlineUsers,
    currentCouple,
    allCouples,
    gameSession,
    initializeConnection,
    registerUser,
    loginUser,
    createCouple,
    joinUserByCode,
    leaveCouple,
    switchCouple,
    getAllCouples,
    createGameSession,
    getUserState,
    logout,
    clearAllUsers,
    forceRefreshData
  } = useBackend();

  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  useEffect(() => {
    if (isConnecting) {
      setCurrentStep('connecting');
    } else if (backendError) {
      setCurrentStep('error');
    } else if (isConnected && !currentUser) {
      setCurrentStep('modeSelection');
    } else if (currentUser && !gameSession) {
      setCurrentStep('partner');
    }
  }, [isConnecting, isConnected, backendError, currentUser, gameSession]);

  const handleModeSelection = () => {
    setCurrentStep('login');
  };

  const handleLogin = async (userData) => {
    console.log('Login attempt:', userData);
    
    try {
      if (userData.action === 'register') {
        console.log('📝 Registering user...');
        await registerUser({
          ...userData,
          gameType: 'couple'
        });
        console.log('✅ User registered successfully');
      } else {
        console.log('🔑 Logging in existing user...');
        await loginUser({
          ...userData,
          gameType: 'couple'
        });
        console.log('✅ User logged in successfully');
      }
    } catch (error) {
      console.error('❌ Error in login:', error);
      alert('Errore durante il login: ' + error.message);
    }
  };

  const handleBack = () => {
    setCurrentStep('modeSelection');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentStep('modeSelection');
  };

  // Schermata di connessione
  if (currentStep === 'connecting') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold">Connessione al backend...</p>
          <p className="text-sm text-gray-400 mt-2">ASP.NET Core + SignalR</p>
        </div>
      </div>
    );
  }

  // Schermata di errore
  if (currentStep === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-red-400">
            Errore di Connessione
          </h1>
          <p className="text-gray-300 mb-6">
            {backendError || 'Impossibile connettersi al backend ASP.NET Core'}
          </p>
          <div className="bg-gray-800 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-400 mb-2">Assicurati che:</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Il backend ASP.NET Core sia in esecuzione su localhost:5000</li>
              <li>• SignalR hub sia configurato correttamente</li>
              <li>• Non ci siano problemi di CORS</li>
            </ul>
          </div>
          <button
            onClick={initializeConnection}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🔄 Riprova Connessione
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'partner') {
    // Calcola il partner status con i dati reali
    const calculatePartnerStatus = () => {
      if (!currentCouple) {
        return { status: 'single' };
      }
      
      const partner = currentCouple.members?.find(m => m.userId !== currentUser?.id);
      if (!partner) {
        return { status: 'coupled', partner: null };
      }
      
      // Trova i dati online più recenti del partner
      const partnerOnlineData = onlineUsers.find(u => u.id === partner.userId);
      
      const result = {
        status: 'coupled',
        currentUser: currentUser,
        partner: partnerOnlineData || partner, // Usa i dati online se disponibili, altrimenti quelli della coppia
        bothOnline: currentUser && partnerOnlineData?.isOnline === true
      };
      
      // Debug log
      console.log('🔍 Partner Status Debug:', {
        currentCouple: currentCouple?.name,
        partnerFromCouple: partner?.name || 'NO_NAME',
        partnerOnlineData: partnerOnlineData?.name || 'NOT_FOUND_ONLINE',
        finalPartnerUsed: result.partner?.name || 'NO_FINAL_NAME',
        partnerIsOnline: result.partner?.isOnline,
        onlineUsersCount: onlineUsers.length,
        onlineUserIds: onlineUsers.map(u => u.id)
      });
      
      return result;
    };

    return (
      <PartnerManagement
        currentUser={currentUser}
        allUsers={onlineUsers}
        onlineUsers={onlineUsers}
        currentCouple={currentCouple}
        allCouples={allCouples}
        partnerStatus={calculatePartnerStatus()}
        gameSession={gameSession}
        connectionStatus={isConnected ? 'connected' : 'disconnected'}
        onJoinUserByCode={joinUserByCode}
        onCreateCouple={createCouple}
        onLeaveCouple={leaveCouple}
        onSwitchCouple={switchCouple}
        onGetAllCouples={getAllCouples}
        onCreateGameSession={createGameSession}
        getUserState={getUserState}
        onLogout={handleLogout}
        onBack={handleBack}
        clearAllUsers={clearAllUsers}
        forceRefreshData={forceRefreshData}
      />
    );
  }

  if (currentStep === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-300">
              Backend: <span className="text-green-400">ASP.NET Core + SignalR</span>
            </p>
            <p className="text-xs text-gray-400">
              Connesso: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Sì' : 'No'}
              </span>
            </p>
          </div>
          
          <SimpleUserLogin
            gameType="couple"
            onLogin={handleLogin}
            onBack={handleBack}
            clearAllUsers={clearAllUsers}
            forceRefreshData={forceRefreshData}
          />
        </div>
      </div>
    );
  }
  
  // Schermata principale - selezione modalità
  return (
    <ModeSelector onModeSelect={handleModeSelection} />
  );
}
