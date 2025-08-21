import { useEffect, useState } from 'react';
import { useSimplifiedMultiUser } from './useSimplifiedMultiUser';

export function useUnifiedMultiUser() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [useFirebase, setUseFirebase] = useState(false);
  
  // Always use the localStorage hook as base
  const localHook = useSimplifiedMultiUser();

  useEffect(() => {
    // Check if Firebase is configured
    const firebaseConfig = localStorage.getItem('firebaseConfig');
    const useDemoMode = localStorage.getItem('useDemoMode');
    
    if (firebaseConfig && !useDemoMode) {
      setUseFirebase(true);
      setIsConfigured(true);
      console.log('🔥 Firebase mode enabled');
    } else if (useDemoMode) {
      setUseFirebase(false);
      setIsConfigured(true);
      console.log('💻 Demo mode enabled');
    } else {
      setIsConfigured(false);
      console.log('⚙️ Configuration needed');
    }
  }, []);

  // Return the localStorage hook with additional metadata
  return {
    ...localHook,
    isConfigured,
    useFirebase
  };
}
