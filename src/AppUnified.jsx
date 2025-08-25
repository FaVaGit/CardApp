import React, { useState, useEffect } from 'react';
import SimpleUserLoginUnified from './SimpleUserLoginUnified';
import { PartnerManagementUnified } from './PartnerManagementUnified';
import { useUnifiedBackend } from './useUnifiedBackend';

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
    availablePartners,
    createOrUpdateUser,
    loadUserState,
    createCouple,
    joinCouple,
    leaveCouple,
    startGameSession,
    endGameSession,
    getActiveSessions,
    clearAllUsers,
    forceRefreshData,
    getDebugInfo,
    syncData
  } = useUnifiedBackend();

  // Auto-advance steps based on backend state
  useEffect(() => {
    if (isConnecting) {
      setCurrentStep('connecting');
    } else if (backendError) {
      setCurrentStep('error');
    } else if (isConnected && !currentUser) {
      setCurrentStep('login');
    } else if (currentUser && !currentCouple) {
      setCurrentStep('partner-management');
    } else if (currentCouple) {
      setCurrentStep('game-ready');
    }
  }, [isConnecting, isConnected, backendError, currentUser, currentCouple]);

  // Connection status display
  if (currentStep === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Connecting to backend...</h2>
          <p className="text-gray-500 mt-2">Please wait while we establish connection</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'error') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{backendError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // User login step
  if (currentStep === 'login') {
    return (
      <div className="min-h-screen bg-gray-100">
        <SimpleUserLoginUnified
          onLogin={createOrUpdateUser}
          onlineUsers={onlineUsers}
          clearAllUsers={clearAllUsers}
          forceRefreshData={forceRefreshData}
        />
      </div>
    );
  }

  // Partner management step
  if (currentStep === 'partner-management') {
    return (
      <div className="min-h-screen bg-gray-100">
        <PartnerManagementUnified
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          allCouples={allCouples}
          availablePartners={availablePartners}
          onCreateCouple={createCouple}
          onJoinCouple={joinCouple}
          onLeaveCouple={leaveCouple}
          clearAllUsers={clearAllUsers}
          forceRefreshData={forceRefreshData}
          getDebugInfo={getDebugInfo}
          syncData={syncData}
        />
      </div>
    );
  }

  // Game ready state
  if (currentStep === 'game-ready') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Game Session</h1>
                <p className="text-gray-600">Couple: {currentCouple?.name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearAllUsers}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Clear Users
                </button>
                <button
                  onClick={forceRefreshData}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Refresh
                </button>
                <button
                  onClick={leaveCouple}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Leave Couple
                </button>
              </div>
            </div>
          </div>

          {/* Couple Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Couple Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {currentCouple?.name}</p>
                <p><strong>Game Type:</strong> {currentCouple?.gameType}</p>
                <p><strong>Status:</strong> {currentCouple?.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p><strong>Members:</strong></p>
                <ul className="ml-4">
                  {currentCouple?.users?.map(user => (
                    <li key={user.id} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {user.name || user.nickname} ({user.role})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Game Session Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Game Session</h2>
            {gameSession ? (
              <div>
                <p className="text-green-600 mb-4">✅ Game session is active</p>
                <div className="flex gap-2">
                  <button
                    onClick={endGameSession}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    End Session
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">No active game session</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => startGameSession('Standard')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Start Game Session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="text-sm text-gray-600">
              {JSON.stringify(getDebugInfo(), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
