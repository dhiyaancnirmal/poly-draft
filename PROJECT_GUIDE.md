# PolyDraft - Project Guide

**Fantasy League Platform for Prediction Markets on Base**

---

## Quick Overview

PolyDraft is a mobile-first fantasy sports drafting app (MiniApp) built with Next.js 16. It is designed to be a clean, simple, and polished experience.

**Current Status**: Base MiniApp setup with core UI components.

---

## Tech Stack

### Frontend
- **Next.js 16** - React framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **OnchainKit** - Base/Coinbase components

### Design System
- **Font**: TikTok Sans (via Google Fonts)
- **Aesthetic**: Clean, Rounded, Polished
- **Theme**: Dark Mode (Slate/Indigo/Pink)

---

## Project Structure

```
PolyDraft/
├── app/                          # Next.js App Router
│   ├── app/                     # Main App Routes (likely)
│   ├── api/                     # API Routes
│   ├── splash/                  # Splash Screen
│   ├── success/                 # Success Screen
│   ├── globals.css              # Global Styles
│   └── layout.tsx               # Root Layout
│
├── components/                   # UI Components
│   ├── features/                # Feature-specific components
│   │   ├── LeagueCard.tsx
│   │   └── MarketCard.tsx
│   ├── layout/                  # Layout components
│   │   └── BottomNav.tsx
│   └── ui/                      # Base UI components
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Skeleton.tsx
│
├── lib/                          # Utilities
│   └── utils.ts
│
├── public/                       # Static Assets
├── tailwind.config.ts           # Tailwind Configuration
└── package.json
```

---

## Development

### Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Linting

---
