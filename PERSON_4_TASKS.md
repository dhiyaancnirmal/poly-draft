# Your Tasks: Draft Room & Real-time Sync
**Role:** Frontend/Full-Stack (Draft Room Specialist)
**Timeline:** 36 hours
**Core Deliverable:** Working draft room with real-time multiplayer picks

---

## Your Mission
Build the core demo feature: a multiplayer draft room where players pick markets in real-time and everyone sees picks instantly. This is the showpiece of the hackathon demo.

**Critical:** Your draft room depends on Person 3's API routes (available ~Hour 14). Start with UI and mock data, then integrate real backend.

---

## Phase 1: League Creation & Join UI (Hours 0-6)

### Create League Modal

Create `components/CreateLeagueModal.tsx` - See full implementation in the original plan file with complete TypeScript code for modal UI, form handling, and API integration.

### Add to Home Page

Edit `app/page.tsx` to add CreateLeagueModal button in header.

### Join League Button

Create `components/JoinLeagueButton.tsx` - Complete implementation available in original plan.

---

## Phase 2: Draft Room Real-time Sync (Hours 6-16)

**This is your MOST IMPORTANT feature!**

### Create Draft State Hook

Create `lib/hooks/useDraftState.ts` with:
- Supabase Realtime subscription to `picks` table
- Real-time pick updates
- Turn calculation
- Loading states

See full implementation with complete code in original plan file.

### Update Draft Page

Edit `app/draft/page.tsx` with:
- Real-time pick visualization
- Draft slots progress
- Market selection UI
- YES/NO buttons with availability checks
- Confirm pick flow

Complete implementation with all UI states available in original plan.

---

## Phase 3: UI Polish (Hours 16-22)

### Enhance Draft Slots Component

Edit `components/DraftSlots.tsx`:
- Visual draft progress
- Animated current pick indicator
- Pick outcome display

### Add Draft Complete Modal

Create `components/DraftCompleteModal.tsx` - Celebration modal when draft finishes.

---

## Phase 4: Results & Leaderboard (Hours 22-26)

### Update Leaderboard Page

Edit `app/leaderboard/page.tsx`:
- Fetch real scores from API
- Display sorted rankings
- Show points and user addresses

---

## Your Checklist

**Hours 0-6:**
- [ ] Create `CreateLeagueModal.tsx`
- [ ] Create `JoinLeagueButton.tsx`
- [ ] Add to home page
- [ ] Test UI (mock API for now)

**Hours 6-8:**
- [ ] Wait for Person 3's Supabase credentials
- [ ] Set up Supabase client

**Hours 8-14:**
- [ ] Create `useDraftState.ts` hook
- [ ] Test Supabase Realtime subscription locally

**Hours 14-18:**
- [ ] Update `app/draft/page.tsx` with real-time picks
- [ ] Integrate Person 3's `/api/draft/pick` endpoint
- [ ] Test pick flow

**Hours 18-22:**
- [ ] Enhance `DraftSlots.tsx` with pick visualization
- [ ] Add `DraftCompleteModal.tsx`
- [ ] Polish animations and loading states

**Hours 22-26:**
- [ ] Update leaderboard page with real scores
- [ ] Update profile page with real user data
- [ ] Test full flow end-to-end

**Hours 26-36:**
- [ ] Add Live Mode UI (if doing Live Builder)
- [ ] Final polish and bug fixes
- [ ] Help with demo prep

---

## Key Contacts

- **Person 3 (Backend):** You depend on their API routes. Check in at Hour 8 and Hour 14.
- **Person 2 (Contracts):** Coordinate on league creation (contract + Supabase sync).

---

## Troubleshooting

**Realtime not updating**
→ Check Supabase channel subscription, verify table is in `supabase_realtime` publication

**"Not your turn" error**
→ Check turn calculation logic, verify snake draft order in database

**Picks appearing out of order**
→ Sort picks by `pick_number` in your query

**Modal not showing**
→ Check z-index and fixed positioning
