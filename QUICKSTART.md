# Fox Valley Finance Tracker - Quick Start Guide

## Prerequisites Installation

### 1. Install Docker Desktop
```bash
# Download from https://www.docker.com/products/docker-desktop
# Or via Homebrew
brew install --cask docker

# Start Docker
open -a Docker
```

### 2. Install Supabase CLI
```bash
brew install supabase/tap/supabase
```

### 3. Install Node.js (if not already)
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## Project Setup (One-Time)

### 1. Navigate to Project
```bash
cd ~/repos/fox-valley-finance
```

### 2. Start Supabase Local
```bash
# This starts PostgreSQL, Auth, Storage, and Edge Functions
supabase start

# Note: First run downloads Docker images (~5-10 minutes)
# Subsequent starts are instant
```

### 3. Verify Services Running
```bash
supabase status

# Should show:
# - API URL: http://localhost:54321
# - DB URL: postgresql://...
# - Studio URL: http://localhost:54323
```

### 4. Apply Database Migrations
```bash
# Reset applies migrations + seed data
supabase db reset

# Verify tables created:
supabase studio  # Opens http://localhost:54323
```

### 5. Configure Environment Variables

**Web App:**
```bash
cd apps/web

# Get actual values from 'supabase status'
cat > .env << EOF
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
```

**Mobile App:**
```bash
cd ../mobile

# For iOS Simulator
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

# For Android Emulator
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
```

### 6. Install Dependencies
```bash
# Web app
cd apps/web
npm install

# Mobile app  
cd ../mobile
npm install
```

---

## Daily Development

### Start Everything
```bash
# Terminal 1: Start Supabase (if not running)
supabase start

# Terminal 2: Start web dev server
cd apps/web
npm run dev
# → http://localhost:5173

# Terminal 3: Start mobile dev server
cd apps/mobile
npx expo start
# → i: iOS Simulator
# → a: Android emulator
# → w: Web preview
```

### Stop Everything
```bash
# Stop web/mobile: Ctrl+C in each terminal

# Stop Supabase
supabase stop

# Stop Docker (optional)
# Docker Desktop → Quit
```

---

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Web App | http://localhost:5173 | Main application |
| Supabase Studio | http://localhost:54323 | Database UI |
| Supabase API | http://localhost:54321 | REST/GraphQL endpoint |
| API Docs | http://localhost:54321/rest/v1/ | Auto-generated API docs |

---

## Troubleshooting

### "Docker daemon not running"
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to fully start (~30 seconds)
# Verify: docker ps
```

### "Cannot connect to Supabase"
```bash
# Check if Supabase is running
supabase status

# If not running, start it
supabase start

# If stuck, restart:
supabase stop
supabase start
```

### "Database connection refused"
```bash
# Reset database (loses local data!)
supabase db reset

# Or restart Supabase
supabase stop
supabase start
```

### "Port already in use"
```bash
# Find what's using port 54321
lsof -i :54321

# Kill it or use different port
supabase stop
# Edit supabase/config.toml to change port
supabase start
```

---

## Test the Setup

### 1. Open Web App
- Visit http://localhost:5173
- Should see login screen or dashboard (if auto-logged in)

### 2. Check Supabase Studio
- Visit http://localhost:54323
- Tables → vendors, receipts, estimates should exist
- Auth → Users should show seed users

### 3. Test Data
- Dashboard should show sample data
- Vendors list should have ~20 vendors
- Inbox should have 3 receipts to review

### 4. Run Tests
```bash
cd apps/web
npm run test:run
```

---

## Production Deployment

When ready to deploy to production:

```bash
# 1. Create Supabase project at https://supabase.com

# 2. Link local to project
supabase link --project-ref your-project-ref

# 3. Deploy database
supabase db push

# 4. Deploy edge function
supabase functions deploy ocr-extract
supabase secrets set ANTHROPIC_API_KEY=your-key

# 5. Update .env with production credentials

# 6. Build and deploy web
npm run build
# Deploy dist/ folder to Vercel/Netlify

# 7. Build mobile
npx expo build
```

---

## Project Status

✅ **Complete:**
- Database schema (migrations)
- Seed data (realistic construction project)
- Web app (React + Vite + TypeScript)
- Mobile app (Expo + React Native)
- OCR Edge Function (Claude API)
- Documentation (README, ARCHITECTURE, DEPLOYMENT)
- Error boundaries + logging
- Tests (framework setup)

⏳ **When you test:**
- Verify build compiles
- Run database migrations
- Check Supabase connection
- Test receipt capture flow

---

*Ready to go. Just need Docker + Supabase CLI installed.*