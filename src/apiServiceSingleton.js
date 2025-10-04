import EventDrivenApiService from './EventDrivenApiService';
import { API_BASE } from './apiConfig';

// Singleton instance holder
let instance = null;

export function getApiService() {
  if (!instance) {
    instance = new EventDrivenApiService(API_BASE);
    if (typeof window !== 'undefined') {
      // Expose only in E2E / debug builds
      if (import.meta.env && import.meta.env.VITE_E2E) {
        window.__apiService = instance;
      }
    }
  }
  return instance;
}

export default getApiService;