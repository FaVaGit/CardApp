import { useState, useEffect } from 'react';

// Hook per gestire l'esperienza dual-device dei partner
export function useDualDevice() {
  const [currentPartner, setCurrentPartner] = useState(null);
  const [partnerConnection, setPartnerConnection] = useState(null);
  const [coupleSession, setCoupleSession] = useState(null);
  const [sharedCanvas, setSharedCanvas] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPartnerData();
    // Simula sincronizzazione real-time ogni 2 secondi
    const syncInterval = setInterval(() => {
      syncWithPartner();
    }, 2000);

    return () => clearInterval(syncInterval);
  }, []);

  const loadPartnerData = () => {
    const savedPartner = localStorage.getItem('complicita_current_partner');
    const savedSession = localStorage.getItem('complicita_couple_session');
    
    if (savedPartner) {
      setCurrentPartner(JSON.parse(savedPartner));
    }
    
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setCoupleSession(session);
      setSharedCanvas(session.sharedCanvas || []);
      setSharedNotes(session.sharedNotes || []);
    }
    
    setIsLoading(false);
  };

  const authenticatePartner = (partnerData) => {
    const partnerId = generateUniqueId();
    const partner = {
      id: partnerId,
      name: partnerData.name,
      role: partnerData.role, // 'partner1' o 'partner2'
      coupleId: partnerData.coupleId,
      coupleName: partnerData.coupleName,
      partnerName: partnerData.partnerName, // Nome dell'altro partner
      deviceId: generateDeviceId(),
      lastActive: new Date().toISOString(),
      preferences: {
        favoriteCategories: [],
        drawingColor: '#8b5cf6',
        notificationSound: true
      }
    };

    setCurrentPartner(partner);
    localStorage.setItem('complicita_current_partner', JSON.stringify(partner));
    
    // Crea o unisciti alla sessione di coppia
    createOrJoinCoupleSession(partner);
    
    return partner;
  };

  const createOrJoinCoupleSession = (partner) => {
    // Cerca se esiste già una sessione per questa coppia
    const existingSession = localStorage.getItem(`complicita_couple_${partner.coupleId}`);
    
    if (existingSession) {
      const session = JSON.parse(existingSession);
      // Aggiunge questo partner alla sessione esistente
      if (!session.connectedPartners.find(p => p.id === partner.id)) {
        session.connectedPartners.push({
          id: partner.id,
          name: partner.name,
          role: partner.role,
          deviceId: partner.deviceId,
          lastSeen: new Date().toISOString()
        });
        session.lastActivity = new Date().toISOString();
      }
      
      setCoupleSession(session);
      setSharedCanvas(session.sharedCanvas || []);
      setSharedNotes(session.sharedNotes || []);
      localStorage.setItem('complicita_couple_session', JSON.stringify(session));
      localStorage.setItem(`complicita_couple_${partner.coupleId}`, JSON.stringify(session));
    } else {
      // Crea nuova sessione di coppia
      const newSession = {
        id: generateUniqueId(),
        coupleId: partner.coupleId,
        coupleName: partner.coupleName,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        connectedPartners: [{
          id: partner.id,
          name: partner.name,
          role: partner.role,
          deviceId: partner.deviceId,
          lastSeen: new Date().toISOString()
        }],
        currentCard: null,
        sharedCanvas: [],
        sharedNotes: [],
        gameHistory: [],
        settings: {
          allowDrawing: true,
          allowNotes: true,
          autoSync: true,
          notificationMode: 'gentle'
        }
      };
      
      setCoupleSession(newSession);
      localStorage.setItem('complicita_couple_session', JSON.stringify(newSession));
      localStorage.setItem(`complicita_couple_${partner.coupleId}`, JSON.stringify(newSession));
    }
  };

  const syncWithPartner = () => {
    if (coupleSession) {
      // Simula sincronizzazione con l'altro dispositivo
      const savedSession = localStorage.getItem(`complicita_couple_${coupleSession.coupleId}`);
      if (savedSession) {
        const session = JSON.parse(savedSession);
        
        // Aggiorna timestamp di presenza
        if (currentPartner) {
          const partnerIndex = session.connectedPartners.findIndex(p => p.id === currentPartner.id);
          if (partnerIndex !== -1) {
            session.connectedPartners[partnerIndex].lastSeen = new Date().toISOString();
            localStorage.setItem(`complicita_couple_${coupleSession.coupleId}`, JSON.stringify(session));
          }
        }
        
        // Aggiorna stato locale se ci sono cambiamenti
        if (JSON.stringify(session.sharedCanvas) !== JSON.stringify(sharedCanvas)) {
          setSharedCanvas(session.sharedCanvas || []);
        }
        if (JSON.stringify(session.sharedNotes) !== JSON.stringify(sharedNotes)) {
          setSharedNotes(session.sharedNotes || []);
        }
        if (session.currentCard !== coupleSession.currentCard) {
          setCoupleSession(session);
        }
      }
    }
  };

  const drawCard = (card) => {
    if (coupleSession) {
      const updatedSession = {
        ...coupleSession,
        currentCard: {
          ...card,
          drawnBy: currentPartner.id,
          drawnByName: currentPartner.name,
          drawnAt: new Date().toISOString()
        },
        lastActivity: new Date().toISOString(),
        gameHistory: [...(coupleSession.gameHistory || []), card]
      };
      
      setCoupleSession(updatedSession);
      localStorage.setItem('complicita_couple_session', JSON.stringify(updatedSession));
      localStorage.setItem(`complicita_couple_${coupleSession.coupleId}`, JSON.stringify(updatedSession));
    }
  };

  const addCanvasStroke = (stroke) => {
    if (coupleSession) {
      const newStroke = {
        ...stroke,
        id: generateUniqueId(),
        authorId: currentPartner.id,
        authorName: currentPartner.name,
        timestamp: new Date().toISOString()
      };
      
      const updatedCanvas = [...sharedCanvas, newStroke];
      const updatedSession = {
        ...coupleSession,
        sharedCanvas: updatedCanvas,
        lastActivity: new Date().toISOString()
      };
      
      setSharedCanvas(updatedCanvas);
      setCoupleSession(updatedSession);
      localStorage.setItem('complicita_couple_session', JSON.stringify(updatedSession));
      localStorage.setItem(`complicita_couple_${coupleSession.coupleId}`, JSON.stringify(updatedSession));
    }
  };

  const addNote = (noteContent) => {
    if (coupleSession) {
      const newNote = {
        id: generateUniqueId(),
        content: noteContent,
        authorId: currentPartner.id,
        authorName: currentPartner.name,
        timestamp: new Date().toISOString(),
        color: currentPartner.preferences.drawingColor,
        isPrivate: false
      };
      
      const updatedNotes = [...sharedNotes, newNote];
      const updatedSession = {
        ...coupleSession,
        sharedNotes: updatedNotes,
        lastActivity: new Date().toISOString()
      };
      
      setSharedNotes(updatedNotes);
      setCoupleSession(updatedSession);
      localStorage.setItem('complicita_couple_session', JSON.stringify(updatedSession));
      localStorage.setItem(`complicita_couple_${coupleSession.coupleId}`, JSON.stringify(updatedSession));
    }
  };

  const clearCanvas = () => {
    if (coupleSession) {
      const updatedSession = {
        ...coupleSession,
        sharedCanvas: [],
        lastActivity: new Date().toISOString()
      };
      
      setSharedCanvas([]);
      setCoupleSession(updatedSession);
      localStorage.setItem('complicita_couple_session', JSON.stringify(updatedSession));
      localStorage.setItem(`complicita_couple_${coupleSession.coupleId}`, JSON.stringify(updatedSession));
    }
  };

  const logoutPartner = () => {
    if (coupleSession && currentPartner) {
      // Rimuovi partner dalla sessione
      const updatedSession = {
        ...coupleSession,
        connectedPartners: coupleSession.connectedPartners.filter(p => p.id !== currentPartner.id),
        lastActivity: new Date().toISOString()
      };
      
      localStorage.setItem(`complicita_couple_${coupleSession.coupleId}`, JSON.stringify(updatedSession));
    }
    
    setCurrentPartner(null);
    setPartnerConnection(null);
    setCoupleSession(null);
    setSharedCanvas([]);
    setSharedNotes([]);
    localStorage.removeItem('complicita_current_partner');
    localStorage.removeItem('complicita_couple_session');
  };

  const getConnectedPartner = () => {
    if (coupleSession && currentPartner) {
      return coupleSession.connectedPartners.find(p => 
        p.id !== currentPartner.id && 
        isPartnerOnline(p.lastSeen)
      );
    }
    return null;
  };

  const isPartnerOnline = (lastSeen) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return new Date(lastSeen).getTime() > fiveMinutesAgo;
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  };

  return {
    currentPartner,
    partnerConnection: getConnectedPartner(),
    coupleSession,
    sharedCanvas,
    sharedNotes,
    isLoading,
    authenticatePartner,
    drawCard,
    addCanvasStroke,
    addNote,
    clearCanvas,
    logoutPartner,
    syncWithPartner
  };
}
