# 🛠️ Documentazione Tecnica - Implementazioni Dicembre 2024

## 📋 Panoramica delle Modifiche

Questo documento descrive le implementazioni recenti che hanno trasformato l'architettura dell'applicazione da una logica frontend-driven a una **architettura completamente centralizzata** backend-driven.

## 🏗️ Architettura Centralizzata

### Problema Originale
- **Logica UI Distribuita**: Ogni istanza frontend calcolava i permessi UI localmente
- **Inconsistenze**: Diversi frontend potevano mostrare stati diversi
- **Sincronizzazione Complessa**: Difficile mantenere coerenza tra multiple istanze

### Soluzione Implementata
- **Backend-Driven UI**: Tutta la logica UI centralizzata nel backend
- **Single Source of Truth**: Endpoint `/api/users/{userId}/state` come unica fonte di verità
- **Frontend Reattivo**: UI che si adatta automaticamente ai permessi del backend

## 🔧 Implementazioni Specifiche

### 1. Sistema di Permessi Centralizzato

#### Backend: UserPermissions.cs
```csharp
public class UserPermissions
{
    public bool CanJoinByCode { get; set; }
    public bool CanViewUsers { get; set; }      // ✨ Sempre true ora
    public bool CanStartGameSession { get; set; }
    public bool CanViewCouple { get; set; }
    public bool CanLeaveCouple { get; set; }
    public string DefaultTab { get; set; } = "join";
}
```

#### Backend: UserService.cs - CalculateUserPermissions()
```csharp
private UserPermissions CalculateUserPermissions(User user, Couple? currentCouple, GameSession? activeSession)
{
    var permissions = new UserPermissions();

    if (currentCouple == null)
    {
        // User is not in a couple
        permissions.CanJoinByCode = true;
        permissions.CanViewUsers = true;
        permissions.CanStartGameSession = false;
        permissions.CanViewCouple = false;
        permissions.CanLeaveCouple = false;
        permissions.DefaultTab = "join";
    }
    else
    {
        // User is in a couple
        permissions.CanJoinByCode = false;
        permissions.CanViewUsers = true;   // ✨ CAMBIATO: sempre true
        permissions.CanViewCouple = true;
        permissions.CanLeaveCouple = true;
        permissions.DefaultTab = "couple";

        // Check if both users in couple are online
        var coupleMembers = currentCouple.Members.Where(m => m.User.IsOnline).Count();
        var hasActiveSession = activeSession != null;

        permissions.CanStartGameSession = coupleMembers >= 2 && !hasActiveSession;
    }

    return permissions;
}
```

### 2. Endpoint Centralizzato GetUserState

#### Backend: UsersController.cs
```csharp
[HttpGet("{userId}/state")]
public async Task<ActionResult<UserStateDto>> GetUserState(string userId)
{
    var userState = await _userService.GetUserStateAsync(userId);
    
    if (userState == null)
    {
        return NotFound($"User with ID {userId} not found");
    }

    return Ok(userState);
}
```

#### DTO: UserStateDto.cs
```csharp
public class UserStateDto
{
    public User User { get; set; } = null!;
    public Couple? CurrentCouple { get; set; }
    public GameSession? ActiveSession { get; set; }
    public List<User> OnlineUsers { get; set; } = new();
    public UserPermissions Permissions { get; set; } = new();  // ✨ KEY
}
```

### 3. Frontend Reattivo

#### Frontend: PartnerManagement.jsx - Uso dei Permessi
```jsx
// Carica lo stato dell'utente dal backend (centralizzato)
useEffect(() => {
  if (!currentUser || !getUserState) return;
  
  const loadUserState = async () => {
    try {
      setLoading(true);
      const state = await getUserState(currentUser.id);
      setUserState(state);
      setError('');
    } catch (err) {
      console.error('Errore caricamento stato utente:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  loadUserState();
}, [currentUser, getUserState]);

// Funzioni di utilità per i permessi
const permissions = userState?.permissions || {};
const canJoinPartner = permissions.canJoinByCode;
const canViewUsers = permissions.canViewUsers;      // ✨ Sempre true
const canStartGameSession = permissions.canStartGameSession;
```

#### Frontend: Tab Utenti Sempre Abilitata
```jsx
{/* PRIMA: Tab disabilitata quando in coppia */}
<button
  onClick={() => canViewUsers && setActiveTab('users')}
  disabled={!canViewUsers}  // ❌ RIMOSSO
  className={`... ${!canViewUsers ? 'cursor-not-allowed' : ''}`}  // ❌ RIMOSSO
>
  👥 Utenti
  {!canViewUsers && <span>🔒</span>}  {/* ❌ RIMOSSO */}
</button>

{/* DOPO: Tab sempre abilitata */}
<button
  onClick={() => setActiveTab('users')}  // ✅ Sempre cliccabile
  className={`... hover:text-white`}     // ✅ Sempre interattiva
>
  👥 Utenti ({onlineUsers?.length || 0})
</button>
```

### 4. Contenuto Contestuale nella Tab Utenti

#### Implementazione Frontend
```jsx
{activeTab === 'users' && (
  <div className="bg-gray-800 rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">
      👥 Utenti Online ({onlineUsers?.length || 0})
    </h2>
    
    {/* ✨ NUOVO: Mostra info coppia se l'utente è in una coppia */}
    {currentCouple && (
      <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-300 mb-2">👥 La tua coppia</h3>
        <p className="text-blue-200 text-sm mb-3">
          Sei attualmente in coppia. Puoi visualizzare gli altri utenti ma non unirti a loro.
        </p>
        
        {/* ✨ NUOVO: Pulsante per iniziare sessione dalla tab Utenti */}
        {canStartGameSession && (
          <button
            onClick={handleStartGameSession}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            🎮 Inizia Sessione di Gioco
          </button>
        )}
        
        {/* ✨ NUOVO: Vai alla sessione attiva */}
        {!canStartGameSession && gameSession && (
          <button
            onClick={() => setActiveTab('game')}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            🎮 Vai alla Sessione Attiva
          </button>
        )}
        
        {/* ✨ NUOVO: Messaggio di attesa */}
        {!canStartGameSession && !gameSession && (
          <div className="text-center py-2 text-gray-400 text-sm">
            ⏳ In attesa che il partner sia online per iniziare
          </div>
        )}
      </div>
    )}
    
    {/* Lista utenti con pulsanti contestuali */}
    {onlineUsers && onlineUsers.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {onlineUsers.map(user => (
          <div key={user.id} className="bg-gray-700 p-4 rounded-lg">
            {/* ... info utente ... */}
            
            {/* ✨ NUOVO: Pulsanti contestuali */}
            {user.id !== currentUser?.id && user.availableForPairing && canJoinPartner && (
              <button
                onClick={() => {
                  setJoinCode(user.personalCode);
                  setActiveTab('join');
                }}
                className="mt-2 w-full py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
              >
                🤝 Unisciti
              </button>
            )}
            
            {/* ✨ NUOVO: Messaggio quando già in coppia */}
            {user.id !== currentUser?.id && (!canJoinPartner) && (
              <div className="mt-2 w-full py-1 bg-gray-600 text-gray-400 rounded text-sm text-center">
                👥 Sei già in coppia
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-400">Nessun utente online al momento</p>
      </div>
    )}
  </div>
)}
```

## 🔄 Flusso di Sincronizzazione

### Sequenza di Aggiornamento
1. **Azione Utente**: Un utente compie un'azione (es. forma coppia)
2. **API Call**: Il frontend invia richiesta al backend
3. **Update Database**: Il backend aggiorna il database
4. **SignalR Broadcast**: Il backend notifica tutti i client connessi
5. **State Refresh**: Ogni frontend richiama `getUserState()` 
6. **UI Update**: L'UI si aggiorna automaticamente con i nuovi permessi

### Diagramma di Flusso
```
[User Action] → [API Call] → [Backend Logic] → [Database Update]
                                    ↓
[UI Update] ← [State Refresh] ← [SignalR Broadcast]
      ↓
[All Connected Clients Updated Simultaneously]
```

## 🎯 Benefici dell'Architettura Centralizzata

### ✅ Vantaggi Ottenuti
1. **Consistenza Garantita**: Tutti i client mostrano sempre lo stesso stato
2. **Logica Centralizzata**: Una sola implementazione dei permessi
3. **Facilità di Debug**: Stato sempre tracciabile dal backend
4. **Scalabilità**: Supporta facilmente più istanze frontend
5. **Manutenibilità**: Modifiche logiche solo nel backend

### 🔍 Monitoraggio
I logs del backend mostrano chiaramente:
- Calcolo dei permessi per ogni utente
- Query database per stato completo
- Broadcast SignalR per sincronizzazione

## 🧪 Test della Funzionalità

### Scenario di Test: Tab Utenti Sempre Abilitata

1. **Setup**: Apri due browser (normale + incognito)
2. **Registrazione**: Crea due utenti (es. Fab con LZU037, Nad con PCM360)
3. **Test Stato Singolo**:
   - ✅ Tab "Utenti" abilitata
   - ✅ Lista utenti visibile
   - ✅ Pulsanti "Unisciti" funzionanti
4. **Formazione Coppia**: Un utente si unisce all'altro
5. **Test Stato Coppia**:
   - ✅ Tab "Utenti" ancora abilitata
   - ✅ Box informativo coppia visibile
   - ✅ Pulsante "Inizia Sessione" disponibile
   - ✅ Pulsanti "Unisciti" sostituiti da "Sei già in coppia"
6. **Inizia Sessione**: Clicca "Inizia Sessione di Gioco"
7. **Test Sessione Attiva**:
   - ✅ Pulsante diventa "Vai alla Sessione Attiva"
   - ✅ Entrambi i client aggiornati automaticamente

### Verifica Logs Backend
```
info: ComplicityGame.Api.Services.UserService[0]
      Calculating permissions for user in couple: CanViewUsers=True, CanStartGameSession=True
```

## 📁 File Modificati

### Backend
- `Backend/ComplicityGame.Api/Services/UserService.cs`: ✨ Logica permessi centralizzata
- `Backend/ComplicityGame.Api/Controllers/UsersController.cs`: Endpoint GetUserState
- `Backend/ComplicityGame.Api/DTOs/UserStateDto.cs`: DTO completo stato utente
- `Backend/ComplicityGame.Api/DTOs/UserPermissions.cs`: Definizione permessi UI

### Frontend  
- `src/PartnerManagement.jsx`: ✨ UI reattiva ai permessi backend
- `src/BackendService.js`: Client per API getUserState
- `src/useBackend.js`: Hook per gestione stato centralizzato

## 🚀 Deployment

Le modifiche sono completamente backward-compatible e non richiedono migration database aggiuntive. Il sistema mantiene la compatibilità con i client esistenti mentre introduce la nuova logica centralizzata.

---

**Implementazioni completate il:** Dicembre 2024  
**Status:** ✅ Produzione Ready  
**Test:** ✅ Multi-browser verificato  
**Performance:** ✅ Ottimizzato con caching UserState
