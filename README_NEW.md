# 🎮 CardApp - Gioco della Complicità

A modern card game application built with **Event-Driven Architecture** using React, ASP.NET Core, and RabbitMQ. Designed for couples to strengthen their relationship through meaningful conversation prompts.

## ✨ Features

- 🎯 **Single Player Mode**: Individual card drawing experience
- 👥 **Couple Mode**: Partner matching and shared game sessions
- 🎲 **150+ Conversation Cards**: Carefully crafted prompts in Italian
- 🔄 **Real-time Events**: RabbitMQ-powered event system
- 📱 **Responsive Design**: Works on mobile and desktop
- 🏗️ **Modern Architecture**: Clean, maintainable codebase

## 🏗️ Architecture

**Event-Driven with RabbitMQ**
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: ASP.NET Core 8 Web API
- **Database**: SQLite with Entity Framework Core
- **Events**: RabbitMQ for real-time communication
- **State Management**: Event sourcing pattern

## 📁 Project Structure

```
CardApp/
├── 🎯 Core Application
│   ├── src/                          # Clean, modern React frontend
│   │   ├── main.jsx                  # App entry point
│   │   ├── SimpleApp.jsx             # Main application orchestrator
│   │   ├── SimpleAuth.jsx            # User authentication
│   │   ├── SimpleCardGame.jsx        # Single player game
│   │   ├── CoupleGame.jsx            # Couple/partner game
│   │   ├── EventDrivenApiService.js  # API communication layer
│   │   ├── expandedCards.js          # Card deck data
│   │   └── familyCards.js            # Family-friendly cards
│   │
│   ├── Backend/ComplicityGame.Api/   # ASP.NET Core Web API
│   │   ├── Controllers/              # REST API endpoints
│   │   │   └── EventDrivenGameController.cs
│   │   ├── Services/                 # Business logic layer
│   │   │   ├── UserPresenceService.cs
│   │   │   ├── CoupleMatchingService.cs
│   │   │   ├── GameSessionService.cs
│   │   │   └── RabbitMQEventPublisher.cs
│   │   ├── Models/                   # Data models and entities
│   │   ├── Events/                   # RabbitMQ event system
│   │   └── Data/                     # Database context (SQLite)
│   │
├── 🛠️ Development Tools
│   ├── start.sh                      # Start complete application
│   ├── stop.sh                       # Stop all services
│   ├── test-all.sh                   # Comprehensive test suite
│   ├── test-partner-matching.sh      # Partner matching tests
│   │
├── 📦 Configuration
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.js               # Vite build configuration
│   └── .github/copilot-instructions.md
│
└── 📚 Documentation
    ├── README.md                     # This file
    ├── SCRIPTS.md                    # Scripts documentation
    └── archive/                      # Legacy files (cleaned up)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- .NET 8 SDK
- SQLite

### Installation & Startup

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd CardApp
   npm install
   ```

2. **Start the application**:
   ```bash
   ./start.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:5000

### Single Player Mode
1. Open http://localhost:5174
2. Enter your name and select "Gioco Singolo"
3. Start drawing cards and enjoy!

### Couple Mode
1. **Player 1**: Open http://localhost:5174 in browser tab 1
2. **Player 2**: Open http://localhost:5174 in browser tab 2  
3. Both players: Enter names and select "Gioco di Coppia"
4. **Player 1**: Share your personal code with Player 2
5. **Player 2**: Enter Player 1's code to join the couple
6. Game session starts automatically - enjoy together!

## 🧪 Testing

### Run All Tests
```bash
./test-all.sh
```

### Test Partner Matching Only
```bash
./test-partner-matching.sh
```

### Stop Services
```bash
./stop.sh
```

## 🎯 API Endpoints

### Core Game API
- `POST /api/EventDrivenGame/connect` - Connect user to the system
- `POST /api/EventDrivenGame/join-couple` - Join/create a couple
- `POST /api/EventDrivenGame/draw-card` - Draw a card from the deck
- `POST /api/EventDrivenGame/start-game` - Start a game session

### Health Check
- `GET /api/health` - Service health status

## 🎮 Game Flow

### Single Player
1. **Connect** → User authentication and setup
2. **Select Game Type** → Choose "Single Player"
3. **Draw Cards** → Get conversation prompts
4. **Enjoy** → Reflect on the prompts

### Couple Mode
1. **Both Connect** → Authentication for both partners
2. **Partner Matching** → Use personal codes to form a couple
3. **Auto Game Session** → System creates shared game session
4. **Draw Cards Together** → Take turns drawing cards
5. **Conversation** → Discuss the prompts together

## 🔧 Development Scripts

| Script | Purpose |
|--------|---------|
| `start.sh` | Start complete application (backend + frontend) |
| `stop.sh` | Stop all running services |
| `test-all.sh` | Run comprehensive test suite |
| `test-partner-matching.sh` | Test partner matching workflow |

## 🗃️ Database Schema

**Users** - User accounts and authentication
**Couples** - Partner relationships  
**CoupleUsers** - Many-to-many relationship for couples
**GameSessions** - Active game instances
**Cards** - Game card data (optional storage)

## 📊 Event System

The application uses RabbitMQ for real-time events:

- **UserConnected** - User joins the system
- **CoupleCreated** - New couple formed
- **CoupleCompleted** - Couple has 2 members
- **GameSessionStarted** - New game begins
- **CardDrawn** - Card drawn by player

## 🏆 Features

### ✅ Implemented
- Event-driven architecture with RabbitMQ
- User authentication and management
- Partner matching system
- Real-time couple formation
- Automatic game session creation
- Card drawing with event publishing
- Comprehensive testing suite
- Clean, modern UI/UX
- Mobile-responsive design

### 🔮 Future Enhancements
- Card sharing between partners
- Game history and statistics
- Custom card decks
- Voice/video integration
- Multi-language support

## 🧹 Recent Cleanup

This version represents a major cleanup and modernization:

- ✅ **Simplified Architecture**: Removed unnecessary components
- ✅ **Event-Driven Pattern**: RabbitMQ integration for real-time features  
- ✅ **Clean Codebase**: Archived legacy files and unused components
- ✅ **Modern Scripts**: Consolidated and improved build/test scripts
- ✅ **Comprehensive Testing**: Full test suite for all functionality
- ✅ **Updated Documentation**: Clear, accurate documentation

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./test-all.sh`
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**CardApp** - Bringing couples closer through meaningful conversation 💕
