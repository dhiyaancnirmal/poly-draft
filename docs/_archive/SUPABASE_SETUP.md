# TEMP - Supabase Integration Setup

## Implementation Summary

### Database Schema
- Executed `supabase-schema.sql` on Supabase project
- Created tables: users, leagues, league_members, picks, scores
- Enabled Row Level Security (RLS) with open policies for MVP
- Enabled Realtime subscriptions on picks, league_members, and leagues tables
- Created performance indexes

### TypeScript Types
- Auto-generated database types from Supabase schema
- Created type definitions in `lib/supabase/types.ts`
- Includes Row, Insert, and Update types for all tables

### Supabase Client Configuration
- **Client-side**: `lib/supabase/client.ts` - Browser client with SSR support
- **Server-side**: `lib/supabase/server.ts` - Admin client with service role key
- Both properly typed with Database schema

### Real-time Draft Synchronization
Created `lib/hooks/useDraftSync.ts` with:
- Real-time WebSocket subscriptions for picks, league members, and league updates
- Snake draft turn calculation
- Automatic state synchronization
- Connection status tracking

### React Hooks for Database Operations
Created hooks in `lib/hooks/`:

**useLeagues.ts**
- League CRUD operations and filtering

**useLeagueMembers.ts**
- Member management and draft order

**usePicks.ts**
- Draft pick operations and validation

**useScores.ts**
- Leaderboard and scoring system

**useUser.ts**
- User profile management

### Draft Utilities
Created `lib/supabase/draft-utils.ts` with helper functions:
- Snake draft turn calculation
- Market availability checking
- Draft completion detection

### Index Files
- `lib/hooks/index.ts` - Export all hooks
- `lib/supabase/index.ts` - Export client, types, and utilities

## File Structure

```
lib/
├── supabase/
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server/admin client
│   ├── types.ts           # Auto-generated database types
│   ├── draft-utils.ts     # Draft helper functions
│   └── index.ts           # Main exports
│
└── hooks/
    ├── useDraftSync.ts       # Real-time draft synchronization
    ├── useLeagues.ts         # League CRUD operations
    ├── useLeagueMembers.ts   # Member management
    ├── usePicks.ts           # Draft picks operations
    ├── useScores.ts          # Leaderboard and scoring
    ├── useUser.ts            # User profile management
    └── index.ts              # Main exports
```

## Usage Examples

### Start a Draft Room
```typescript
import { useDraftSync } from '@/lib/hooks';

function DraftRoom({ leagueId }) {
  const { picks, members, league, currentPlayerTurn, isConnected } =
    useDraftSync(leagueId);

  return (
    <div>
      {isConnected && <span>Live</span>}
      <p>Current turn: {currentPlayerTurn}</p>
      {/* Render draft UI */}
    </div>
  );
}
```

### Create a League
```typescript
import { createLeague } from '@/lib/hooks';

const league = await createLeague({
  name: "My League",
  creator_address: wallet,
  end_time: new Date(Date.now() + 86400000).toISOString(),
  mode: "social",
  max_players: 6
});
```

### Make a Pick
```typescript
import { makePick } from '@/lib/hooks';

const pick = await makePick({
  league_id: leagueId,
  wallet_address: wallet,
  market_id: "market-123",
  outcome_side: "YES",
  round: 1,
  pick_number: currentPickNumber
});
```

### Get Leaderboard
```typescript
import { useScores } from '@/lib/hooks';

function Leaderboard({ leagueId }) {
  const { scores, loading } = useScores(leagueId);

  return (
    <div>
      {scores.map(score => (
        <div key={score.id}>
          Rank #{score.rank}: {score.wallet_address} - {score.points} pts
        </div>
      ))}
    </div>
  );
}
```

## Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://wlgjwaihjbrtblvoqxgz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key (server-side only)
```

## Next Steps

1. **Fix existing RTDS WebSocket types** (unrelated to Supabase)
2. **Integrate hooks into UI components**:
   - Update draft room to use `useDraftSync`
   - Update league browser to use `useLeagues`
   - Update profile to use `useUser`
3. **Add wallet integration** to pass user addresses to hooks
4. **Implement league creation flow** using `createLeague` and `joinLeague`
5. **Add draft pick UI** using `makePick` and draft utilities

## Status

- Supabase client library installed
- Database schema created and deployed
- TypeScript types auto-generated
- Client configurations created (browser + server)
- Real-time WebSocket draft synchronization implemented
- React hooks for database operations
- Draft utilities and helper functions
- Ready for UI integration

The Supabase integration is complete and ready to use.
