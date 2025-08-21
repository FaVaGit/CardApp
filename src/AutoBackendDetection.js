import { useState, useEffect } from 'react';

// Auto-detection del backend disponibile
export function useAutoBackendDetection() {
  const [detection, setDetection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectBackend = async () => {
      console.log('🔍 Detecting available backend...');
      
      try {
        // Prima verifica se il backend ASP.NET Core è disponibile
        const realBackendAvailable = await checkRealBackend();
        console.log('🌐 Real backend available:', realBackendAvailable);

        if (realBackendAvailable) {
          setDetection({
            mode: 'realBackend',
            reason: 'ASP.NET Core backend is available and responding',
            capabilities: {
              hasRealBackend: true,
              hasBroadcastChannel: typeof BroadcastChannel !== 'undefined',
              isPrivateMode: false,
              hasLocalStorage: typeof localStorage !== 'undefined'
            }
          });
          console.log('✅ Using real ASP.NET Core backend');
          return;
        }

        // Fallback al sistema simulato
        const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';
        console.log('📡 BroadcastChannel available:', hasBroadcastChannel);

        const isPrivateMode = await checkPrivateMode();
        console.log('🔒 Private mode detected:', isPrivateMode);

        let mode, reason;
        
        if (hasBroadcastChannel && !isPrivateMode) {
          mode = 'simulatedBackend';
          reason = 'Real backend unavailable, using simulated backend with BroadcastChannel';
        } else {
          mode = 'localStorage';
          reason = isPrivateMode 
            ? 'Real backend unavailable, private/incognito mode detected, using localStorage fallback'
            : 'Real backend unavailable, BroadcastChannel not available, using localStorage fallback';
        }

        setDetection({
          mode,
          reason,
          capabilities: {
            hasRealBackend: false,
            hasBroadcastChannel,
            isPrivateMode,
            hasLocalStorage: typeof localStorage !== 'undefined'
          }
        });

        console.log(`✅ Backend detection complete: ${mode} (${reason})`);
      } catch (error) {
        console.error('❌ Backend detection failed:', error);
        
        // Fallback sicuro
        setDetection({
          mode: 'localStorage',
          reason: 'Detection failed, using safe fallback',
          error: error.message,
          capabilities: {
            hasRealBackend: false,
            hasBroadcastChannel: false,
            isPrivateMode: true,
            hasLocalStorage: typeof localStorage !== 'undefined'
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    detectBackend();
  }, []);

  return { detection, isLoading };
}

// Verifica se il backend ASP.NET Core è disponibile
async function checkRealBackend() {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Real backend not available:', error.message);
    
    // Also try alternative port 5001 (HTTPS)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const httpsResponse = await fetch('https://localhost:5001/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return httpsResponse.ok;
    } catch (httpsError) {
      console.log('Real backend not available on HTTPS either:', httpsError.message);
      return false;
    }
  }
}

// Verifica se siamo in modalità privata/incognito
async function checkPrivateMode() {
  try {
    // Test BroadcastChannel cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      const testChannel = new BroadcastChannel('__test_private_mode__');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          testChannel.close();
          resolve(true); // Probabilmente modalità privata
        }, 100);

        testChannel.addEventListener('message', () => {
          clearTimeout(timeout);
          testChannel.close();
          resolve(false); // Modalità normale
        });

        // Test di invio messaggio
        testChannel.postMessage('test');
      });
    }
    
    return false;
  } catch (error) {
    console.warn('Private mode detection failed:', error);
    return true; // Assumi modalità privata per sicurezza
  }
}
