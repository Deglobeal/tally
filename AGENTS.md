# Tally App – Personal Workspace

This is the single source of truth for your **tally app** project.  
You are building a simple, functional counter application that users can increment, decrement, and reset – with optional extras like saving history or persistent counts.

---

## Tech Stack (already installed)

- **React 19** + **TanStack Start** (file‑based routing, SSR optional)
- **TanStack Router** & **Query** for state and data fetching
- **Tailwind CSS v4** for styling
- **Zustand** for client‑side state (localStorage for persistence)
- **Vite** as the build tool
- **Postgres** + **Better Auth** are pre‑wired if you ever need them (but start without)

All dependencies are listed in `package.json` – run `npm install` if you add more.

---

## Development Workflow

1. **Start the dev server**  
   ```bash
   npm run dev
   ```
   The app will be available at **`http://localhost:8080`** (or the port Vite assigns – check the terminal output).

2. **Edit and save** – the app reloads instantly (HMR).

3. **Build for production**  
   ```bash
   npm run build
   npm run typecheck
   ```
   Both must pass before you consider a feature done.

4. **Preview the production build**  
   ```bash
   npm run preview
   ```
   (or `npm run preview:restart` if you need to free the port)

---

## Project Structure (key files)

```
/
├── src/
│   ├── router.tsx          – named export `getRouter()`
│   ├── routes/
│   │   ├── __root.tsx      – document shell (keep `<AuthProvider>` if using auth)
│   │   └── index.tsx       – main page (your tally UI)
│   ├── styles.css          – Tailwind + custom base styles
│   └── lib/                – helpers (db, auth, etc.)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Core Rules for Your Tally App

- **Keep it simple** – start with a local counter using Zustand or useState.  
- **Persistence** – if you want counts to survive page reloads, use `localStorage`.  
- **No auth by default** – only add sign‑in if you need per‑user data or cross‑device sync.  
- **No database by default** – unless you need shared, durable data across sessions.  
- **Never hardcode secrets** – use environment variables (`.env` – but keep it out of Git).  
- **Mobile‑first** – test at 390×844 to ensure touch targets are large enough and no horizontal overflow.

---

## Design & Polish

- Use Tailwind’s utility classes to build a clean, modern UI.  
- Follow a consistent colour palette (e.g., one accent colour for the tally buttons).  
- Make it playful – add sound effects or animations if you like.  

---

## When You're Done

- Run `npm run build` and `npm run typecheck` one final time.  
- Open the production preview and manually click through the counter to verify everything works.  
- Commit and push your code – your tally app is ready to deploy (e.g., to Vercel).

---

## Remember

- This guide is for **you** – no automated sandboxes, no hidden platform scripts.  
- You control the full development environment.  
- Have fun building your tally app!
