# Fox Valley Finance Tracker - Cloud Setup

## 1. Create Supabase Project

Go to https://supabase.com and:
1. Sign up / Sign in
2. Click "New Project"
3. Name: "fox-valley-finance"
4. Password: (generate a secure one, you'll need it for SQL access)
5. Region: Pick closest to you (e.g., us-east-1 for Toronto)

## 2. Get Your Credentials

Once project is created:

**Project Settings > API:**
```
Project URL: https://abcdefghijklmnopqrst.supabase.co
Project API Keys:
  - anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - service_role: (keep secret, not needed for web app)
```

**Copy the Project URL and anon key** - you'll paste these below.

## 3. Configure Web App

Paste your credentials here:

```bash
cd ~/repos/fox-valley-finance/apps/web

cat > .env << 'EOF'
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...YOUR_ANON_KEY...
EOF
```

**Replace:**
- `YOUR_PROJECT_ID` with your actual project ID
- `eyJ...` with your actual anon key

## 4. Apply Database Schema

Go to **Supabase Studio > SQL Editor** and run:

```sql
-- Run the contents of supabase/migrations/000001_initial_schema.sql
-- You can copy/paste from: cat ~/repos/fox-valley-finance/supabase/migrations/000001_initial_schema.sql
```

Or via CLI:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 5. Seed Data (Optional)

In **SQL Editor**, run:

```sql
-- Run contents of supabase/seed.sql for sample data
-- Or run scenarios.sql for complex test cases
```

## 6. Start Web App

```bash
cd ~/repos/fox-valley-finance/apps/web
npm run dev

# → http://localhost:5173
# → Connects to your cloud Supabase
```

## 7. Deploy OCR Function (Optional)

```bash
cd ~/repos/fox-valley-finance
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy ocr-extract

# Set Claude API key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
```

---

## Troubleshooting

**"Failed to fetch" / CORS errors:**
- Go to Settings > API > Enable CORS
- Add `http://localhost:5173` to allowed origins

**"Invalid API key":**
- Double-check you used the **anon** key (not service_role)
- Verify project URL matches your project

**"relation does not exist":**
- Database migrations haven't run
- Re-run step 4

---

**Ready when you are.** Paste your credentials when you have them and I'll finish the setup.