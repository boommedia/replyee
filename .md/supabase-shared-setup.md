# Shared Supabase Setup — Boom Media

## Overview

All Boom Media apps share **one self-hosted Supabase instance** on DigitalOcean.
This means all apps share the same PostgreSQL database (`postgres`), the same `auth.users` table, and the same `public` schema.

**Server:** `root@159.65.235.140`  
**Supabase Studio:** https://db.boommedia.us  
**Coolify docker-compose:** `/data/coolify/services/cdplj9vs46det9pvtxmagpix/docker-compose.yml`

---

## Table Ownership by App

Each app owns specific tables. **Never run migrations that touch another app's tables.**

### Bloggy (bloggy.online)
| Table | Key columns |
|-------|-------------|
| `clients` | `id`, `name`, `created_by`, `contact_email`, `wp_url`, `brand_voice` |
| `posts` | `id`, `title`, `content`, `client_id`, `created_by`, `approval_status` |
| `subscriptions` | `user_id`, `plan`, `sites_limit` |
| `client_integrations` | WordPress, social, etc. |
| `topic_queue`, `campaigns` | Autoblog scheduling |
| `keyword_lists`, `keyword_rankings`, `keyword_searches` | SEO tools |

### Servvee (bail bond app)
| Table | Key columns |
|-------|-------------|
| `bonds` | bail bond records |
| `activities`, `check_ins` | client tracking |
| `court_dates`, `payments` | financial/legal |
| `profiles` | agent profiles |

### Other apps sharing this instance
- Restaurant ordering app (`menu_items`, `orders`, `customers`, `restaurant_settings`, etc.)
- Marketing/reporting tools (`gsc_data`, `campaigns`, `kpis`)

---

## Critical Rules

### 1. Never drop or alter a table you don't own
The `clients` table is a known collision point — both Bloggy and Servvee historically used this name.  
**Bloggy owns `public.clients`.** Servvee was migrated off it in May 2026.

### 2. Always prefix new tables with your app name if there's any ambiguity
E.g., `blog_clients` not `clients` if there's any chance of collision.

### 3. Run migrations in Supabase Studio, not via raw psql from another app's codebase
Each app should only run its own migrations via its own deployment pipeline.

---

## What Happened (May 2026 Incident)

Servvee's bail bond migration ran against the shared database and **replaced Bloggy's `clients` table** with a bail bond schema (`defendant_name`, `case_number`, etc.). All Bloggy client records were wiped.

**Recovery:** Clients were reconstructed from post titles and re-inserted with their original UUIDs. WordPress credentials and contact emails need to be re-entered manually.

**Prevention:** 
- Automated daily `pg_dump` backup now runs at 3am EST
- Backups stored at `/var/backups/supabase/` (14-day retention)
- Backup script: `/usr/local/bin/supabase-backup.sh`

---

## Database Backups

**Schedule:** Daily at 3:00 AM server time  
**Location:** `/var/backups/supabase/bloggy-YYYY-MM-DD.sql.gz`  
**Retention:** 14 days  
**Log:** `/var/log/supabase-backup.log`  

To restore from backup:
```bash
# SSH to server
ssh root@159.65.235.140

# List available backups
ls -lh /var/backups/supabase/

# Restore (CAUTION: this overwrites the database)
gunzip -c /var/backups/supabase/bloggy-2026-05-27.sql.gz | \
  docker exec -i supabase-db-cdplj9vs46det9pvtxmagpix psql -U postgres -d postgres
```

To run a manual backup:
```bash
/usr/local/bin/supabase-backup.sh
```

---

## Auth

All apps share the same `auth.users` table. A user logging into Bloggy with `eric@boommedia.us` gets the same UUID (`85e7ffc0-8114-44dd-a682-b036d79e6071`) across all apps.

RLS policies must use `auth.uid()` and each app must filter its own rows by `created_by = auth.uid()` or equivalent.

**Do not create duplicate users** — if a user exists in auth, adding them again via a different OAuth provider creates a new UUID and breaks all their existing data associations.

---

## SSH & Container Access

```bash
# SSH to server
ssh root@159.65.235.140

# Run psql against the database
docker exec -it supabase-db-cdplj9vs46det9pvtxmagpix psql -U postgres -d postgres

# Restart auth container after config changes
docker compose -f /data/coolify/services/cdplj9vs46det9pvtxmagpix/docker-compose.yml \
  up -d --no-deps supabase-auth-cdplj9vs46det9pvtxmagpix

# Note: docker-compose.yml has chattr +i set — run this before editing:
chattr -i /data/coolify/services/cdplj9vs46det9pvtxmagpix/docker-compose.yml
# And after:
chattr +i /data/coolify/services/cdplj9vs46det9pvtxmagpix/docker-compose.yml
```
