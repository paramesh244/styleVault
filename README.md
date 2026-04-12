# Aura AI

Your personal wardrobe, powered by AI. Store every piece you own — and let Aura AI tell you exactly what to wear for any occasion.

---

## What it does

aura-ai solves the "I have nothing to wear" problem by turning your wardrobe into a smart, searchable collection. Once your clothes are in, just describe your situation — a job interview, a beach day, a dinner date — and the AI suggests the perfect outfit from what you actually own.

**Core features**

- **Wardrobe manager** — Add, browse, and organize all your clothing items in one place
- **AI outfit suggestions** — Describe your situation and get outfit recommendations built from your real wardrobe
- **Outfit builder** — Manually combine pieces and save outfits for later
- **User accounts** — Your wardrobe stays private and synced across devices via Firebase Auth

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Auth & Storage | Firebase |
| Backend | Express.js |
| Database | MongoDB |

---

## Getting started

**Prerequisites:** Node.js 18+ and npm

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (see below)
cp .env.example .env

# 3. Start the dev server
npm run dev
```

The dev server runs Vite and the Express backend concurrently.

---

## Environment variables

Create a `.env` file in the project root:

```env

VITE_GEMINI_API_KEY=
VITE_MONGO_DB_URL=

# Firebase (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

```

---


## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite + Express together (recommended) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run server` | Run the Express server only |
| `npm run lint` | Lint the codebase |

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a pull request — keep changes focused and add tests where relevant

---