# Railway + Cloudflare - Quick Reference

**⏱️ Geschatte tijd: 1-1.5 uur**
**💰 Kosten: ~€10/maand**

---

## 🚀 Quick Deploy Checklist

### Part 1: Railway Backend (30 min)

```bash
✅ 1. Account aanmaken: https://railway.app (GitHub login)
✅ 2. New Project → Deploy from GitHub → mgmheck/huisartsen-dashboard
✅ 3. Upgrade naar Starter ($5/maand)
✅ 4. Environment Variables toevoegen:
   FLASK_ENV=production
   PORT=5001
   DATA_PATH=/app/data/parameterwaarden.csv
   R_SCRIPT_PATH=/app/r_scripts/
   PYTHONUNBUFFERED=1

✅ 5. Generate Domain (kopieer URL!)
✅ 6. Test: curl https://jouw-railway-url/health
```

### Part 2: Cloudflare Pages (20 min)

```bash
✅ 1. Account aanmaken: https://cloudflare.com
✅ 2. Workers & Pages → Create → Connect to Git
✅ 3. Select repository: mgmheck/huisartsen-dashboard
✅ 4. Build settings:
   Build command: npm install && npm run build
   Build output: build

✅ 5. Environment Variable:
   REACT_APP_API_URL=https://jouw-railway-url

✅ 6. Save and Deploy
✅ 7. Test: Open URL in browser
```

### Part 3: Update & Deploy (15 min)

```bash
✅ 1. Git add, commit, push (met updated CORS)
✅ 2. Railway autodeploy (5-10 min)
✅ 3. Cloudflare autodeploy (2-3 min)
✅ 4. Test beide URLs
✅ 5. Render services pauzeren (na 48u)
```

---

## 📝 Environment Variables Reference

### Railway Backend
```bash
FLASK_ENV=production
PORT=5001
DATA_PATH=/app/data/parameterwaarden.csv
R_SCRIPT_PATH=/app/r_scripts/
PYTHONUNBUFFERED=1
```

### Cloudflare Pages
```bash
REACT_APP_API_URL=https://huisartsen-dashboard-backend.railway.app
```

---

## 🧪 Testing Commands

### Backend Health Check
```bash
curl https://huisartsen-dashboard-backend.railway.app/health
# Expected: {"status":"healthy",...}
```

### Backend Scenario Test
```bash
curl -X POST https://huisartsen-dashboard-backend.railway.app/api/scenario \
  -H "Content-Type: application/json" \
  -d '{"instroom":718}'
# Expected: {"projectie":[...],...}
```

### Cache Stats
```bash
curl https://huisartsen-dashboard-backend.railway.app/api/cache/stats
# Expected: {"cache_size":..., "hit_rate":...}
```

---

## 🔧 Common Issues & Fixes

### CORS Error
**Symptom:** "Access-Control-Allow-Origin" error in browser console

**Fix:**
1. Check `api/scenario_model.py` CORS origins include Cloudflare URL
2. Git push to trigger Railway redeploy
3. Wait 5-10 min for Railway build

### Railway Build Timeout
**Symptom:** Build fails after 25 minutes

**Fix:**
1. Check Dockerfile layer caching
2. Verify base image is `rocker/tidyverse:4.3`
3. Use `--no-cache-dir` for pip installs

### Cloudflare Build Fails
**Symptom:** "npm ERR!" during build

**Fix:**
1. Check Node version = 18+ in Cloudflare settings
2. Verify `REACT_APP_API_URL` is set correctly
3. Check build command: `npm install && npm run build`

### API Returns 404
**Symptom:** Frontend shows "API not connected"

**Fix:**
1. Verify Railway service status = "Active"
2. Check health endpoint: `curl railway-url/health`
3. Verify `REACT_APP_API_URL` in Cloudflare matches Railway domain

---

## 💰 Cost Monitoring

### Railway Dashboard
- Go to: Settings → Usage
- Set budget alert: $15/maand
- Enable email notifications

### Expected Costs
```
Railway Starter:  $5/maand (base)
CPU Usage:        $2-3/maand
RAM Usage:        $1-2/maand
Network:          $1/maand
─────────────────────────────
TOTAL:            ~$9-11/maand
```

### Cloudflare (Free Tier)
```
Builds:           500/maand (free)
Bandwidth:        Unlimited (free)
SSL:              Included (free)
─────────────────────────────
TOTAL:            $0/maand
```

---

## 📊 Performance Benchmarks

### Before (Render Free)
```
Frontend load:    500-1000ms
API cold start:   15-30 seconds
API warm:         50ms-4s
Build time:       20 minutes
Uptime:          ~99%
```

### After (Railway + Cloudflare)
```
Frontend load:    <200ms (5x faster) ✅
API cold start:   NONE (always warm) ✅
API warm:         50ms-4s (same)
Build time:       5-10 minutes (2x faster) ✅
Uptime:          ~99.9% (better) ✅
```

---

## 🔄 Rollback Plan

**If things go wrong:**

1. **Render Services (pauzeren → resume)**
   ```
   https://dashboard.render.com → Services → Resume
   ```

2. **Update Cloudflare env var**
   ```
   REACT_APP_API_URL=https://huisartsen-dashboard-backend.onrender.com
   ```

3. **Trigger Cloudflare redeploy**
   ```
   Deployments → Retry deployment
   ```

**Rollback time:** <10 minuten

---

## 📞 Support Links

| Platform | Link |
|----------|------|
| Railway Docs | https://docs.railway.app |
| Railway Status | https://status.railway.app |
| Cloudflare Docs | https://developers.cloudflare.com/pages |
| Cloudflare Status | https://www.cloudflarestatus.com |

---

## ✅ Success Criteria

Deployment is succesvol als:

- [x] Railway health check: 200 OK
- [x] Cloudflare frontend loads: <2s
- [x] API connected badge: groen
- [x] Parameters werken (slider → chart update)
- [x] No console errors (F12)
- [x] No cold starts (response <5s)
- [x] Costs < $15/maand

---

**Voor complete instructies:** Zie `RAILWAY_DEPLOYMENT.md`

**Laatst bijgewerkt:** 5 november 2025
