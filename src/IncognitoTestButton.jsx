import React from 'react';

const IncognitoTestButton = ({ debugInfo, backendMode, connectionStatus }) => {
  const testIncognitoFeatures = () => {
    console.log('🧪 Testing incognito features...');
    
    // Test 1: localStorage access
    try {
      localStorage.setItem('incognito_test', 'test_value');
      const value = localStorage.getItem('incognito_test');
      console.log('✅ localStorage access:', value === 'test_value' ? 'Working' : 'Failed');
      localStorage.removeItem('incognito_test');
    } catch (error) {
      console.log('❌ localStorage access: Failed -', error.message);
    }
    
    // Test 2: BroadcastChannel (se backend simulato)
    if (backendMode === 'simulatedBackend') {
      try {
        const testChannel = new BroadcastChannel('test_channel');
        console.log('✅ BroadcastChannel: Working');
        
        testChannel.postMessage({ test: 'message', timestamp: Date.now() });
        testChannel.close();
      } catch (error) {
        console.log('❌ BroadcastChannel: Failed -', error.message);
      }
    }
    
    // Test 3: Storage events (solo localStorage mode)
    if (backendMode === 'localStorage') {
      const testStorageEvent = () => {
        const handler = (e) => {
          console.log('🔄 Storage event received:', e.key);
          window.removeEventListener('storage', handler);
        };
        window.addEventListener('storage', handler);
        
        // Trigger storage event
        localStorage.setItem('test_event', Date.now().toString());
        
        setTimeout(() => {
          localStorage.removeItem('test_event');
          window.removeEventListener('storage', handler);
        }, 1000);
      };
      
      testStorageEvent();
    }
    
    // Test 4: Check current capabilities
    console.log('🐛 Current debug info:', debugInfo);
    console.log('🔧 Backend mode:', backendMode);
    console.log('📶 Connection status:', connectionStatus);
    
    // Test 5: Show storage contents
    console.log('📦 Current localStorage keys:', Object.keys(localStorage));
    
    alert(`Test Results:\n\n` +
      `Modalità incognito: ${debugInfo?.isIncognito ? 'Sì' : 'No'}\n` +
      `Window ID: ${debugInfo?.windowId}\n` +
      `Backend mode: ${backendMode}\n` +
      `Connection status: ${connectionStatus || 'N/A'}\n` +
      `Storage isolation: ${debugInfo?.storageIsolation}\n` +
      `Può vedere altri incognito: ${debugInfo?.canSeeOtherIncognitoWindows ? 'Sì' : 'No'}\n\n` +
      `Controlla la console per dettagli tecnici.`);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={testIncognitoFeatures}
      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
      title="Testa funzionalità incognito"
    >
      🧪 Test Incognito
    </button>
  );
};

export default IncognitoTestButton;
