# Fox Valley Finance Tracker - Deployment Guide

Complete guide for deploying Fox Valley Finance Tracker from local development through production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Management](#environment-management)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Accounts Needed

- **Supabase**: https://supabase.com (free tier sufficient for testing)
- **Expo**: https://expo.dev (for mobile builds)
- **Vercel/Netlify**: (for web hosting, optional)
- **Anthropic**: https://console.anthropic.com (for Claude OCR API key)

### Local Tools

```bash
# Verify installations
node --version      # v20+
npm --version       # v10+
supabase --version  # latest
```

---

## Local Development

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/fox-valley-finance.git
cd fox-valley-finance

# 2. Start Supabase local
supabase start

# 3. Apply database migrations
supabase db reset

# 4. Install web dependencies
cd apps/web
npm install

# 5. Create environment file
cat > .env << EOF
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=$(supabase status | grep -o 'anon key: .*' | cut -d' ' -f3)
EOF

# 6. Start web dev server
npm run dev

# 7. In new terminal - install mobile dependencies
cd ../mobile
npm install

# 8. Create mobile environment file
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321  # Android
# OR
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321  # iOS
EXPO_PUBLIC_SUPABASE_ANON_KEY=$(supabase status | grep -o 'anon key: .*' | cut -d' ' -f3)
EOF

# 9. Start Expo
cd ../mobile
npx expo start
```

### Daily Development Workflow

```bash
# Start Supabase (if not running)
supabase start

# Check status
supabase status

# View database logs
supabase logs database --tail

# Reset to clean state (careful - deletes data!)
supabase db reset
```

### Access Local Services

| Service | URL | Notes |
|---------|-----|-------|
| Web App | http://localhost:5173 | Vite dev server |
| Supabase API | http://localhost:54321 | REST/GraphQL endpoint |
| Supabase Studio | http://localhost:54323 | Database UI |
| Expo Dev | http://localhost:8081 | Mobile development |

---

## Staging Deployment

### 1. Create Staging Project

```bash
# Create new Supabase project
supabase projects create fox-valley-staging --org-id your-org-id --region us-east-1

# Link local to staging
supabase link --project-ref abcdefghijklmnopqrst

# Deploy database
supabase db push
```

### 2. Configure Staging Secrets

```bash
# Set OCR API key
supabase secrets set --project-ref abcdefghijklmnopqrst ANTHROPIC_API_KEY=sk-ant-...

# Verify
supabase secrets list --project-ref abcdefghijklmnopqrst
```

### 3. Deploy Edge Function

```bash
# Deploy OCR function to staging
supabase functions deploy ocr-extract --project-ref abcdefghijklmnopqrst

# Verify deployment
supabase functions list --project-ref abcdefghijklmnopqrst
```

### 4. Configure Web App for Staging

```bash
cd apps/web

# Create staging environment file
cat > .env.staging << EOF
VITE_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

# Build for staging
npm run build -- --mode staging
```

### 5. Deploy Web to Vercel (Staging)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or with environment
vercel --prod --env=VITE_SUPABASE_URL=https://... --env=VITE_SUPABASE_ANON_KEY=eyJ...
```

### 6. Test Staging

```bash
# Run smoke tests
npm run test:smoke

# Verify OCR function
curl -X POST https://abcdefghijklmnopqrst.supabase.co/functions/v1/ocr-extract \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"image": "base64encoded..."}'
```

---

## Production Deployment

### 1. Create Production Project

```bash
# Create production Supabase project
supabase projects create fox-valley-production --org-id your-org-id --region us-east-1

# Link (separate from staging)
supabase link --project-ref zyxwvutsrqponmlkjihg

# Deploy production database
supabase db push
```

### 2. Configure Production Secrets

```bash
# OCR API key
supabase secrets set --project-ref zyxwvutsrqponmlkjihg ANTHROPIC_API_KEY=sk-ant-production-key

# Any additional secrets
supabase secrets set --project-ref zyxwvutsrqponmlkjihg ENCRYPTION_KEY=your-secret-key
```

### 3. Configure Auth Settings

In Supabase Dashboard:

1. **Authentication > Settings**
   - Enable "Email" provider
   - Enable "Magic Link" (disable "Confirm email")
   - Set "Site URL" to your production web URL
   - Add redirect URLs for mobile app deep links

2. **Authentication > Email Templates**
   - Customize magic link email template
   - Add your branding

### 4. Deploy Web App

```bash
cd apps/web

# Create production env
cat > .env.production << EOF
VITE_SUPABASE_URL=https://zyxwvutsrqponmlkjihg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.production_key
EOF

# Build
npm run build

# Verify build output
ls -la dist/

# Deploy to Vercel
vercel --prod --confirm

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

### 5. Configure Custom Domain (Optional)

```bash
# Vercel
cd apps/web
vercel domains add foxvalley.yourdomain.com

# Add DNS record
# Type: CNAME
# Name: foxvalley
# Value: cname.vercel-dns.com
```

### 6. Deploy Mobile App

```bash
cd apps/mobile

# Configure EAS
npm install -g eas-cli
eas login

# Configure app.json with production URL
cat app.json | jq '.expo.extra.supabaseUrl = "https://zyxwvutsrqponmlkjihg.supabase.co"'

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 7. Post-Production Checklist

```bash
# Verify all services
./scripts/health-check.sh

# Test critical flows
./scripts/smoke-tests.sh

# Verify OCR function
curl -s https://zyxwvutsrqponmlkjihg.supabase.co/functions/v1/ocr-extract \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{"image": "test"}' | jq '.error'  # Should return error about invalid image, not 404

# Check database indexes are working
psql $PRODUCTION_DB_URL -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan < 10;"
```

---

## Environment Management

### Environment Variables Reference

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| `SUPABASE_URL` | localhost:54321 | *.supabase.co | *.supabase.co |
| `SUPABASE_ANON_KEY` | local-key | staging-key | production-key |
| `ANTHROPIC_API_KEY` | sk-ant-dev | sk-ant-staging | sk-ant-prod |
| `APP_ENV` | development | staging | production |

### Switching Environments

```bash
# Create script to switch environments
cat > scripts/switch-env.sh << 'EOF'
#!/bin/bash
ENV=$1

case $ENV in
  local)
    cp apps/web/.env apps/web/.env.backup
    cp apps/web/.env.local apps/web/.env
    supabase start
    ;;
  staging)
    cp apps/web/.env apps/web/.env.backup
    cp apps/web/.env.staging apps/web/.env
    supabase stop
    ;;
  production)
    cp apps/web/.env apps/web/.env.backup
    cp apps/web/.env.production apps/web/.env
    supabase stop
    ;;
  *)
    echo "Usage: ./switch-env.sh {local|staging|production}"
    exit 1
    ;;
esac
echo "Switched to $ENV environment"
EOF
chmod +x scripts/switch-env.sh
```

---

## Rollback Procedures

### Database Rollback

```bash
# Create backup before migration
supabase db dump --data-only > backup-$(date +%Y%m%d-%H%M%S).sql

# If migration fails, restore from backup
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# Or revert specific migration
supabase migration repair --status reverted 000001_initial_schema
```

### Edge Function Rollback

```bash
# Deploy previous version
git checkout HEAD~1 -- supabase/functions/ocr-extract/
supabase functions deploy ocr-extract

# Or use Supabase Dashboard to restore previous version
```

### Web App Rollback

```bash
# Vercel - redeploy previous
vercel --prod --version=PREVIOUS_DEPLOYMENT_ID

# Or revert git and redeploy
git revert HEAD
vercel --prod
```

---

## Monitoring & Maintenance

### Database Monitoring

```sql
-- Check slow queries
SELECT query, calls, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE n_tup_del > n_tup_ins * 0.1;

-- Monitor active connections
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;
```

### Edge Function Monitoring

```bash
# View function logs
supabase functions logs ocr-extract --tail

# Check function invocations
supabase functions stats ocr-extract
```

### Health Check Script

```bash
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
set -e

SUPABASE_URL=$1
ANON_KEY=$2

echo "=== Health Check ==="
echo "Testing $SUPABASE_URL"

# Test database connection
curl -s "$SUPABASE_URL/rest/v1/vendors?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq '.[0].id' && echo "✓ Database OK"

# Test edge function
curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/functions/v1/ocr-extract" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"image": "test"}' | grep -q "400" && echo "✓ Edge Function OK"

# Test auth
curl -s "$SUPABASE_URL/auth/v1/settings" \
  -H "apikey: $ANON_KEY" | jq '.external_labels' && echo "✓ Auth OK"

echo "=== All Systems Operational ==="
EOF
chmod +x scripts/health-check.sh
```

### Scheduled Maintenance

```bash
# Weekly: Vacuum analyze
cat > scripts/maintenance.sh << 'EOF'
#!/bin/bash
psql $DATABASE_URL << 'SQL'
VACUUM ANALYZE vendors;
VACUUM ANALYZE receipts;
VACUUM ANALYZE estimates;
VACUUM ANALYZE documents;
SQL
EOF
chmod +x scripts/maintenance.sh

# Add to cron (weekly Sunday 2am)
0 2 * * 0 /path/to/scripts/maintenance.sh
```

---

## Troubleshooting

### Common Issues

**"Cannot connect to Supabase"**
```bash
# Check if Docker is running
docker ps

# Restart Supabase
supabase stop
supabase start
```

**"Build fails with TypeScript errors"**
```bash
# Regenerate Supabase types
supabase gen types typescript --local > apps/web/src/types/supabase.ts

# Type check
npm run type-check
```

**"OCR function times out"**
- Check Anthropic API key is set
- Verify image size < 5MB
- Check function logs for errors

**"Mobile app can't connect"**
- iOS: Use `localhost`
- Android: Use `10.0.2.2` (emulator) or computer IP (physical device)

### Getting Help

1. Check Supabase Status: https://status.supabase.com
2. Review logs: `supabase logs --tail`
3. Open Supabase Studio: `supabase start` then visit http://localhost:54323
4. Check Anthropic status: https://status.anthropic.com

---

## Production Checklist

Before going live:

- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] OCR function deployed and tested
- [ ] Web app deployed and accessible
- [ ] Custom domain configured with SSL
- [ ] Mobile apps built and submitted
- [ ] Auth settings configured (magic links, redirects)
- [ ] Environment variables set
- [ ] Secrets configured (API keys)
- [ ] Health checks passing
- [ ] Backup strategy configured
- [ ] Monitoring set up
- [ ] Rollback procedures tested
- [ ] Documentation updated

---

*Last updated: 2026-03-21*