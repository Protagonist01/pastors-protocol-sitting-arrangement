# ✝ Pastors' Protocol Central Sitting Arrangement
### Dignitary Seating Management System

A full-featured web application for managing seating arrangements for pastors and dignitaries at church conferences and events.

---

## 📋 Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the App](#running-the-app)
- [Building for Production](#building-for-production)
- [User Roles & Access](#user-roles--access)
- [How to Use](#how-to-use)
- [Data Storage](#data-storage)
- [Customisation](#customisation)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

- **Conference Management** — Create and manage multiple conferences with dates and venues
- **Session Management** — Each conference holds multiple sessions with independent seating plans
- **Interactive Venue Map** — Visual floor plan with clickable sections (Choir, Left, Middle, Right, Minister)
- **Seat Grid** — Row-and-column seat grid per section; click to assign or view pastors
- **Pastor Profiles** — Photo, name, title, church, extension/branch, seat assignment, and protocol notes
- **Live Attendance Tracking** — Mark pastors as Not Arrived / Arrived / Seated / Absent
- **Configurable Section Capacity** — Set exact rows and columns per section, reconfigurable per session
- **Role-Based Access** — Admin, Editor, and Protocol Member (view-only) roles
- **Search & Filter** — Filter pastor list by section and status

---

## 📁 Project Structure

```
pastors-protocol/
├── public/
│   └── favicon.svg          # App icon
├── src/
│   ├── App.jsx              # Main application (all components)
│   └── main.jsx             # React entry point
├── index.html               # HTML shell
├── package.json             # Dependencies & scripts
├── vite.config.js           # Vite build configuration
├── .eslintrc.cjs            # ESLint rules
├── .gitignore               # Git ignore list
└── README.md                # This file
```

---

## 🔧 Prerequisites

Before setting up the project, make sure you have the following installed on your computer:

### 1. Node.js (v18 or higher)
Node.js is the runtime environment required to run JavaScript tools.

- **Download:** https://nodejs.org/en/download
- Choose the **LTS (Long Term Support)** version
- After installing, open a terminal and verify:
  ```bash
  node --version     # Should show v18.x.x or higher
  npm --version      # Should show 9.x.x or higher
  ```

### 2. A Code Editor (Recommended: VS Code)
- **Download VS Code:** https://code.visualstudio.com
- **Recommended Extensions:**
  - `ES7+ React/Redux/React-Native snippets`
  - `Prettier - Code formatter`
  - `ESLint`

> **Note:** If you are using the **Antigravity IDE**, open the project folder directly from within it. All terminal commands below are run in the IDE's built-in terminal.

---

## 🚀 Installation & Setup

### Step 1 — Get the Project Files
Place the entire `pastors-protocol/` folder on your computer (e.g. your Desktop or `Documents/projects/`).

### Step 2 — Open the Project in Your IDE
- In **VS Code**: File → Open Folder → select `pastors-protocol/`
- In **Antigravity IDE**: File → Open → select `pastors-protocol/`

### Step 3 — Open a Terminal
- In VS Code: Terminal → New Terminal (shortcut: `` Ctrl+` ``)
- In Antigravity IDE: use the built-in terminal panel

Make sure the terminal is inside the project folder. You should see:
```
.../pastors-protocol $
```

### Step 4 — Install Dependencies
Run the following command:
```bash
npm install
```
This downloads all required packages into a `node_modules/` folder. This only needs to be done once (or after pulling new changes).

---

## ▶️ Running the App

Start the development server:
```bash
npm run dev
```

The terminal will show something like:
```
  VITE v5.x.x  ready in 400ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

Open your browser and go to **http://localhost:3000**

The app will automatically reload whenever you save changes to any file.

---

## 🏗️ Building for Production

When you are ready to deploy the app to a live server:

```bash
npm run build
```

This creates a `dist/` folder containing optimised static files. You can then upload the contents of `dist/` to any web hosting service (cPanel, Netlify, Vercel, etc.).

To preview the production build locally before deploying:
```bash
npm run preview
```

---

## 👥 User Roles & Access

| Role | Create Conferences | Add Pastors | Edit Seating | Update Attendance | View |
|------|:-:|:-:|:-:|:-:|:-:|
| **Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Editor** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Protocol Member** | ❌ | ❌ | ❌ | ❌ | ✅ |

### Default Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@church.org | admin123 | Administrator |
| editor@church.org | editor123 | Editor |

Anyone can self-register; new accounts automatically receive **Protocol Member** (view-only) access. An administrator must manually update the role in `localStorage` if elevated access is needed.

---

## 📖 How to Use

### Creating a Conference
1. Sign in as Admin or Editor
2. Click **+ New Conference** on the dashboard
3. Enter the conference name, date, and venue
4. Click **Create Conference**

### Adding Sessions
1. Open a conference
2. Click **+ Add Session**
3. Fill in session name, date, and time
4. Click **Add Session**

### Configuring Section Capacity
1. Open a session
2. Click **⚙ Section Capacity**
3. Adjust rows and columns for each section
4. Click **Apply Configuration**

### Assigning a Pastor to a Seat
**Method A — From the Seating Map:**
1. Click a section block on the floor plan (e.g. "Middle Section")
2. The seat grid appears below
3. Click any empty seat (shown with a dot)
4. Fill in the pastor's profile and click **Add Pastor**

**Method B — From the Pastor List:**
1. Switch to the **📋 Pastor List** tab
2. Click **+ Add Pastor**
3. Fill in the profile, select section, row, and column
4. Click **Add Pastor**

### Updating Attendance
- In the **Pastor List**, use the dropdown next to each pastor's name to change their status instantly
- Or click on a pastor to open their profile and use the status buttons

### Reconfiguring Seating from Scratch
1. Go to **⚙ Section Capacity** and reset rows/columns
2. This clears the section grid structure but does not delete pastor profiles
3. Re-assign seats as needed

---

## 💾 Data Storage

All data is stored in the browser's **localStorage** under these keys:

| Key | Contents |
|-----|----------|
| `pca:users` | User accounts and roles |
| `pca:conferences` | All conferences and their sessions |
| `pca:digs:{sessionId}` | Pastor profiles for each session |

**Important notes:**
- Data persists between browser sessions on the same device and browser
- Clearing browser data / localStorage will erase all records
- For a production system with multiple users, consider connecting a backend database (Firebase, Supabase, or a REST API)

---

## 🎨 Customisation

### Changing Section Names or Colours
Open `src/App.jsx` and edit the `SECTIONS` array near the top:
```js
const SECTIONS = [
  { id: 'choir',    label: 'Choir',           color: '#e8843a', ... },
  { id: 'left',     label: 'Left Section',    color: '#c0392b', ... },
  // Add or rename sections here
];
```

### Changing Default Seat Counts
Edit the `DEFAULT_CONFIG` object:
```js
const DEFAULT_CONFIG = {
  choir:    { rows: 5,  cols: 4 },
  middle:   { rows: 10, cols: 6 },
  // etc.
};
```

### Changing App Colours
The primary gold colour `#c9a84c` and dark navy `#070b1a` / `#0d1535` are used throughout the CSS. Use your editor's find-and-replace to update them globally in `App.jsx`.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Make sure Node.js v18+ is installed. Try `npm cache clean --force` then retry. |
| Port 3000 already in use | Edit `vite.config.js` and change `port: 3000` to `port: 3001` |
| App shows blank screen | Open browser DevTools (F12) → Console tab to see errors |
| Fonts not loading | Check your internet connection — fonts load from Google Fonts |
| Data not saving | Ensure your browser allows localStorage (not in private/incognito mode) |
| "module not found" error | Run `npm install` again to make sure all packages are present |

---

## 📦 Key Technologies

| Technology | Purpose |
|-----------|---------|
| [React 18](https://react.dev) | UI framework |
| [Vite 5](https://vitejs.dev) | Development server & build tool |
| [Google Fonts](https://fonts.google.com) | Cormorant Garamond + DM Sans typography |
| Browser localStorage | Data persistence |

---

## 📞 Support

For issues or feature requests, review the code comments in `src/App.jsx` — each section is clearly labelled with `/* ═══ SECTION NAME ═══ */` headers for easy navigation.

---

*Pastors' Protocol Central Sitting Arrangement — v1.0.0*
