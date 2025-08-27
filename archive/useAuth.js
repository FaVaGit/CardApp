import { useState, useEffect } from 'react';

// Hook per la gestione dell'autenticazione e dello storage locale
export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carica l'utente dal localStorage all'avvio
    const savedUser = localStorage.getItem('complicita_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    const userWithId = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    setUser(userWithId);
    localStorage.setItem('complicita_user', JSON.stringify(userWithId));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('complicita_user');
    localStorage.removeItem('complicita_history');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates, lastLogin: new Date().toISOString() };
    setUser(updatedUser);
    localStorage.setItem('complicita_user', JSON.stringify(updatedUser));
  };

  return { user, login, logout, updateUser, isLoading };
}

// Hook per la gestione della history delle carte
export function useHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('complicita_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const addToHistory = (card) => {
    const historyEntry = {
      ...card,
      playedAt: new Date().toISOString(),
      id: `${card.id}_${Date.now()}`
    };
    
    const newHistory = [historyEntry, ...history].slice(0, 50); // Mantieni solo le ultime 50 carte
    setHistory(newHistory);
    localStorage.setItem('complicita_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('complicita_history');
  };

  const getStats = () => {
    const totalCards = history.length;
    const uniqueCards = new Set(history.map(h => h.originalId || h.id)).size;
    const favoriteCategories = history.reduce((acc, card) => {
      const category = card.title.split(' ')[0]; // Prima parola del titolo
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalCards,
      uniqueCards,
      favoriteCategories: Object.entries(favoriteCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    };
  };

  return { history, addToHistory, clearHistory, getStats };
}
