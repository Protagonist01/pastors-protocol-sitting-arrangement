# PROJECT_BRIEF.md
# Pastors' Protocol Central Sitting Arrangement — Quick Reference

---

## What is this app?
An internal seating management tool for **church protocol officers**.
They use it to plan and track where dignitaries sit during church conferences.
Protocol officers are the ONLY users — nobody from the general public signs up.

---

## Who are the users?

| Role | How created | Permissions |
|------|------------|-------------|
| `admin` | Manually set in Supabase by system owner | Full access + manage user roles |
| `editor` | Promoted by admin via Access Control UI | Create/edit conferences, sessions, dignitaries |
| `protocol` | Anyone who self-registers | View only — no create/edit/delete |

**Signup always produces a `protocol` account. Role elevation is admin-only.**

---

## Stack at a glance

```
React 18 + Vite   →  Frontend
FastAPI            →  Backend API
Supabase Auth      →  Login / Registration / JWT
Supabase Postgres  →  All persistent data
Supabase Storage   →  Dignitary photos
```

---

## Key rules

1. `title` for a dignitary is **always free text** (e.g. "Presiding Bishop", "H.E.", "Governor")
2. Fields on a dignitary: `name`, `title`, `church`, `extension` (branch/district), `section`, `row`, `col`, `status`, `notes`, `photo`
3. **No `organization` field** — replaced by `church` + `extension`
4. Seat uniqueness: one dignitary per seat per session (DB constraint enforced)
5. Status values: `pending` → `arrived` → `seated` / `absent`
6. Sections: `choir`, `left`, `middle`, `right`, `minister` (open) + `vvip`, `altar` (closed/display only)
7. Auth token lives in memory via AuthContext — **never localStorage**
8. All data API calls go through **FastAPI** — Supabase JS client is for auth only

---

## Current problems to fix (in order)

1. Frontend still reads/writes **localStorage** — replace with Axios API calls
2. **AuthContext** does not exist — create it with Supabase session management
3. **Axios client** missing — create with JWT interceptor
4. Backend **CORS** not configured — add CORSMiddleware to main.py
5. Backend **routers not mounted** in main.py
6. **Role not fetched from backend** — call `GET /api/users/me` after login
7. **Access Control UI** missing — build admin component to promote/demote users
8. **Photo upload** stores base64 — change to Supabase Storage upload
9. **Dignitary form** may still have old `organization` field — fix to `church` + `extension`
10. **Supabase migration** — add `handle_new_user` trigger if missing

---

## Core API endpoints

```
GET    /api/users/me                              → own profile + role
GET    /api/users                                 → [admin] all users
PATCH  /api/users/{id}/role                       → [admin] change role

GET    /api/conferences                           → list all
POST   /api/conferences                           → [editor+] create
PATCH  /api/conferences/{id}                      → [editor+] update
DELETE /api/conferences/{id}                      → [admin] delete

GET    /api/conferences/{conf_id}/sessions        → list sessions
POST   /api/conferences/{conf_id}/sessions        → [editor+] create
PATCH  /api/sessions/{id}                         → [editor+] update
PATCH  /api/sessions/{id}/seating-config          → [editor+] update grid
DELETE /api/sessions/{id}                         → [admin] delete

GET    /api/sessions/{session_id}/dignitaries     → list dignitaries
POST   /api/sessions/{session_id}/dignitaries     → [editor+] add
PATCH  /api/dignitaries/{id}                      → [editor+] edit profile
PATCH  /api/dignitaries/{id}/status               → [editor+] update status
DELETE /api/dignitaries/{id}                      → [admin] delete
POST   /api/dignitaries/{id}/photo                → [editor+] upload photo
```

---

## Environment variables needed

**backend/.env**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
DATABASE_URL=
STORAGE_BUCKET=dignitary-photos
```

**frontend/.env**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000
```

---

## For full details → see AGENT_CONTEXT.md
