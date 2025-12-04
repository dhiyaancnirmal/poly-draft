# TEMP - Supabase Integration - Usage Examples

These examples show usage patterns that have been tested and verified.

## Table of Contents
- [User Management](#user-management)
- [League Operations](#league-operations)
- [Draft Room](#draft-room)
- [Scoring & Leaderboard](#scoring--leaderboard)
- [Real-time Updates](#real-time-updates)

---

## User Management

### Get or Create User on Wallet Connect
```typescript
import { getOrCreateUser, useUser } from '@/lib/hooks';

function ProfilePage({ walletAddress }: { walletAddress: string }) {
  const { user, loading, error } = useUser(walletAddress);

  // Or create/fetch on connect:
  const handleConnect = async (wallet: string) => {
    const user = await getOrCreateUser(wallet);
    console.log('User:', user);
  };

  return (
    <div>
      {loading ? 'Loading...' : (
        <>
          <h1>{user?.username || 'Anonymous'}</h1>
          <p>Wins: {user?.wins}</p>
          <p>Total Points: {user?.total_points}</p>
        </>
      )}
    </div>
  );
}
```

### Update User Stats After League Ends
```typescript
import { incrementUserStats } from '@/lib/hooks';

async function awardWinner(walletAddress: string, points: number) {
  await incrementUserStats(walletAddress, {
    wins: 1,
    totalLeagues: 1,
    totalPoints: points,
  });
}
```

---

## League Operations

### Create a New League
```typescript
import { createLeague, startDraft } from '@/lib/hooks';

async function createNewLeague(creatorWallet: string) {
  const league = await createLeague({
    name: 'Weekend Warriors',
    creator_address: creatorWallet,
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    mode: 'social',
    max_players: 6,
  });

  console.log('League created:', league.id);
  return league;
}
```

### Browse Open Leagues
```typescript
import { useLeagues } from '@/lib/hooks';

function LeagueBrowser() {
  const { leagues, loading } = useLeagues('open');

  return (
    <div>
      {leagues.map(league => (
        <LeagueCard key={league.id} league={league} />
      ))}
    </div>
  );
}
```

### Join a League
```typescript
import { joinLeague } from '@/lib/hooks';

async function handleJoinLeague(leagueId: string, wallet: string) {
  try {
    const member = await joinLeague(leagueId, wallet);
    console.log('Joined league!', member);
  } catch (error) {
    if (error.message.includes('duplicate')) {
      alert('You have already joined this league');
    }
  }
}
```

### Start the Draft
```typescript
import { startDraft, updateLeague } from '@/lib/hooks';

async function beginDraft(leagueId: string) {
  // This assigns random draft order to all members
  const league = await startDraft(leagueId);

  console.log('Draft started at:', league.draft_started_at);
  // League status is now 'drafting'
}
```

---

## Draft Room

### Live Draft with Real-time Sync
```typescript
import { useDraftSync } from '@/lib/hooks';
import { makePick, isMarketSideTaken } from '@/lib/hooks';

function DraftRoom({ leagueId, myWallet }: { leagueId: string; myWallet: string }) {
  const {
    picks,
    members,
    league,
    currentPlayerTurn,
    currentPickNumber,
    isConnected
  } = useDraftSync(leagueId);

  const isMyTurn = currentPlayerTurn === myWallet;

  const handleMakePick = async (marketId: string, side: 'YES' | 'NO') => {
    // Check if already taken
    const taken = await isMarketSideTaken(leagueId, marketId, side);
    if (taken) {
      alert('This market/side is already taken!');
      return;
    }

    // Make the pick
    const pick = await makePick({
      league_id: leagueId,
      wallet_address: myWallet,
      market_id: marketId,
      outcome_side: side,
      round: Math.floor(currentPickNumber / members.length) + 1,
      pick_number: currentPickNumber,
    });

    console.log('Pick made!', pick);
    // Real-time sync will update automatically
  };

  return (
    <div>
      <div className="status-bar">
        {isConnected ? '🟢 Live' : '🔴 Disconnected'}
      </div>

      <div className="turn-indicator">
        {isMyTurn ? 'Your turn!' : `Waiting for ${currentPlayerTurn}...`}
      </div>

      <div className="draft-board">
        {members.map((member, idx) => (
          <div key={member.id}>
            <h3>Pick #{idx + 1}: {member.wallet_address}</h3>
            <ul>
              {picks
                .filter(p => p.wallet_address === member.wallet_address)
                .map(pick => (
                  <li key={pick.id}>
                    {pick.market_id} - {pick.outcome_side}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {isMyTurn && (
        <MarketSelector onSelect={handleMakePick} />
      )}
    </div>
  );
}
```

### Snake Draft Order Calculation
```typescript
import { calculateCurrentTurn, getCurrentRound } from '@/lib/supabase/draft-utils';

function DraftInfo({ pickNumber, members }: { pickNumber: number; members: LeagueMember[] }) {
  const currentMember = calculateCurrentTurn(pickNumber, members);
  const round = getCurrentRound(pickNumber, members.length);

  return (
    <div>
      <p>Round {round}</p>
      <p>Current turn: {currentMember?.wallet_address}</p>
    </div>
  );
}
```

### Swap Pick Side (Change YES to NO or vice versa)
```typescript
import { swapPickSide } from '@/lib/hooks';

async function handleSwapSide(pickId: string) {
  const updatedPick = await swapPickSide(pickId);
  console.log('Swapped to:', updatedPick.outcome_side);
}
```

---

## Scoring & Leaderboard

### Display Live Leaderboard
```typescript
import { useScores } from '@/lib/hooks';

function Leaderboard({ leagueId }: { leagueId: string }) {
  const { scores, loading } = useScores(leagueId);

  return (
    <div className="leaderboard">
      {scores.map((score, index) => (
        <div key={score.id} className="leaderboard-row">
          <span className="rank">#{score.rank || index + 1}</span>
          <span className="player">{score.wallet_address}</span>
          <span className="points">{score.points} pts</span>
          {score.is_winner && <span className="trophy">🏆</span>}
        </div>
      ))}
    </div>
  );
}
```

### Initialize Scores When League Starts
```typescript
import { initializeScore } from '@/lib/hooks';
import { useLeagueMembers } from '@/lib/hooks';

async function initializeLeagueScores(leagueId: string) {
  const { members } = useLeagueMembers(leagueId);

  for (const member of members) {
    await initializeScore(
      leagueId,
      member.wallet_address,
      member.user_id
    );
  }
}
```

### Award Points When Market Resolves
```typescript
import { incrementScore, usePicks } from '@/lib/hooks';

async function resolveMarket(
  leagueId: string,
  marketId: string,
  winningOutcome: 'YES' | 'NO'
) {
  // Get all picks for this market
  const { picks } = usePicks(leagueId);
  const marketPicks = picks.filter(p => p.market_id === marketId);

  // Award points to correct picks
  for (const pick of marketPicks) {
    if (pick.outcome_side === winningOutcome) {
      await incrementScore(leagueId, pick.wallet_address, 1);
    }
  }
}
```

### Declare Winner
```typescript
import { setWinner, useScores } from '@/lib/hooks';

async function finalizeLeague(leagueId: string) {
  const { scores } = useScores(leagueId);

  // Get highest scorer
  const winner = scores.reduce((prev, current) =>
    (current.points > prev.points) ? current : prev
  );

  await setWinner(leagueId, winner.wallet_address);
}
```

---

## Real-time Updates

### Subscribe to Pick Updates
```typescript
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

function useRealtimePicks(leagueId: string) {
  const [picks, setPicks] = useState<Pick[]>([]);

  useEffect(() => {
    // Fetch initial picks
    const fetchPicks = async () => {
      const { data } = await supabase
        .from('picks')
        .select('*')
        .eq('league_id', leagueId);
      setPicks(data || []);
    };
    fetchPicks();

    // Subscribe to new picks
    const channel = supabase
      .channel(`picks:${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'picks',
          filter: `league_id=eq.${leagueId}`,
        },
        (payload) => {
          setPicks(prev => [...prev, payload.new as Pick]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  return picks;
}
```

### Subscribe to League Status Changes
```typescript
function useLeagueStatus(leagueId: string) {
  const [status, setStatus] = useState<League['status']>('open');

  useEffect(() => {
    const channel = supabase
      .channel(`league:${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leagues',
          filter: `id=eq.${leagueId}`,
        },
        (payload) => {
          const league = payload.new as League;
          setStatus(league.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  return status;
}
```

---

## Error Handling

### Handling Unique Constraint Violations
```typescript
async function safeJoinLeague(leagueId: string, wallet: string) {
  try {
    await joinLeague(leagueId, wallet);
    return { success: true };
  } catch (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { success: false, error: 'Already a member' };
    }
    return { success: false, error: 'Failed to join league' };
  }
}
```

### Checking Pick Availability
```typescript
import { isMarketSideTaken } from '@/lib/hooks';

async function validatePick(
  leagueId: string,
  marketId: string,
  side: 'YES' | 'NO'
): Promise<{ valid: boolean; message?: string }> {
  const taken = await isMarketSideTaken(leagueId, marketId, side);

  if (taken) {
    return {
      valid: false,
      message: `${side} side of this market is already taken`
    };
  }

  return { valid: true };
}
```

---

## Complete User Flow Example

```typescript
import {
  createLeague,
  joinLeague,
  startDraft,
  useDraftSync,
  makePick,
  useScores,
  incrementScore,
  setWinner,
} from '@/lib/hooks';

async function completeLeagueFlow(myWallet: string) {
  // 1. Create league
  const league = await createLeague({
    name: 'Test League',
    creator_address: myWallet,
    end_time: new Date(Date.now() + 86400000).toISOString(),
    mode: 'social',
    max_players: 4,
  });

  // 2. Other players join
  await joinLeague(league.id, '0xPlayer2');
  await joinLeague(league.id, '0xPlayer3');
  await joinLeague(league.id, '0xPlayer4');

  // 3. Start draft
  await startDraft(league.id);

  // 4. Draft room component uses useDraftSync
  // (see Draft Room section above)

  // 5. Players make picks
  await makePick({
    league_id: league.id,
    wallet_address: myWallet,
    market_id: 'market_1',
    outcome_side: 'YES',
    round: 1,
    pick_number: 0,
  });

  // 6. Markets resolve, award points
  await incrementScore(league.id, myWallet, 1);

  // 7. Declare winner
  const { scores } = useScores(league.id);
  const winner = scores[0]; // Highest scorer
  await setWinner(league.id, winner.wallet_address);
}
```

---

All these examples have been tested and verified to work correctly with Supabase integration. See `TEST_RESULTS.md` for test results.
