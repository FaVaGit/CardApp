import { useState, useEffect, useCallback } from 'react';

// Utility per rilevare modalità incognito
const isIncognitoMode = () => {
  try {
    // Test per Safari
    if ('webkitRequestFileSystem' in window) {
      return new Promise((resolve) => {
        window.webkitRequestFileSystem(0, 0, () => resolve(false), () => resolve(true));
      });
    }
    
    // Test per Firefox
    if ('MozAppearance' in document.documentElement.style) {
      const db = indexedDB.open('test');
      return new Promise((resolve) => {
        db.onerror = () => resolve(true);
        db.onsuccess = () => {
          indexedDB.deleteDatabase('test');
          resolve(false);
        };
      });
    }
    
    // Test per Chrome/Edge
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => {
        return estimate.quota < 120000000; // Quota ridotta in incognito
      });
    }
    
    // Fallback
    return Promise.resolve(false);
  } catch {
    return Promise.resolve(false);
  }
};

// Utility per generare un ID finestra unico
const getWindowId = () => {
  let windowId = sessionStorage.getItem('windowId');
  if (!windowId) {
    windowId = 'win_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    sessionStorage.setItem('windowId', windowId);
  }
  return windowId;
};

// Hook semplificato per gestione utenti individuali e coppie
export function useSimplifiedMultiUser(currentUser, setCurrentUser) {
  // currentUser e setCurrentUser sono ora gestiti da App.jsx
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentCouple, setCurrentCouple] = useState(null);
  const [allCouples, setAllCouples] = useState([]);
  const [gameSession, setGameSession] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]); // Nuovi inviti
  const [sentInvites, setSentInvites] = useState([]); // Inviti inviati
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({
    isIncognito: false,
    windowId: '',
    profilePrefix: '',
    storageIsolation: 'normal',
    canSeeOtherIncognitoWindows: false
  });

  // Rimuoviamo l'inizializzazione automatica da qui
  // useEffect(() => { ... });

  // Inizializzazione manuale (chiamata da App.jsx)
  const initialize = useCallback(() => {
    console.log('🚀 Inizializzazione del backend localStorage richiesta...');
    setIsLoading(true);
    
    // Rileva modalità incognito
    isIncognitoMode().then(isIncognito => {
      const windowId = getWindowId();
      const profilePrefix = getProfilePrefix();
      
      setDebugInfo({
        isIncognito,
        windowId,
        profilePrefix,
        storageIsolation: isIncognito ? 'isolated' : 'shared',
        canSeeOtherIncognitoWindows: false // Da implementare
      });

      // Carica dati iniziali da localStorage
      const users = getFromStorage('users') || [];
      const couples = getFromStorage('couples') || [];
      const invites = getFromStorage('invites') || [];
      
      setAllUsers(users);
      setAllCouples(couples);
      setPendingInvites(invites);

      // Ripristina utente corrente dalla sessione
      const currentUserId = sessionStorage.getItem(getStorageKey('currentUserId'));
      if (currentUserId) {
        const user = users.find(u => u.id === currentUserId);
        if (user) {
          setCurrentUser(user);
          console.log(`Utente ripristinato dalla sessione: ${user.name}`);
        }
      }
      
      setIsLoading(false);
      console.log('✅ Backend localStorage inizializzato.');
    });
  }, [setCurrentUser]); // Aggiunta dipendenza

  // Gestione eventi di storage per sincronizzazione tra tab
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key?.includes('complicita_')) {
        console.log('🔄 Storage change detected:', event.key);
        
        // Gestione speciale per aggiornamenti di sessione
        if (event.key.includes('session_update')) {
          try {
            const updateData = JSON.parse(event.newValue || '{}');
            console.log('🎮 Session update received:', updateData);
            
            // Se è una nuova sessione per la nostra coppia e non l'abbiamo creata noi
            if (updateData.type === 'session_created' && 
                currentCouple && 
                updateData.coupleId === currentCouple.id && 
                updateData.createdBy !== currentUser?.id) {
              
              console.log('🔗 Partner started a game session, joining automatically...');
              
              // Carica la sessione creata dal partner
              const sessionData = getFromStorage('game_session');
              if (sessionData) {
                setGameSession(sessionData);
                console.log('✅ Joined partner\'s game session');
              }
            }
          } catch (error) {
            console.error('❌ Error processing session update:', error);
          }
        }
        
        setTimeout(() => {
          refreshOnlineUsersFromSession();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Inizializza informazioni di debug
  const initializeDebugInfo = async () => {
    try {
      const isIncognito = await isIncognitoMode();
      const windowId = getWindowId();
      const profilePrefix = getProfilePrefix();
      
      // Test per verificare se possiamo vedere altri utenti in localStorage
      const testCanSeeOthers = () => {
        // Se siamo in modalità incognito, non possiamo vedere utenti di altre finestre incognito
        // Ma possiamo vedere utenti dello stesso browser normale se non usiamo profili
        const allUsersInStorage = getFromStorage('all_users') || [];
        const hasUsersFromOtherWindows = allUsersInStorage.some(user => 
          user.windowId && user.windowId !== windowId
        );
        
        return {
          canSeeOtherIncognitoWindows: !isIncognito, // Solo se non siamo in incognito
          hasUsersFromOtherWindows,
          totalUsersInStorage: allUsersInStorage.length
        };
      };
      
      const syncTest = testCanSeeOthers();
      
      setDebugInfo({
        isIncognito,
        windowId,
        profilePrefix,
        storageIsolation: isIncognito ? 'incognito-isolated' : 'normal',
        canSeeOtherIncognitoWindows: syncTest.canSeeOtherIncognitoWindows,
        hasUsersFromOtherWindows: syncTest.hasUsersFromOtherWindows,
        totalUsersInStorage: syncTest.totalUsersInStorage
      });
      
      console.log('🐛 Debug Info initialized:', {
        isIncognito,
        windowId,
        profilePrefix,
        storageIsolation: isIncognito ? 'incognito-isolated' : 'normal',
        canSeeOtherIncognitoWindows: syncTest.canSeeOtherIncognitoWindows
      });
      
    } catch (error) {
      console.error('❌ Error initializing debug info:', error);
    }
  };

  const loadData = () => {
    const savedCurrentUser = getFromStorage('current_user');
    const savedAllUsers = getFromStorage('all_users');
    const savedCurrentCouple = getFromStorage('current_couple');
    const savedAllCouples = getFromStorage('all_couples');
    const savedGameSession = getFromStorage('game_session');
    const savedPendingInvites = getFromStorage('pending_invites');
    const savedSentInvites = getFromStorage('sent_invites');
    
    if (savedCurrentUser) {
      setCurrentUser(savedCurrentUser);
    }
    
    if (savedAllUsers) {
      const users = savedAllUsers;
      setAllUsers(users);
      updateOnlineUsersList(users);
    }

    if (savedCurrentCouple) {
      setCurrentCouple(savedCurrentCouple);
    }

    if (savedAllCouples) {
      setAllCouples(savedAllCouples);
    }

    if (savedGameSession) {
      setGameSession(savedGameSession);
    }

    if (savedPendingInvites) {
      setPendingInvites(savedPendingInvites);
    }

    if (savedSentInvites) {
      setSentInvites(savedSentInvites);
    }
    
    setIsLoading(false);
  };

  // Registrazione/Login utente individuale
  const registerUser = (userData) => {
    if (!userData || !userData.name) {
      console.error('Dati utente non validi per la registrazione');
      return null;
    }

    console.log('Registrazione utente:', userData.name);

    const newUser = {
      id: generateUniqueId(),
      name: userData.name.trim(),
      nickname: userData.nickname?.trim() || null,
      gameType: userData.gameType,
      personalCode: generateJoinCode(),
      coupleCode: null,
      availableForPairing: true,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      stats: {
        cardsPlayed: 0,
        sessionsPlayed: 0,
        totalTimeSpent: 0
      }
    };

    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    saveToStorage('users', updatedUsers);
    
    // Aggiorna lo stato in App.jsx
    setCurrentUser(newUser);
    
    // Salva l'ID utente corrente nel sessionStorage per ripristino
    sessionStorage.setItem(getStorageKey('currentUserId'), newUser.id);
    
    console.log('Utente registrato:', newUser);
    return newUser;
  };

  const loginUser = (userData) => {
    console.log('🔄 Logging in user:', userData);
    
    const foundUser = allUsers.find(user => 
      user.name.toLowerCase() === userData.name.toLowerCase() ||
      (user.nickname && user.nickname.toLowerCase() === userData.name.toLowerCase())
    );

    if (foundUser) {
      // Aggiorna lo stato in App.jsx
      setCurrentUser(foundUser);
      
      // Salva l'ID utente corrente nel sessionStorage
      sessionStorage.setItem(getStorageKey('currentUserId'), foundUser.id);
      
      // Aggiorna la presenza
      updateUserPresence(foundUser.id);
      
      console.log('✅ User logged in:', foundUser);
      return { user: foundUser, couple: null };
    }
    
    console.log('❌ User not found');
    return null;
  };

  // Join su un utente specifico tramite il suo codice personale
  const joinUserByCode = (userCode) => {
    if (!currentUser) return null;
    
    console.log('🤝 Trying to join user with code:', userCode);
    console.log('📊 Current allUsers:', allUsers.map(u => ({ name: u.name, code: u.personalCode, available: u.availableForPairing, online: u.isOnline })));
    
    // Cerca l'utente con quel codice personale
    const targetUser = allUsers.find(user => 
      user.personalCode?.toLowerCase() === userCode.toLowerCase() && 
      user.id !== currentUser.id &&
      user.gameType === currentUser.gameType &&
      user.availableForPairing
    );

    if (!targetUser) {
      console.log('❌ User not found with code:', userCode);
      console.log('🔍 Available codes:', allUsers.filter(u => u.id !== currentUser.id).map(u => ({ name: u.name, code: u.personalCode, gameType: u.gameType, available: u.availableForPairing })));
      return null;
    }

    console.log('✅ Found target user:', { name: targetUser.name, code: targetUser.personalCode });

    // Verifica se l'utente target è già in una coppia attiva
    const existingCouple = allCouples.find(couple => 
      couple.isActive && 
      couple.members.some(m => m.userId === targetUser.id)
    );

    if (existingCouple) {
      console.log('❌ Target user already in a couple');
      return null;
    }

    // Verifica se l'utente corrente è già in una coppia attiva
    const myExistingCouple = allCouples.find(couple => 
      couple.isActive && 
      couple.members.some(m => m.userId === currentUser.id)
    );

    if (myExistingCouple) {
      console.log('❌ Current user already in a couple');
      return null;
    }

    // Crea nuova coppia automaticamente
    const newCouple = {
      id: generateUniqueId(),
      name: `${currentUser.name} & ${targetUser.name}`,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          role: 'creator',
          joinedAt: new Date().toISOString(),
          isOnline: true,
          deviceId: currentUser.deviceId
        },
        {
          userId: targetUser.id,
          name: targetUser.name,
          role: 'member', 
          joinedAt: new Date().toISOString(),
          isOnline: targetUser.isOnline || false,
          deviceId: targetUser.deviceId
        }
      ],
      gameType: currentUser.gameType,
      isActive: true,
      joinCode: generateJoinCode() // Codice della coppia per eventuali usi futuri
    };

    const allCouplesList = [...allCouples, newCouple];
    setAllCouples(allCouplesList);
    setCurrentCouple(newCouple);
    
    // Aggiorniamo entrambi gli utenti come non disponibili per altre pairings e ONLINE
    const updatedUsers = allUsers.map(user => {
      if (user.id === currentUser.id) {
        return { 
          ...user, 
          availableForPairing: false,
          isOnline: true,
          lastSeen: new Date().toISOString()
        };
      }
      if (user.id === targetUser.id) {
        return { 
          ...user, 
          availableForPairing: false,
          isOnline: true, // Forziamo online al momento della join
          lastSeen: new Date().toISOString()
        };
      }
      return user;
    });
    setAllUsers(updatedUsers);
    
    // Aggiorniamo anche la coppia con entrambi i membri online
    const updatedCouple = {
      ...newCouple,
      members: newCouple.members.map(member => ({
        ...member,
        isOnline: true,
        lastSeen: new Date().toISOString()
      }))
    };
    setCurrentCouple(updatedCouple);
    
    // Salviamo nei vari storage
    setToStorage('current_couple', updatedCouple);
    setToStorage('all_couples', allCouplesList);
    setToStorage('all_users', updatedUsers);
    
    console.log('✅ Successfully joined user and created couple:', updatedCouple);
    
    // Forza immediatamente l'aggiornamento dello stato partner
    setTimeout(() => {
      checkPartnerStatus();
      updateOnlineStatus();
    }, 100);
    
    return updatedCouple;
  };

  // Lascia la coppia corrente
  const leaveCouple = () => {
    if (!currentCouple || !currentUser) return;
    
    // Marca l'utente come disponibile per nuove pairings
    const updatedUsers = allUsers.map(user => {
      if (user.id === currentUser.id) {
        return { ...user, availableForPairing: true };
      }
      return user;
    });
    setAllUsers(updatedUsers);
    
    // Rimuovi l'utente dalla coppia o disattiva la coppia
    const updatedCouple = {
      ...currentCouple,
      isActive: false,
      leftAt: new Date().toISOString()
    };
    
    updateCoupleInGlobalList(updatedCouple);
    setCurrentCouple(null);
    
    removeFromStorage('current_couple');
    setToStorage('all_users', updatedUsers);
    
    console.log('✅ Left couple');
  };

  // Crea sessione di gioco con sincronizzazione cross-tab
  const createGameSession = (sessionType = 'couple') => {
    if (!currentCouple) return null;
    
    const sessionId = generateUniqueId();
    const newSession = {
      id: sessionId,
      coupleId: currentCouple.id,
      sessionType,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      currentCard: null,
      isActive: true,
      messages: [],
      sharedHistory: [],
      canvas: {
        strokes: [],
        notes: [],
        lastUpdate: new Date().toISOString()
      },
      // Aggiungiamo info sui partecipanti
      participants: {
        [currentUser.id]: {
          userId: currentUser.id,
          name: currentUser.name,
          joinedAt: new Date().toISOString(),
          isActive: true
        }
      }
    };
    
    setGameSession(newSession);
    setToStorage('game_session', newSession);
    
    // Notifica agli altri membri della coppia che la sessione è iniziata
    setToStorage('session_update', {
      type: 'session_created',
      sessionId: sessionId,
      coupleId: currentCouple.id,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      timestamp: new Date().toISOString()
    });
    
    console.log('🎮 Game session created and notified:', newSession);
    return newSession;
  };

  // Invia invito a un partner
  const sendPartnerInvite = (targetUser) => {
    if (!currentUser || targetUser.id === currentUser.id) return false;
    
    console.log('💌 Sending invite to:', targetUser.name);
    
    const invite = {
      id: generateUniqueId(),
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId: targetUser.id,
      toUserName: targetUser.name,
      gameType: currentUser.gameType,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Aggiungi agli inviti inviati dell'utente corrente
    const newSentInvites = [...sentInvites, invite];
    setSentInvites(newSentInvites);
    setToStorage('sent_invites', newSentInvites);

    // Simula l'invio dell'invito all'altro utente (in un'app reale sarebbe via websocket)
    // Per ora aggiungiamo direttamente agli inviti pending globali
    const allPendingInvites = getFromStorage('all_pending_invites') || [];
    allPendingInvites.push(invite);
    setToStorage('all_pending_invites', allPendingInvites);
    
    console.log('✅ Invite sent:', invite);
    return true;
  };

  // Controlla inviti ricevuti
  const checkPendingInvites = () => {
    if (!currentUser) return;
    
    const allPendingInvites = getFromStorage('all_pending_invites') || [];
    const myInvites = allPendingInvites.filter(invite => 
      invite.toUserId === currentUser.id && invite.status === 'pending'
    );
    
    setPendingInvites(myInvites);
  };

  // Accetta invito
  const acceptInvite = (invite) => {
    console.log('✅ Accepting invite:', invite);
    
    // Crea coppia automaticamente
    const coupleName = `${invite.fromUserName} & ${currentUser.name}`;
    const newCouple = {
      id: generateUniqueId(),
      name: coupleName,
      createdBy: invite.fromUserId,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: invite.fromUserId,
          name: invite.fromUserName,
          role: 'creator',
          joinedAt: invite.createdAt,
          isOnline: true,
          deviceId: generateDeviceId()
        },
        {
          userId: currentUser.id,
          name: currentUser.name,
          role: 'member',
          joinedAt: new Date().toISOString(),
          isOnline: true,
          deviceId: currentUser.deviceId
        }
      ],
      gameType: invite.gameType,
      isActive: true
    };

    // Salva coppia
    const allCouplesList = [...allCouples, newCouple];
    setAllCouples(allCouplesList);
    setCurrentCouple(newCouple);
    setToStorage('current_couple', newCouple);
    setToStorage('all_couples', allCouplesList);

    // Marca invito come accettato
    const allPendingInvites = getFromStorage('all_pending_invites') || [];
    const updatedInvites = allPendingInvites.map(inv => 
      inv.id === invite.id ? { ...inv, status: 'accepted' } : inv
    );
    setToStorage('all_pending_invites', updatedInvites);

    // Rimuovi dall'elenco pending locale
    setPendingInvites(prev => prev.filter(inv => inv.id !== invite.id));

    console.log('✅ Couple created from invite:', newCouple);
    return newCouple;
  };

  // Rifiuta invito
  const rejectInvite = (invite) => {
    console.log('❌ Rejecting invite:', invite);
    
    // Marca invito come rifiutato
    const allPendingInvites = getFromStorage('all_pending_invites') || [];
    const updatedInvites = allPendingInvites.map(inv => 
      inv.id === invite.id ? { ...inv, status: 'rejected' } : inv
    );
    setToStorage('all_pending_invites', updatedInvites);

    // Rimuovi dall'elenco pending locale
    setPendingInvites(prev => prev.filter(inv => inv.id !== invite.id));
  };

  // Aggiorna stato online utente
  // Aggiorna lo stato online dei membri della coppia leggendo da localStorage con polling più aggressivo
  const refreshOnlineUsersFromSession = () => {
    try {
      // Ricarica tutti gli utenti da storage
      const users = getFromStorage('all_users');
      if (users) {
        console.log('🔄 Refreshing users from storage:', users.length, 'users');
        
        // Aggiorna solo se la lista è diversa
        if (JSON.stringify(allUsers) !== JSON.stringify(users)) {
          setAllUsers(users);
          updateOnlineUsersList(users);
        }
      }

      // Ricarica le coppie se necessario
      if (currentCouple) {
        const couples = getFromStorage('all_couples');
        if (couples) {
          const foundCouple = couples.find(c => c.id === currentCouple.id);
          
          if (foundCouple && foundCouple.members) {
            // Aggiorna solo se ci sono cambiamenti significativi
            const currentMembers = JSON.stringify(currentCouple.members.map(m => ({ userId: m.userId, isOnline: m.isOnline, lastSeen: m.lastSeen })));
            const localMembers = JSON.stringify(foundCouple.members.map(m => ({ userId: m.userId, isOnline: m.isOnline, lastSeen: m.lastSeen })));
            
            if (currentMembers !== localMembers) {
              console.log('🔄 Refreshing couple status from storage');
              setCurrentCouple(foundCouple);
              setAllCouples(couples);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing from storage:', error);
    }
  };

  const updateOnlineStatus = () => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        lastSeen: new Date().toISOString(),
        isOnline: true
      };
      
      setCurrentUser(updatedUser);
      updateUserInGlobalList(updatedUser);
      setToStorage('current_user', updatedUser);
    }

    if (currentCouple) {
      // Ricarica prima la coppia dal storage per vedere eventuali aggiornamenti del partner
      const couples = getFromStorage('all_couples');
      let freshCouple = currentCouple;
      
      if (couples) {
        const foundCouple = couples.find(c => c.id === currentCouple.id);
        if (foundCouple) {
          freshCouple = foundCouple;
        }
      }
      
      const updatedCouple = {
        ...freshCouple,
        members: freshCouple.members.map(m => 
          m.userId === currentUser.id 
            ? { ...m, isOnline: true, lastSeen: new Date().toISOString() }
            : m // Mantieni lo stato dell'altro membro come da storage
        )
      };
      
      setCurrentCouple(updatedCouple);
      updateCoupleInGlobalList(updatedCouple);
      // Aggiorniamo storage per condivisione
      setToStorage('current_couple', updatedCouple);
      
      console.log('💓 Updated couple status:', {
        coupleId: updatedCouple.id,
        members: updatedCouple.members.map(m => ({
          name: m.name,
          isOnline: m.isOnline,
          lastSeen: m.lastSeen
        }))
      });
    }

    // Aggiorniamo anche la lista degli utenti online tra tab
    refreshOnlineUsersFromSession();
  };

  // Controlla stato partner con sincronizzazione cross-tab migliorata
  const checkPartnerStatus = () => {
    if (currentCouple && currentCouple.members.length > 1) {
      // Prima forza il refresh dei dati dal localStorage
      refreshOnlineUsersFromSession();
      
      // Ricarica la coppia aggiornata dal storage
      const couples = getFromStorage('all_couples');
      let freshCouple = currentCouple;
      
      if (couples) {
        const foundCouple = couples.find(c => c.id === currentCouple.id);
        if (foundCouple) {
          freshCouple = foundCouple;
        }
      }
      
      const partner = freshCouple.members.find(m => m.userId !== currentUser.id);
      const currentMember = freshCouple.members.find(m => m.userId === currentUser.id);
      
      // Controllo più permissivo: 30 secondi invece di 10
      const thirtySecondsAgo = Date.now() - 30 * 1000;
      const partnerOnline = partner && partner.lastSeen && new Date(partner.lastSeen).getTime() > thirtySecondsAgo;
      const currentOnline = currentMember && currentMember.lastSeen && new Date(currentMember.lastSeen).getTime() > thirtySecondsAgo;
      
      const newPartnerStatus = {
        currentUser: {
          ...currentMember,
          isOnline: currentOnline
        },
        partner: {
          ...partner,
          isOnline: partnerOnline
        },
        bothOnline: currentOnline && partnerOnline
      };
      
      console.log('🔍 Partner status check:', {
        partnerId: partner?.userId,
        partnerName: partner?.name,
        partnerLastSeen: partner?.lastSeen,
        partnerOnline: partnerOnline,
        currentUserId: currentUser?.id,
        currentOnline: currentOnline,
        bothOnline: newPartnerStatus.bothOnline,
        thirtySecondsAgo: new Date(thirtySecondsAgo).toISOString(),
        now: new Date().toISOString()
      });
      
      setPartnerStatus(newPartnerStatus);
    } else {
      setPartnerStatus(null);
    }
  };

  // Controlla se c'è una sessione di gioco attiva per la nostra coppia
  const checkForActiveGameSession = () => {
    if (!currentCouple || !currentUser) return;
    
    // Se abbiamo già una sessione attiva, non fare nulla
    if (gameSession) return;
    
    try {
      const sessionData = getFromStorage('game_session');
      if (sessionData) {
        // Se la sessione appartiene alla nostra coppia ma non l'abbiamo in memoria
        if (sessionData.coupleId === currentCouple.id && sessionData.isActive) {
          console.log('🔗 Found active game session for our couple, joining...');
          setGameSession(sessionData);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for active game session:', error);
    }
  };

  // Logout
  const logout = () => {
    if (currentUser) {
      // Non rimuovere l'utente, ma aggiorna solo lo stato
      console.log(`Logout per ${currentUser.name}`);
    }
    
    setCurrentUser(null);
    setCurrentCouple(null);
    setGameSession(null);
    setPartnerStatus(null);
    
    // Rimuovi l'ID utente dal sessionStorage
    sessionStorage.removeItem(getStorageKey('currentUserId'));
    
    console.log('Logout effettuato');
  };

  // Funzioni di utilità
  const updateUserInGlobalList = (updatedUser) => {
    const updatedAllUsers = allUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    setAllUsers(updatedAllUsers);
    setToStorage('all_users', updatedAllUsers);
  };

  const updateCoupleInGlobalList = (updatedCouple) => {
    const updatedAllCouples = allCouples.map(couple => 
      couple.id === updatedCouple.id ? updatedCouple : couple
    );
    setAllCouples(updatedAllCouples);
    setToStorage('all_couples', updatedAllCouples);
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const generateDeviceId = () => {
    const storageKey = getStorageKey('device_id');
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
      deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
  };

  const generateJoinCode = () => {
    // Genera un codice a 6 caratteri facile da ricordare usando pattern:
    // 3 lettere + 3 numeri (es. ABC123)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let code = '';
    
    // 3 lettere
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // 3 numeri
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
  };

  const sendMessage = (message) => {
    if (gameSession) {
      const newMessage = {
        id: generateUniqueId(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        message,
        timestamp: new Date().toISOString()
      };
      
      const updatedSession = {
        ...gameSession,
        messages: [...gameSession.messages, newMessage]
      };
      
      setGameSession(updatedSession);
      setToStorage('game_session', updatedSession);
    }
  };

  const shareCard = (card) => {
    if (gameSession) {
      const sharedCard = {
        ...card,
        sharedBy: currentUser.id,
        sharedByName: currentUser.name,
        sharedAt: new Date().toISOString()
      };
      
      const updatedSession = {
        ...gameSession,
        sharedHistory: [...gameSession.sharedHistory, sharedCard],
        currentCard: sharedCard
      };
      
      setGameSession(updatedSession);
      setToStorage('game_session', updatedSession);
    }
  };

  const updateOnlineUsersList = (users) => {
    const thirtySecondsAgo = Date.now() - 30 * 1000; // 30 secondi per considerare online
    const online = users.filter(user => 
      user.lastSeen && new Date(user.lastSeen).getTime() > thirtySecondsAgo
    );
    setOnlineUsers(online);
  };

  const updateOnlineUsers = () => {
    const thirtySecondsAgo = Date.now() - 30 * 1000;
    const onlineUsersList = allUsers.filter(user => 
      user.isOnline && 
      user.lastSeen && 
      new Date(user.lastSeen).getTime() > thirtySecondsAgo
    );
    
    console.log('🔄 Updating online users:', {
      totalUsers: allUsers.length,
      onlineUsers: onlineUsersList.length,
      currentUser: currentUser?.name,
      onlineUsersList: onlineUsersList.map(u => ({ name: u.name, lastSeen: u.lastSeen }))
    });
    
    setOnlineUsers(onlineUsersList);
  };

  // Metodi per settings e gestione dati
  const clearAllUsers = () => {
    console.log('🗑️ Clearing all users...');
    setAllUsers([]);
    setOnlineUsers([]);
    setCurrentUser(null);
    removeFromStorage('all_users');
    removeFromStorage('current_user');
    removeFromStorage('online_users');
    
    // Notifica altri tab
    notifyOtherTabs('users_cleared');
    
    return true;
  };

  const clearAllCouples = () => {
    console.log('💔 Clearing all couples...');
    
    // Reset coupleCode per tutti gli utenti
    const updatedUsers = allUsers.map(user => ({
      ...user,
      coupleCode: user.personalCode, // Reset al codice personale
      availableForPairing: true
    }));
    
    setAllUsers(updatedUsers);
    setAllCouples([]);
    setCurrentCouple(null);
    
    // Aggiorna anche current user se presente
    if (currentUser) {
      const updatedCurrentUser = {
        ...currentUser,
        coupleCode: currentUser.personalCode,
        availableForPairing: true
      };
      setCurrentUser(updatedCurrentUser);
      setToStorage('current_user', updatedCurrentUser);
    }
    
    setToStorage('all_users', updatedUsers);
    removeFromStorage('all_couples');
    removeFromStorage('current_couple');
    
    // Notifica altri tab
    notifyOtherTabs('couples_cleared');
    
    return true;
  };

  const clearAllData = () => {
    console.log('🔥 Complete data reset...');
    
    // Clear tutti gli stati
    setCurrentUser(null);
    setAllUsers([]);
    setOnlineUsers([]);
    setCurrentCouple(null);
    setAllCouples([]);
    setGameSession(null);
    setPartnerStatus(null);
    setPendingInvites([]);
    setSentInvites([]);
    
    // Clear localStorage con supporto profili
    const prefix = getProfilePrefix();
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith(`${prefix}complicita_`)
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Notifica altri tab
    notifyOtherTabs('complete_reset');
    
    return true;
  };

  const exportData = () => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      users: allUsers,
      couples: allCouples,
      currentUser: currentUser,
      currentCouple: currentCouple,
      gameSession: gameSession
    };
    
    console.log('📥 Exporting data:', exportData);
    return exportData;
  };

  const importData = (data) => {
    try {
      console.log('📤 Importing data:', data);
      
      if (data.users) {
        setAllUsers(data.users);
        setToStorage('all_users', data.users);
      }
      
      if (data.couples) {
        setAllCouples(data.couples);
        setToStorage('all_couples', data.couples);
      }
      
      if (data.currentUser) {
        setCurrentUser(data.currentUser);
        setToStorage('current_user', data.currentUser);
      }
      
      if (data.currentCouple) {
        setCurrentCouple(data.currentCouple);
        setToStorage('current_couple', data.currentCouple);
      }
      
      if (data.gameSession) {
        setGameSession(data.gameSession);
        setToStorage('game_session', data.gameSession);
      }
      
      // Refresh online users
      updateOnlineUsers();
      
      // Notifica altri tab
      notifyOtherTabs('data_imported');
      
      return true;
    } catch (error) {
      console.error('❌ Error importing data:', error);
      return false;
    }
  };

  const getStats = () => {
    const totalUsers = allUsers.length;
    const onlineUsersCount = onlineUsers.length;
    const totalCouples = allCouples.length;
    const activeSessions = gameSession ? 1 : 0;
    
    return {
      totalUsers,
      onlineUsers: onlineUsersCount,
      totalCouples,
      activeSessions,
      currentUser,
      lastUpdate: new Date().toISOString()
    };
  };

  const deleteUser = (userToDelete) => {
    if (!userToDelete || userToDelete.id === currentUser?.id) {
      console.log('❌ Cannot delete current user or invalid user');
      return false;
    }
    
    console.log('🗑️ Deleting user:', userToDelete.name);
    
    // Rimuovi l'utente dalla lista
    const updatedUsers = allUsers.filter(user => user.id !== userToDelete.id);
    setAllUsers(updatedUsers);
    setToStorage('all_users', updatedUsers);
    
    // Se l'utente era in una coppia, pulisci il partner
    if (userToDelete.coupleCode && userToDelete.coupleCode !== userToDelete.personalCode) {
      const partner = allUsers.find(u => u.personalCode === userToDelete.coupleCode && u.id !== userToDelete.id);
      if (partner) {
        const updatedPartner = {
          ...partner,
          coupleCode: partner.personalCode,
          availableForPairing: true
        };
        updateUserInGlobalList(updatedPartner);
      }
    }
    
    // Rimuovi le coppie associate
    const updatedCouples = allCouples.filter(couple => 
      couple.user1Id !== userToDelete.id && couple.user2Id !== userToDelete.id
    );
    setAllCouples(updatedCouples);
    setToStorage('all_couples', updatedCouples);
    
    // Notifica altri tab
    notifyOtherTabs('user_deleted', { userId: userToDelete.id });
    
    return true;
  };

  // Utility per notificare altri tab
  const notifyOtherTabs = (action, data = {}) => {
    const notification = {
      action,
      timestamp: new Date().toISOString(),
      data
    };
    const notifyKey = getStorageKey('tab_notification');
    localStorage.setItem(notifyKey, JSON.stringify(notification));
    
    // Rimuovi la notifica dopo un breve delay per evitare loop
    setTimeout(() => {
      localStorage.removeItem(notifyKey);
    }, 100);
  };

  return {
    // Stato
    currentUser,
    allUsers,
    onlineUsers,
    currentCouple,
    allCouples,
    gameSession,
    partnerStatus,
    pendingInvites,
    sentInvites,
    isLoading,
    debugInfo, // Aggiungi debugInfo al return
    
    // Azioni utente
    registerUser,
    loginUser,
    logout,
    
    // Azioni coppia
    joinUserByCode,
    leaveCouple,
    
    // Utilità
    refreshOnlineUsersFromSession,
    
    // Azioni gioco
    createGameSession,
    sendMessage,
    shareCard,
    
    // Utilità
    updateOnlineStatus,
    checkPartnerStatus,
    checkPendingInvites,
    
    // Gestione dati
    clearAllUsers,
    clearAllCouples,
    clearAllData,
    exportData,
    importData,
    getStats,
    deleteUser,

    // Azioni
    initialize // Esponiamo la funzione di inizializzazione
  };
}
