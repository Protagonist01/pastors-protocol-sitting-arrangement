# AGENT_CONTEXT.md
# Pastors' Protocol Central Sitting Arrangement — Full System Context

> **Read this entire document before touching any file in this codebase.**
> This document is the single source of truth for architecture, data flow,
> auth logic, role rules, naming conventions, and task priorities.
> When in doubt, the answer is in here.

---

## 0. WHO THIS APP IS FOR (read first)

This is an internal tool used exclusively by **church protocol officers**.
The entire user base is protocol staff — nobody from the general public
uses this app. There are no "church members" or "congregants" signing up.

The three roles exist purely as a **permission tier** within the protocol team:

| Role | Who they are | What they can do |
|------|-------------|-----------------|
| `admin` | Senior protocol officer or system owner | Everything. Also promotes/demotes other users. |
| `editor` | Protocol officer assigned data-entry duties | Create conferences, sessions, manage dignitaries |
| `protocol` | Junior protocol officer / observer | View-only. Can browse all data but change nothing. |

**Signup is open but always produces a `protocol` (view-only) account.**
Elevation to `editor` or `admin` only happens via the Admin Access Control UI
or directly in Supabase. There is no self-service role escalation.

**Dignitaries are NOT limited to pastors.**
The system handles any dignitary attending a church conference —
apostles, bishops, government officials, guests of honour, etc.
Their title (e.g. "Presiding Bishop", "Minister of Interior", "H.E.") is a
free-text field set at profile creation time, not a fixed dropdown.

---

## 1. TECH STACK

```
Frontend          React 18 + Vite 5
Styling           Plain CSS-in-JS (inline styles + injected <style> tag)
Fonts             Google Fonts — Cormorant Garamond + DM Sans
State             React useState / prop drilling (no Redux / Zustand)
Persistence       Supabase (PostgreSQL) via FastAPI — NOT localStorage
                  localStorage was used in v1 prototype only; do not use it

Backend           FastAPI (Python 3.11+)
Auth              Supabase Auth (email + password)
                  JWT issued by Supabase, verified by FastAPI middleware
Database          Supabase PostgreSQL
Storage           Supabase Storage (dignitary profile photos)
ORM               SQLAlchemy (async) OR Supabase Python client — see Section 4
```

---

## 2. REPOSITORY STRUCTURE

```
root/
├── frontend/                        # React + Vite app
│   ├── src/
│   │   ├── App.jsx                  # Root component, routing, global state
│   │   ├── main.jsx                 # ReactDOM entry point
│   │   ├── api/
│   │   │   └── client.js            # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Supabase session + user role context
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx         # Login / Register
│   │   │   ├── Dashboard.jsx        # Conference list
│   │   │   ├── ConferencePage.jsx   # Sessions list for one conference
│   │   │   └── SessionPage.jsx      # Seating map + dignitary list
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── VenueMap.jsx         # Floor plan SVG-style layout
│   │   │   ├── SeatGrid.jsx         # Row × column seat grid
│   │   │   ├── DignitaryCard.jsx    # Card in list view
│   │   │   ├── DignitaryForm.jsx    # Add / Edit dignitary modal
│   │   │   ├── DignitaryProfile.jsx # View profile modal
│   │   │   ├── ConfForm.jsx         # Add / Edit conference modal
│   │   │   ├── SessForm.jsx         # Add / Edit session modal
│   │   │   ├── CfgForm.jsx          # Section capacity config modal
│   │   │   ├── AccessControl.jsx    # Admin: promote/demote users UI
│   │   │   └── Modal.jsx            # Generic modal wrapper
│   │   └── utils/
│   │       └── format.js            # fmtDate, statusColor, etc.
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                         # FastAPI app
│   ├── main.py                      # FastAPI app instance, CORS, router mounting
│   ├── auth.py                      # JWT verification via Supabase public key
│   ├── dependencies.py              # get_current_user, require_editor, require_admin
│   ├── routers/
│   │   ├── conferences.py           # CRUD for conferences
│   │   ├── sessions.py              # CRUD for sessions
│   │   ├── dignitaries.py           # CRUD for dignitary profiles
│   │   └── users.py                 # Admin: list users, change roles
│   ├── models.py                    # SQLAlchemy ORM models (mirrors Supabase schema)
│   ├── schemas.py                   # Pydantic request/response models
│   ├── database.py                  # Async engine + session factory
│   └── requirements.txt
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Full DB schema with RLS policies
│
└── AGENT_CONTEXT.md                 # This file
```

---

## 3. AUTHENTICATION FLOW

### 3.1 How Supabase Auth works in this app

Supabase Auth handles all credential verification.
FastAPI never stores passwords — it only verifies JWTs.

```
User submits email + password (frontend)
        ↓
supabase.auth.signInWithPassword({ email, password })
        ↓
Supabase returns: { session: { access_token, refresh_token }, user: { id, email } }
        ↓
Frontend stores access_token in memory (AuthContext) — NOT localStorage
        ↓
Every API call to FastAPI includes:  Authorization: Bearer <access_token>
        ↓
FastAPI middleware decodes + verifies JWT using Supabase JWT secret
        ↓
FastAPI extracts user_id from token sub claim
        ↓
FastAPI queries profiles table for role
        ↓
Request proceeds or 403 Forbidden
```

### 3.2 Registration flow

```
User fills name + email + password
        ↓
supabase.auth.signUp({ email, password, options: { data: { full_name } } })
        ↓
Supabase creates auth.users record
        ↓
Supabase trigger (handle_new_user) fires automatically
        ↓
Inserts row into public.profiles:
  { id: <auth.users.id>, full_name, role: 'protocol', created_at }
        ↓
User is now logged in with role = 'protocol'
```

**IMPORTANT:** The trigger that auto-creates the profile row must be present
in the Supabase migration. See Section 6.1.

### 3.3 Admin account creation

Admins are NOT created through the signup form.
The very first admin must be set directly in Supabase:

1. The person signs up normally (gets `protocol` role)
2. An Anthropic/system owner runs this SQL in Supabase SQL editor:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = '<user_uuid>';
   ```
3. After that, this admin can promote others via the Access Control UI.

### 3.4 Role promotion (Admin Access Control UI)

The `AccessControl` component (admin-only) shows a table of all users.
Admin clicks a user's role dropdown → selects `editor` or `protocol` →
frontend calls `PATCH /api/users/{user_id}/role` with `{ role: "editor" }` →
FastAPI verifies caller is `admin` → updates `public.profiles` → returns updated user.

Admins cannot demote themselves (guarded in both frontend and backend).

---

## 4. DATABASE SCHEMA

All tables live in the `public` schema in Supabase PostgreSQL.
Row Level Security (RLS) is ENABLED on all tables.

### 4.1 profiles

```sql
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'protocol'
                CHECK (role IN ('admin', 'editor', 'protocol')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 conferences

```sql
CREATE TABLE public.conferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  date        DATE,
  venue       TEXT,
  description TEXT,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 sessions

```sql
CREATE TABLE public.sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id    UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  date             DATE,
  time             TIME,
  description      TEXT,
  seating_config   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

`seating_config` stores the section grid blueprint:
```json
{
  "choir":    { "rows": 5,  "cols": 4 },
  "left":     { "rows": 8,  "cols": 5 },
  "middle":   { "rows": 10, "cols": 6 },
  "right":    { "rows": 8,  "cols": 5 },
  "minister": { "rows": 6,  "cols": 5 }
}
```

### 4.4 dignitaries

```sql
CREATE TABLE public.dignitaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  title        TEXT NOT NULL,          -- free text: "Presiding Bishop", "H.E.", etc.
  church       TEXT,
  extension    TEXT,                   -- branch / district / area
  section      TEXT,                   -- choir | left | middle | right | minister
  row_num      INTEGER,
  col_num      INTEGER,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','arrived','seated','absent')),
  notes        TEXT,
  picture_url  TEXT,                   -- Supabase Storage public URL
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, section, row_num, col_num)  -- no double-booking
);
```

**Key design decisions:**
- `title` is always free text — never a dropdown. Set at creation time.
- `UNIQUE` constraint on (session_id, section, row_num, col_num) prevents
  two dignitaries sharing the same seat within a session.
- `picture_url` stores the full public URL from Supabase Storage,
  not base64. Photos are uploaded separately before or during profile save.

### 4.5 Supabase Storage

Bucket name: `dignitary-photos`
Access: Public read, authenticated write
File naming: `{session_id}/{dignitary_id}.jpg`

---

## 5. ROW LEVEL SECURITY POLICIES

RLS ensures the database itself enforces permissions as a second layer
(FastAPI role checks are the first layer).

```sql
-- profiles: users can read all, update only their own (except role field)
CREATE POLICY "profiles_read_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- conferences: all authenticated users can read
CREATE POLICY "conferences_read"    ON public.conferences FOR SELECT
  USING (auth.role() = 'authenticated');
-- only admin/editor can insert/update/delete (enforced by FastAPI, RLS as backup)
CREATE POLICY "conferences_write"   ON public.conferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','editor')
    )
  );

-- sessions: same pattern as conferences
CREATE POLICY "sessions_read"  ON public.sessions FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "sessions_write" ON public.sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
  );

-- dignitaries: same pattern
CREATE POLICY "dignitaries_read"  ON public.dignitaries FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "dignitaries_write" ON public.dignitaries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
  );
```

---

## 6. BACKEND — FastAPI

### 6.1 Environment variables (backend/.env)

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # service role key — never expose to frontend
SUPABASE_JWT_SECRET=your-jwt-secret     # from Supabase project settings → API → JWT Secret
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
STORAGE_BUCKET=dignitary-photos
```

### 6.2 JWT Verification (auth.py)

```python
# FastAPI verifies Supabase JWTs using the project's JWT secret
# The token contains: sub (user UUID), role (always "authenticated"), exp, etc.
# We then look up the actual app role from public.profiles

import jwt
from fastapi import HTTPException, Header

async def verify_token(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload["sub"]   # user UUID
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
```

### 6.3 Dependency injection (dependencies.py)

```python
async def get_current_user(user_id: str = Depends(verify_token), db = Depends(get_db)):
    profile = await db.get(Profile, user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile

async def require_editor(user = Depends(get_current_user)):
    if user.role not in ("admin", "editor"):
        raise HTTPException(403, "Editor or Admin access required")
    return user

async def require_admin(user = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user
```

### 6.4 API Endpoints

Base URL: `/api`

#### Auth / Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | any role | Get own profile + role |
| GET | `/api/users` | admin | List all users (for Access Control UI) |
| PATCH | `/api/users/{user_id}/role` | admin | Change a user's role |

#### Conferences

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/conferences` | any role | List all conferences |
| GET | `/api/conferences/{id}` | any role | Get one conference + sessions list |
| POST | `/api/conferences` | editor+ | Create conference |
| PATCH | `/api/conferences/{id}` | editor+ | Update conference |
| DELETE | `/api/conferences/{id}` | admin | Delete conference |

#### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/conferences/{conf_id}/sessions` | any role | List sessions for a conference |
| GET | `/api/sessions/{id}` | any role | Get one session |
| POST | `/api/conferences/{conf_id}/sessions` | editor+ | Create session |
| PATCH | `/api/sessions/{id}` | editor+ | Update session (name/date/time/description) |
| PATCH | `/api/sessions/{id}/seating-config` | editor+ | Update section capacity grid |
| DELETE | `/api/sessions/{id}` | admin | Delete session |

#### Dignitaries

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sessions/{session_id}/dignitaries` | any role | List all dignitaries in session |
| GET | `/api/dignitaries/{id}` | any role | Get one dignitary profile |
| POST | `/api/sessions/{session_id}/dignitaries` | editor+ | Add dignitary |
| PATCH | `/api/dignitaries/{id}` | editor+ | Edit dignitary profile |
| PATCH | `/api/dignitaries/{id}/status` | editor+ | Update arrival status only |
| DELETE | `/api/dignitaries/{id}` | admin | Remove dignitary |

#### Photo Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/dignitaries/{id}/photo` | editor+ | Upload photo → Supabase Storage → updates picture_url |

### 6.5 Pydantic Schemas (schemas.py)

```python
# Dignitary — note: title is plain text, not an enum
class DignitaryCreate(BaseModel):
    name: str
    title: str                          # free text, mandatory
    church: Optional[str] = None
    extension: Optional[str] = None     # branch / district / area
    section: str
    row_num: Optional[int] = None
    col_num: Optional[int] = None
    notes: Optional[str] = None

class DignitaryStatusUpdate(BaseModel):
    status: Literal["pending", "arrived", "seated", "absent"]

class DignitaryResponse(DignitaryCreate):
    id: UUID
    session_id: UUID
    status: str
    picture_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
```

---

## 7. FRONTEND — REACT

### 7.1 Environment variables (frontend/.env)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...           # anon/public key — safe to expose
VITE_API_BASE_URL=http://localhost:8000  # FastAPI base URL
```

### 7.2 Supabase client (frontend)

```js
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

The Supabase client is used ONLY for auth operations:
- `supabase.auth.signUp()`
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signOut()`
- `supabase.auth.getSession()` (on app load to restore session)
- `supabase.auth.onAuthStateChange()` (listener in AuthContext)

All data operations (conferences, sessions, dignitaries) go through FastAPI,
NOT through the Supabase JS client directly.

### 7.3 Axios API client (src/api/client.js)

```js
import axios from 'axios'
import { supabase } from '../lib/supabaseClient'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Handle 401 → sign out
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
```

### 7.4 AuthContext (src/context/AuthContext.jsx)

The AuthContext holds:
- `session` — Supabase session object (contains access_token)
- `user` — the full profile from `GET /api/users/me` (includes `role`)
- `loading` — bool, true until session is restored on app load
- `signIn(email, pass)` — calls supabase.auth.signInWithPassword, then fetches /me
- `signUp(name, email, pass)` — calls supabase.auth.signUp
- `signOut()` — calls supabase.auth.signOut, clears state

**Critical:** after signIn, the frontend immediately calls `GET /api/users/me`
to get the role. The Supabase JWT itself does not contain the app role.

```js
// Pattern used everywhere to protect UI
const { user } = useAuth()
const canEdit = user?.role === 'admin' || user?.role === 'editor'
```

### 7.5 Page / Component Responsibilities

**AuthPage** — handles both login and register forms. After success,
AuthContext updates and App.jsx redirects to Dashboard.

**Dashboard** — fetches `GET /api/conferences` on mount.
Renders conference cards. Shows "+ New Conference" button only if `canEdit`.

**ConferencePage** — receives conference ID from URL/state.
Fetches `GET /api/conferences/{id}` to get sessions list.

**SessionPage** — the main working page. On mount fetches:
- `GET /api/sessions/{id}` (session + seatingConfig)
- `GET /api/sessions/{id}/dignitaries` (all dignitary profiles for this session)
Maintains local state for both. Updates propagate to the UI optimistically
then confirm via API response.

**VenueMap** — purely presentational. Receives `seatingConfig` and `dignitaries`
as props, renders the floor plan, emits `onSectionClick(sectionId)`.

**SeatGrid** — receives `sectionId`, `seatingConfig`, `dignitaries`, `canEdit`.
Renders the grid. On seat click: if occupied → opens DignitaryProfile modal;
if empty + canEdit → opens DignitaryForm with pre-filled section/row/col.

**AccessControl** — admin-only modal/page. Fetches `GET /api/users`.
Renders a table of all users with role dropdowns.
On change → calls `PATCH /api/users/{id}/role`.
Hides admin's own row's role selector to prevent self-demotion.

---

## 8. KNOWN ISSUES IN CURRENT CODEBASE

The frontend and backend are currently "disjointed" — meaning:

1. **Frontend still uses localStorage** instead of API calls.
   Every `sg()` / `ss()` call in App.jsx must be replaced with `api.get()` / `api.post()` etc.

2. **No AuthContext exists yet.** App.jsx has inline auth state.
   This needs to be extracted to `src/context/AuthContext.jsx` using Supabase.

3. **No `src/api/client.js` exists.** Axios is not installed or configured.
   Install with `npm install axios @supabase/supabase-js`.

4. **Role is not fetched from backend.** Currently derived from a hard-coded
   localStorage user object. Must come from `GET /api/users/me` after login.

5. **Photo upload stores base64 in state.** Must be changed to upload
   to Supabase Storage via `POST /api/dignitaries/{id}/photo` and store the URL.

6. **Backend routers are not wired to `main.py`.**
   Routers exist as files but are not imported/mounted.

7. **CORS is not configured in `main.py`.**
   Add `CORSMiddleware` allowing the frontend origin.

8. **Dignitary form has `organization` field** (removed in v1 update but may
   still exist in some branch). Must be `church` + `extension` only.
   `title` must always be a free-text input — never a select/enum.

9. **Access Control UI does not exist yet.** Needs to be built
   as `src/components/AccessControl.jsx`, accessible from the header
   when `user.role === 'admin'`.

---

## 9. SECTIONS REFERENCE

These are the five open (assignable) seating sections.
`vvip` and `altar` are closed — they appear on the floor plan
but dignitaries cannot be assigned to them through the UI.

```js
const SECTIONS = [
  { id: 'choir',    label: 'Choir',            color: '#e8843a' },
  { id: 'left',     label: 'Left Section',     color: '#c0392b' },
  { id: 'middle',   label: 'Middle Section',   color: '#2471a3' },
  { id: 'right',    label: 'Right Section',    color: '#b8920a' },
  { id: 'minister', label: 'Minister Section', color: '#4a5568' },
  // --- closed ---
  { id: 'vvip',     label: 'SETMAN / VVIP / CEC', closed: true },
  { id: 'altar',    label: 'Altar',               closed: true },
]
```

Default grid sizes (can be overridden per-session in `seating_config`):
```
choir:    5 rows × 4 cols  = 20 seats
left:     8 rows × 5 cols  = 40 seats
middle:  10 rows × 6 cols  = 60 seats
right:    8 rows × 5 cols  = 40 seats
minister: 6 rows × 5 cols  = 30 seats
```

---

## 10. DIGNITARY STATUS LIFECYCLE

```
(created) → pending → arrived → seated
                   ↘            ↗
                     absent ────
```

Status can be changed to any value at any time by an editor or admin.
Protocol members cannot change status — the status dropdown/buttons are
hidden for `protocol` role.

Status colours used throughout UI:
```js
pending: '#64748b'   // grey
arrived: '#f59e0b'   // amber
seated:  '#22c55e'   // green
absent:  '#ef4444'   // red
```

---

## 11. DESIGN SYSTEM TOKENS

```css
--bg-deep:     #070b1a   /* page background */
--bg-card:     #0d1535   /* card background */
--border:      #1e3068   /* default border */
--gold:        #c9a84c   /* primary accent — headings, CTA buttons */
--gold-light:  #e8c97a   /* gradient end for gold buttons */
--text-primary: #e0e8ff  /* main text */
--text-muted:  #8899cc   /* secondary text */
--text-dim:    #4a5980   /* tertiary / labels */

/* Font stack */
--font-display: 'Cormorant Garamond', serif  /* headings, titles */
--font-body:    'DM Sans', sans-serif        /* everything else */
```

---

## 12. TASK PRIORITY ORDER FOR AGENT

When working on this codebase, tackle in this order:

1. **Install missing frontend packages**
   `npm install axios @supabase/supabase-js`

2. **Create Supabase client** → `src/lib/supabaseClient.js`

3. **Create AuthContext** → `src/context/AuthContext.jsx`
   Wrap `<App>` in `<AuthProvider>` in `main.jsx`

4. **Create API client** → `src/api/client.js`
   Axios instance with JWT interceptor

5. **Fix backend `main.py`** — add CORS, mount all routers

6. **Wire all frontend data calls to API** — replace all localStorage
   reads/writes with axios calls to FastAPI endpoints

7. **Fix dignitary form** — ensure `title` is free text, remove any
   `organization` field, confirm `church` + `extension` fields exist

8. **Build Access Control UI** — `src/components/AccessControl.jsx`
   admin-only, accessible from header

9. **Fix photo upload** — upload to Supabase Storage via API,
   store URL not base64

10. **Supabase migration** — ensure `001_initial_schema.sql` matches
    Section 4 of this document exactly, including the `handle_new_user` trigger

---

## 13. SUPABASE TRIGGER (must exist in migration)

```sql
-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unnamed'),
    'protocol'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 14. CORS CONFIGURATION (backend/main.py)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",        # Vite dev server
        "https://your-production-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 15. WHAT THE AGENT MUST NEVER DO

- Never store the `SUPABASE_SERVICE_ROLE_KEY` in any frontend file or `.env` that
  gets committed to version control or served to the browser.
- Never add a role selection field to the registration form.
  Role is always set server-side to `'protocol'` on signup.
- Never let a `protocol`-role user reach an edit endpoint —
  enforce this in FastAPI dependencies, not just in frontend CSS/conditional rendering.
- Never use localStorage for persistent data — that was the v1 prototype only.
- Never add a fixed list of titles for dignitaries.
  Title is always a free-text input.
- Never hardcode UUIDs or credentials anywhere in source files.
- Never skip the unique seat constraint check —
  two dignitaries must not share the same seat in the same session.

---

*Last updated: generated by Claude for the Pastors' Protocol Central Sitting Arrangement project.*
*Treat this document as the authoritative spec. Update it when architecture decisions change.*
