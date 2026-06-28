# Coolify Deployment Guide — Boom Media SaaS

Server: `159.65.235.140` — SSH as `root@159.65.235.140`
Coolify admin: `http://159.65.235.140:8000`
Shared Supabase: `https://db.boommedia.us`
Project in Coolify: **Boom Supabase** (all SaaS apps live here)

---

## Deploying a New SaaS App

### 1. Add nixpacks.toml to the repo root
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]
```

### 2. Add engines to package.json
```json
"engines": { "node": ">=20.9.0" }
```

### 3. Create the app in Coolify
- Projects → Boom Supabase → + New → Application
- Build Pack: **Nixpacks**
- Git repo: `boommedia/<repo-name>` (must be public or use deploy key)
- **Set domain to production URL immediately** — e.g. `https://www.myapp.com`
- Direction: Allow www & non-www

### 4. Set environment variables
Required for every app:
```
NEXT_PUBLIC_SUPABASE_URL=https://db.boommedia.us
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Boom DB>
SUPABASE_SERVICE_ROLE_KEY=<service role key from Boom DB>
NEXT_PUBLIC_APP_URL=https://www.myapp.com
NODE_ENV=production  ← Runtime only, NOT buildtime
```

**Critical:** `NODE_ENV` must have "Available at Buildtime" UNCHECKED — otherwise npm skips devDependencies and the build fails.

### 5. Set resource limits
- Coolify → app → Resource Limits → Maximum Memory: `1536m`
- Prevents OOM crashes during Next.js builds

### 6. Update DNS
- name.com → domain → Manage DNS
- Add A record: `@` → `159.65.235.140`
- Add A record: `www` → `159.65.235.140`
- Delete any old Vercel CNAME records

### 7. Run SQL migrations
- Go to Supabase Studio: `https://studio.boommedia.us`
- SQL Editor → run the app's migration files from `supabase/sql/`

### 8. Deploy
- Click Redeploy in Coolify
- Watch logs — build takes ~4 minutes

---

## Supabase Auth Setup (per app)

In Boom DB environment variables, update:
- `SITE_URL` → primary app URL (e.g. `https://www.myapp.com`)
- `ADDITIONAL_REDIRECT_URLS` → add `https://www.myapp.com/**`

**Note:** Boom DB serves all apps. If multiple apps use auth, add all URLs to `ADDITIONAL_REDIRECT_URLS` as comma-separated values.

---

## Known Issues & Fixes

| Problem | Fix |
|---------|-----|
| Build fails: Node 18 used instead of 20 | Add `nixpacks.toml` to repo (see above) |
| Build fails: missing devDependencies | Uncheck "Available at Buildtime" for NODE_ENV |
| Coolify crashes during build (OOM) | `systemctl restart docker && docker start coolify` |
| Coolify compose fails on restart | Use `docker start coolify` directly, not `docker compose up` |
| 503 on Supabase domain | Check Coolify → Boom DB → Supabase Kong → Edit Domains → ensure `https://db.boommedia.us:8000` |
| CORS errors from browser | Fix `GOTRUE_SITE_URL` in Boom DB env vars, restart auth container |
| Server slow/crashing | 2GB swap already added. If OOM persists, restart: `systemctl restart docker && docker start coolify` |

---

## Server Info

```
Droplet:  DigitalOcean Basic / 2 vCPU / 4GB RAM / 80GB
Swap:     2GB (/swapfile) — already configured
OS:       Ubuntu 24.04 LTS
Docker:   29.5.2
Coolify:  v4.1.0
```

## Key File Locations
```
Coolify data:     /data/coolify/
Supabase config:  /data/coolify/services/cdplj9vs46det9pvtxmagpix/volumes/
Kong config:      /data/coolify/services/cdplj9vs46det9pvtxmagpix/volumes/api/kong.yml
```

## Useful Commands
```bash
# Restart everything after OOM crash
systemctl restart docker && docker start coolify

# Check all containers
docker ps

# Check server memory
free -h

# Test Supabase auth is reachable
curl -s -o /dev/null -w "%{http_code}" https://db.boommedia.us/auth/v1/health

# Check Traefik routing errors
docker logs coolify-proxy --tail 20 2>&1 | grep ERR
```
