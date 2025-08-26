import React, { useState } from 'react';
import SimpleAuth from './SimpleAuth';
import GameTypeSelector from './GameTypeSelector';
import SimpleCardGame from './SimpleCardGame';
import CoupleGame from './CoupleGame';

/**
 * SIMPLIFIED APP ARCHITECTURE
 * 
 * Clear separation of concerns:
 * 1. Authentication (SimpleAuth) - DECOUPLED from game types
 * 2. Game Type Selection (GameTypeSelector) - DECOUPLED from authentication 
 * 3. Card Game (SimpleCardGame) - DECOUPLED from everything else
 * 
 * Each component is independently testable
 * Backend drives the frontend (not vice versa)
 * No complex state management
 */
export default function SimpleApp() {
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth', 'game-selection', 'playing'
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState(null);

  console.log('🚀 SimpleApp rendering...', { currentScreen, authenticatedUser, selectedGameType });

  // Clear all users (admin function)
  const clearAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/clear-users', {
        method: 'POST',
      });
      
      if (response.ok) {
        console.log('✅ All users cleared');
        // Reset app state
        setCurrentScreen('auth');
        setAuthenticatedUser(null);
        setSelectedGameType(null);
      } else {
        console.error('❌ Failed to clear users:', response.status);
      }
    } catch (error) {
      console.error('❌ Error clearing users:', error);
    }
  };

  // Authentication successful
  const handleAuthSuccess = (user) => {
    console.log('✅ Authentication successful:', user);
    setAuthenticatedUser(user);
    setCurrentScreen('game-selection');
  };

  // Game type selected
  const handleGameTypeSelected = (gameType, updatedUser) => {
    console.log('✅ Game type selected:', gameType, updatedUser);
    setSelectedGameType(gameType);
    setAuthenticatedUser(updatedUser);
    setCurrentScreen('playing');
  };

  // Logout
  const handleLogout = () => {
    console.log('🔄 Logging out...');
    setCurrentScreen('auth');
    setAuthenticatedUser(null);
    setSelectedGameType(null);
  };

  // Back to game selection
  const handleBackToGameSelection = () => {
    console.log('🔄 Back to game selection...');
    setCurrentScreen('game-selection');
    setSelectedGameType(null);
  };

  // Render appropriate screen
  switch (currentScreen) {
    case 'auth':
      return (
        <SimpleAuth
          onAuthSuccess={handleAuthSuccess}
          onClearUsers={clearAllUsers}
        />
      );

    case 'game-selection':
      return (
        <GameTypeSelector
          user={authenticatedUser}
          onGameTypeSelected={handleGameTypeSelected}
          onLogout={handleLogout}
        />
      );

    case 'playing':
      // Render different components based on game type
      if (selectedGameType && selectedGameType.id === 'Couple') {
        return (
          <CoupleGame
            user={authenticatedUser}
            onExit={handleBackToGameSelection}
          />
        );
      } else {
        return (
          <SimpleCardGame
            user={authenticatedUser}
            gameType={selectedGameType}
            onExit={handleBackToGameSelection}
          />
        );
      }

    default:
      return (
        <div className="min-h-screen bg-red-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              ❌ Errore
            </h1>
            <p className="text-red-600 mb-4">
              Schermata sconosciuta: {currentScreen}
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Torna al login
            </button>
          </div>
        </div>
      );
  }
}
