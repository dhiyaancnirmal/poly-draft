# PolyDraft - Project Guide

**Fantasy League Platform for Prediction Markets on Base**

---

## Quick Overview

PolyDraft is a Next.js 16 app that gamifies prediction markets with fantasy draft mechanics. It serves as a social UI and scoring layer on top of Polymarket, with two modes: Social Fantasy (virtual points) and Live Builder Mode (real trades via Polymarket Builder SDK).

**Current Status**: MVP in progress with working UI, Polymarket API integration, real-time WebSocket data, and dev mode for testing.

---

## Table of Contents
1. [Current State](#current-state)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [Core Features](#core-features)
6. [Design System](#design-system)
7. [Next Steps](#next-steps)

---

## Current State

### What's Working
- ✅ Next.js 16 app with mobile-first UI (448px max-width)
- ✅ Draft room page with market selection
- ✅ League browsing with cards
- ✅ Profile page with stats
- ✅ Polymarket Gamma API integration (lib/api/polymarket.ts)
- ✅ CLOB WebSocket for real-time token prices (lib/api/clob-websocket.ts)
- ✅ RTDS WebSocket for market updates (lib/api/rtds-websocket.ts)
- ✅ Dev mode with sidebar for testing (components/DevSidebar.tsx)
- ✅ Dark theme with coral/red accents
- ✅ Bottom navigation bar
- ✅ Real-time price updates in MarketCard components
- ✅ Analytics page with market trends

### In Progress
- 🔨 Supabase integration for league state management
- 🔨 Snake draft implementation with WebSocket synchronization
- 🔨 League creation flow
- 🔨 Wallet integration (OnchainKit setup)
- 🔨 Market slate filtering (active, date-relevant, min liquidity)

### Not Started
- ❌ Smart contract (LeagueRegistry.sol) on Base
- ❌ Base blockchain integration
- ❌ Polymarket Builder SDK integration for Live Mode
- ❌ NFT trophy minting
- ❌ Scoring and settlement system
- ❌ In-league swap mechanism
- ❌ Geo-blocking for Live Mode
- ❌ Token-gated leagues

---

## Tech Stack

### Frontend
- **Next.js 16.0.6** - React framework with App Router (Turbopack)
- **React 19.2.0** - Latest React
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 3.4.1** - Styling
- **Lucide React 0.555.0** - Icons

### Blockchain (Installed, Partial Integration)
- **OnchainKit 1.1.2** - Base/Coinbase components
- **Wagmi 2.19.5** - React hooks for Ethereum
- **Viem 2.41.2** - TypeScript Ethereum library
- **TanStack Query 5.90.11** - Data fetching

### MiniApp (Installed, Not Yet Integrated)
- **Farcaster MiniApp SDK 0.2.1**
- **Farcaster Quick Auth 0.0.8**

### APIs & Data
- **Polymarket Gamma API** - Market data, odds, resolution status
- **Polymarket CLOB WebSocket** - Real-time token price updates
- **Polymarket RTDS WebSocket** - Market updates and crypto prices
- **WebSocket (ws 8.18.0)** - WebSocket client for real-time data

### Backend (Planned)
- **Supabase** - Off-chain league state, player picks, draft sync
- **Polymarket Builder SDK** - Gasless order execution (Live Mode)

---

## Project Structure

```
PolyDraft/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home - leagues overview
│   ├── draft/page.tsx           # Draft room
│   ├── leagues/
│   │   ├── page.tsx             # League browser
│   │   └── [id]/page.tsx        # League details
│   ├── leaderboard/page.tsx     # Leaderboard
│   ├── profile/page.tsx         # User profile
│   ├── rewards/page.tsx         # Rewards & achievements
│   └── api/polymarket/route.ts  # Polymarket API proxy (planned)
│
├── components/                   # UI components
│   ├── ConnectWallet.tsx
│   ├── DraftSlots.tsx
│   ├── LeaderboardRow.tsx
│   ├── LeagueCard.tsx
│   ├── MarketCard.tsx           # With live price updates
│   ├── Navbar.tsx               # Bottom nav
│   ├── DevSidebar.tsx           # Dev mode controls
│   ├── ModeToggle.tsx
│   └── ui/                      # Base components
│       ├── Button.tsx
│       └── Skeleton.tsx
│
├── lib/
│   ├── api/
│   │   ├── polymarket.ts        # Polymarket Gamma API client
│   │   ├── types.ts             # API types
│   │   ├── websocket.ts         # WebSocket types
│   │   ├── clob-websocket.ts    # CLOB WebSocket client
│   │   ├── rtds-websocket.ts    # RTDS WebSocket types
│   │   ├── rtds-websocket-client.ts # RTDS WebSocket client
│   │   └── realtime-types.ts    # Real-time data types
│   ├── hooks/
│   │   ├── usePolymarket.ts     # Polymarket data hook
│   │   ├── useCLOBWebSocket.ts  # CLOB WebSocket hook
│   │   ├── useRTDSWebSocket.ts  # RTDS WebSocket hook
│   │   └── useRealtimeMarkets.ts # Combined real-time data hook
│   └── data/
│       └── dummyData.ts         # Mock data for testing
│
├── docs/                         # Documentation
│   ├── POLYMARKET_API.md        # Polymarket API reference
│   ├── CLOB_WEBSOCKET.md        # CLOB WebSocket implementation
│   └── RTDS_WEBSOCKET.md        # RTDS WebSocket implementation
│
├── .env.example                  # Environment template
├── tailwind.config.ts
├── package.json
├── README.md                     # Product specification
└── PROJECT_GUIDE.md             # This file
```

---

## Development Setup

### Quick Start

```bash
# Install dependencies
npm install

# Set up environment (optional)
cp .env.example .env

# Run dev server
npm run dev
# Open http://localhost:3000
```

### Environment Variables

```env
# Polymarket API (optional - falls back to dummy data)
POLYMARKET_API_KEY=your_api_key

# Supabase (planned)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Base/OnchainKit (for blockchain integration)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=

# Polymarket Builder SDK (for Live Mode)
POLYMARKET_BUILDER_ID=
```

### Dev Commands

- `npm run dev` - Start dev server (Turbopack)
- `npm run build` - Production build
- `npm run start` - Run production build
- `npm run lint` - ESLint check

### Dev Mode Features

Press "M" key to toggle dev sidebar with:
- Toggle between dummy data and Polymarket API
- WebSocket connection status indicators
- Theme controls
- Testing utilities

---

## Core Features

### Product Modes

**Mode A: Social Fantasy (Default)**
- Virtual points only, no real trades
- +1 point for correct outcome
- US-safe, reputation tracking only
- No user funds held

**Mode B: Live Builder Mode (Restricted)**
- Real Polymarket orders via Builder SDK
- Gasless execution on Polygon
- Point-based scoring + real PnL
- Geo-gated (non-US)

### User Flows (Planned)

1. **League Creation**
   - Connect wallet (Base)
   - Set league parameters (duration, max players, mode)
   - Record in Supabase + minimal on-chain record

2. **Snake Draft**
   - Synchronous, 30-45 seconds per pick
   - Small market slate (3 markets)
   - Pick Market + Outcome Side (YES/NO)
   - Auto-pick on timeout

3. **In-League Swaps**
   - Flip drafted side (max 1 swap/pick)
   - Live Mode: Execute opposite trade on Polymarket

4. **Scoring & Settlement**
   - +1 point if final side matches resolution
   - Backend commits winner on-chain
   - Winner mints ERC-721 trophy NFT

### Pages

- **Home (/)** - League overview with cards
- **Draft (/draft)** - Draft room with market selection and live prices
- **Leagues (/leagues)** - Browse leagues, individual league pages
- **Leaderboard (/leaderboard)** - Rankings
- **Rewards (/rewards)** - Achievements and trophies
- **Profile (/profile)** - User stats with grid layout

### Components

- **Bottom Navigation** - 5-tab bar (Home, Leagues, News, Analytics, Profile)
- **League Cards** - Entry fee, members, prize pool, status badges
- **Draft Slots** - Visual draft board with pick indicator
- **Market Cards** - Prediction markets with YES/NO options and live prices
- **Dev Sidebar** - Testing and development controls

---

## Design System

### Layout
- **Mobile-first**: max-width 448px (28rem)
- **Portrait orientation** optimized
- **Bottom navigation** for one-handed use
- **4px spacing base** for mobile

### Colors
```
Background: #1a1b26  (dark slate)
Surface:    #242530  (lighter slate for cards)
Primary:    #ff6b9d  (coral for CTAs)
Success:    #10b981  (green)
Warning:    #f59e0b  (amber)
Text:       #ffffff  (white)
Text Muted: #a1a1aa  (gray)
```

### Typography
- System fonts (Arial, Helvetica, sans-serif)
- Headings: 18-24px bold
- Body: 14px regular
- Small: 10-12px for metadata

### Components
- **Cards**: Surface bg, 12px rounded, subtle border, glow on hover
- **Buttons**: Primary (coral) or secondary (surface), 44px min height
- **Status badges**: Color-coded (green/coral/blue/gray)
- **Touch targets**: All ≥44px for mobile
- **Navigation**: Fixed bottom bar, 5 tabs with icons + labels
- **Live indicators**: Visual badges for real-time data connections

---

## Next Steps

### Immediate Priorities (Hackathon MVP)

1. **Supabase Setup**
   - League state schema
   - Player picks tracking
   - WebSocket for draft synchronization

2. **Snake Draft Implementation**
   - Draft room real-time sync
   - Pick timer (30-45 seconds)
   - Auto-pick logic
   - Market/side locking

3. **Smart Contract Development**
   - LeagueRegistry.sol on Base
   - createLeague, commitWinner, mintTrophy functions
   - ERC-721 trophy NFT implementation

4. **Market Slate Filtering**
   - Filter by active status
   - Date relevance (today/weekly)
   - Minimum liquidity threshold
   - Select 3 markets for draft

5. **Basic Scoring System**
   - Track final positions
   - Calculate +1 for correct outcomes
   - Display winner

### Medium-Term Goals

- Polymarket Builder SDK integration for Live Mode
- Geo-blocking implementation
- Enhanced wallet integration (OnchainKit)
- In-league swap mechanism
- Token-gated leagues
- Cross-chain/Farcaster reputation

### Long-Term Vision

- Reward overlays funded by Builder rewards
- Automated trading strategies for Live Mode
- Decentralized oracle support
- Advanced scoring (odds-weighted)
- Mobile app via Farcaster MiniKit

---

## Resources

### Documentation
- [Product Specification](./README.md)
- [Polymarket API Guide](./docs/POLYMARKET_API.md)
- [CLOB WebSocket Implementation](./docs/CLOB_WEBSOCKET.md)
- [RTDS WebSocket Implementation](./docs/RTDS_WEBSOCKET.md)

### External Links
- [Polymarket Docs](https://docs.polymarket.com)
- [Base Documentation](https://docs.base.org)
- [OnchainKit](https://onchainkit.xyz)
- [Polymarket Builder Program](https://polymarket.com/builders)

---

**Last Updated**: December 3, 2024
**Status**: MVP Development - Hackathon Phase
