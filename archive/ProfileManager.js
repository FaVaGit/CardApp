// Utility per gestire i profili multi-device simulati
export class ProfileManager {
  static getProfilePrefix() {
    // Controlla se c'è un profilo specifico nei parametri URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlProfile = urlParams.get('profile');
    
    if (urlProfile) {
      sessionStorage.setItem('currentProfileId', urlProfile);
      return `profile_${urlProfile}_`;
    }
    
    // Controlla se c'è un profilo nel sessionStorage
    const sessionProfile = sessionStorage.getItem('currentProfileId');
    if (sessionProfile && sessionProfile !== 'default') {
      return `profile_${sessionProfile}_`;
    }
    
    // Default: nessun prefisso (profilo principale)
    return '';
  }

  static getStorageKey(key) {
    const prefix = this.getProfilePrefix();
    return `${prefix}complicita_${key}`;
  }

  static getFromStorage(key) {
    try {
      const value = localStorage.getItem(this.getStorageKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  }

  static setToStorage(key, value) {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  }

  static removeFromStorage(key) {
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  }

  static clearAllData() {
    try {
      // Trova tutte le chiavi che iniziano con il prefisso del profilo corrente
      const prefix = this.getProfilePrefix();
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`${prefix}complicita_`)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      
      console.log(`🗑️ Cleared ${keys.length} storage items for profile:`, prefix || 'default');
      return true;
    } catch (error) {
      console.error('Error clearing profile data:', error);
      return false;
    }
  }

  static getAllProfiles() {
    try {
      // Trova tutti i profili esistenti nel localStorage
      const allKeys = Object.keys(localStorage);
      const profileSet = new Set();
      
      allKeys.forEach(key => {
        if (key.includes('complicita_')) {
          if (key.startsWith('profile_')) {
            // Estrai l'ID del profilo
            const match = key.match(/^profile_([^_]+)_/);
            if (match) {
              profileSet.add(match[1]);
            }
          } else if (key.startsWith('complicita_')) {
            // Profilo default
            profileSet.add('default');
          }
        }
      });

      return Array.from(profileSet).map(profileId => ({
        id: profileId,
        name: profileId === 'default' ? 'Profilo Principale' : `Profilo ${profileId}`,
        isDefault: profileId === 'default',
        hasData: this.hasProfileData(profileId)
      }));
    } catch (error) {
      console.error('Error getting all profiles:', error);
      return [];
    }
  }

  static hasProfileData(profileId) {
    try {
      const prefix = profileId === 'default' ? '' : `profile_${profileId}_`;
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`${prefix}complicita_`)
      );
      return keys.length > 0;
    } catch (error) {
      return false;
    }
  }

  static switchProfile(profileId) {
    if (profileId === 'default') {
      sessionStorage.removeItem('currentProfileId');
    } else {
      sessionStorage.setItem('currentProfileId', profileId);
    }
    
    console.log('🔄 Switched to profile:', profileId);
    
    // Reloads the page to apply the new profile
    window.location.reload();
  }

  static getCurrentProfileInfo() {
    const profileId = sessionStorage.getItem('currentProfileId') || 'default';
    const prefix = this.getProfilePrefix();
    
    return {
      id: profileId,
      name: profileId === 'default' ? 'Profilo Principale' : `Profilo ${profileId}`,
      prefix: prefix,
      storageKey: this.getStorageKey.bind(this),
      hasData: this.hasProfileData(profileId)
    };
  }

  static createNewProfile(name) {
    const profileId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Salva le informazioni del profilo
    const profiles = this.getFromStorage('profiles') || {};
    profiles[profileId] = {
      id: profileId,
      name: name,
      createdAt: new Date().toISOString()
    };
    
    this.setToStorage('profiles', profiles);
    
    return {
      id: profileId,
      name: name,
      createdAt: new Date().toISOString()
    };
  }

  static exportProfileData() {
    try {
      const prefix = this.getProfilePrefix();
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`${prefix}complicita_`)
      );
      
      const data = {};
      keys.forEach(key => {
        const shortKey = key.replace(`${prefix}complicita_`, '');
        data[shortKey] = JSON.parse(localStorage.getItem(key));
      });
      
      return {
        profileId: sessionStorage.getItem('currentProfileId') || 'default',
        timestamp: new Date().toISOString(),
        data: data
      };
    } catch (error) {
      console.error('Error exporting profile data:', error);
      return null;
    }
  }

  static importProfileData(exportedData) {
    try {
      const { data } = exportedData;
      
      Object.keys(data).forEach(key => {
        this.setToStorage(key, data[key]);
      });
      
      return true;
    } catch (error) {
      console.error('Error importing profile data:', error);
      return false;
    }
  }
}
