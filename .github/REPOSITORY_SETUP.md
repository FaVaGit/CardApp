# GitHub Repository Configuration

Questo file descrive le impostazioni consigliate per il repository GitHub.

## Branch Protection Rules

### Main Branch Protection
Configura le seguenti regole per il branch `main`:

1. **Require pull request reviews before merging**
   - Required number of reviewers: 1
   - Dismiss stale reviews when new commits are pushed: ✅
   - Require review from code owners: ✅

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✅
   - Status checks required:
     - `test-frontend` 
     - `test-backend`
     - `security-scan`

3. **Require conversation resolution before merging**: ✅

4. **Require signed commits**: ✅ (opzionale ma consigliato)

5. **Include administrators**: ✅

6. **Allow force pushes**: ❌

7. **Allow deletions**: ❌

## Repository Settings

### General
- **Default branch**: `main`
- **Template repository**: ❌
- **Issues**: ✅
- **Projects**: ✅ 
- **Wiki**: ✅
- **Discussions**: ✅

### Security
- **Vulnerability alerts**: ✅
- **Security updates**: ✅
- **Token scanning**: ✅
- **Secret scanning**: ✅
- **Private vulnerability reporting**: ✅

### Code Security
- **Dependency graph**: ✅
- **Dependabot alerts**: ✅
- **Dependabot version updates**: ✅
- **Code scanning alerts**: ✅

## GitHub Secrets

Per il CI/CD, configura questi secrets nel repository:

### Deployment Secrets
```
NETLIFY_AUTH_TOKEN=     # Per deploy frontend su Netlify
NETLIFY_SITE_ID=        # Site ID Netlify
VERCEL_TOKEN=           # Token Vercel per deploy
ORG_ID=                 # Organization ID Vercel
PROJECT_ID=             # Project ID Vercel
```

### Database Secrets (Production)
```
DB_CONNECTION_STRING=   # Connection string database produzione
DB_PASSWORD=            # Password database
```

### API Keys (se necessario)
```
AZURE_CREDENTIALS=      # Per deploy su Azure
AWS_ACCESS_KEY_ID=      # Per deploy su AWS
AWS_SECRET_ACCESS_KEY=  # Per deploy su AWS
```

## Collaboratori

### Ruoli Team
- **Admin**: Proprietario repository (FaVaGit)
- **Maintainer**: Sviluppatori principali
- **Write**: Contributori regolari
- **Read**: Tester e reviewer

### Code Owners
Crea file `.github/CODEOWNERS`:
```
# Global owners
* @FaVaGit

# Frontend specific
/src/ @frontend-team
/package.json @frontend-team

# Backend specific  
/Backend/ @backend-team
/Backend/ComplicityGame.Api/ @backend-team

# DevOps
/.github/ @devops-team
/docker* @devops-team
```

## Labels

Crea le seguenti labels per organizzare issues e PR:

### Type
- `bug` (🐛 #d73a4a) - Bug report
- `enhancement` (✨ #a2eeef) - New feature  
- `documentation` (📚 #0075ca) - Documentation
- `refactor` (♻️ #fbca04) - Code refactoring
- `performance` (⚡ #ff9500) - Performance improvement

### Priority
- `priority: low` (🟢 #d4edda) - Low priority
- `priority: medium` (🟡 #fff3cd) - Medium priority
- `priority: high` (🟠 #f8d7da) - High priority  
- `priority: critical` (🔴 #f5c6cb) - Critical priority

### Component
- `frontend` (💻 #e1f5fe) - Frontend related
- `backend` (⚙️ #f3e5f5) - Backend related
- `database` (🗄️ #e8f5e8) - Database related
- `signalr` (📡 #fff8e1) - SignalR related

### Status
- `help wanted` (🆘 #128A0C) - Extra attention needed
- `good first issue` (👋 #7057ff) - Good for newcomers
- `wontfix` (⛔ #ffffff) - Won't be addressed
- `duplicate` (👥 #cfd3d7) - Duplicate issue

## Project Boards

### Recommended Kanban Board
1. **Backlog** - Ideas and feature requests
2. **To Do** - Approved and prioritized tasks
3. **In Progress** - Currently being worked on
4. **Review** - Waiting for review/testing
5. **Done** - Completed tasks

### Milestones
- `v1.1.0` - Minor improvements and bug fixes
- `v2.0.0` - Major feature additions
- `Mobile App` - Future mobile application
- `Multi-language` - Internationalization support

---

## Setup Instructions

Per applicare queste configurazioni:

1. Vai su https://github.com/FaVaGit/CardApp/settings
2. Configura le impostazioni secondo questa guida
3. Aggiungi i branch protection rules
4. Configura i secrets necessari
5. Crea le labels consigliate
6. Imposta un project board per organizzare il lavoro
