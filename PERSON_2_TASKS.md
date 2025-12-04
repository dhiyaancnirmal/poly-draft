# Your Tasks: Wallet Connection & Contract Integration
**Role:** Frontend Contract Integration + UI Polish
**Timeline:** 36 hours
**Core Deliverable:** Working wallet + contract calls + transaction UI

---

## Your Mission
Make the app talk to Base blockchain. Users need to connect wallets, create leagues on-chain, and mint trophy NFTs. You're the bridge between UI and smart contracts.

---

## Phase 1: Wallet Connection (Hours 0-6)

### Setup Base Network

Edit `components/Providers.tsx`:
```typescript
'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base, baseSepolia } from 'wagmi/chains';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [baseSepolia], // Use baseSepolia for testing
  connectors: [
    coinbaseWallet({
      appName: 'PolyDraft',
      preference: 'smartWalletOnly', // Use Coinbase Smart Wallet
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### Replace Wallet Component

Edit `components/ConnectWallet.tsx`:
```typescript
'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect
} from '@coinbase/onchainkit/wallet';
import { Avatar, Name, Address, Identity } from '@coinbase/onchainkit/identity';

export default function ConnectWalletButton() {
  return (
    <Wallet>
      <ConnectWallet>
        <Avatar className="h-6 w-6" />
        <Name />
      </ConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
        </Identity>
        <WalletDropdownLink icon="wallet" href="https://wallet.coinbase.com">
          Wallet
        </WalletDropdownLink>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
```

### Test Wallet Connection
```bash
npm run dev
# Open http://localhost:3000
# Click "Connect Wallet"
# Connect with Coinbase Wallet
# Verify address shows in navbar
```

---

## Phase 2: Contract Integration (Hours 6-16)

### Wait for Person 1's ABI (~Hour 12)

They'll create `lib/contracts/LeagueRegistry.json`. Once available:

### Create Contract Client

Create `lib/contracts/LeagueRegistryClient.ts`:
```typescript
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';
import LeagueRegistryABI from './LeagueRegistry.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEAGUE_REGISTRY_ADDRESS as `0x${string}`;

// Hook for creating a league
export function useCreateLeague() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const create = async (name: string, endTime: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: LeagueRegistryABI.abi,
      functionName: 'createLeague',
      args: [name, endTime],
    });
  };

  return { create, hash, isPending, error };
}

// Hook for minting trophy
export function useMintTrophy() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const mint = async (leagueId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: LeagueRegistryABI.abi,
      functionName: 'mintTrophy',
      args: [leagueId],
    });
  };

  return { mint, hash, isPending, error };
}

// Hook for reading league data
export function useLeague(leagueId: bigint) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LeagueRegistryABI.abi,
    functionName: 'leagues',
    args: [leagueId],
  });

  return { league: data, isLoading, error };
}

// Hook for checking if user won
export function useIsWinner(leagueId: bigint, userAddress: `0x${string}`) {
  const { data: winner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LeagueRegistryABI.abi,
    functionName: 'leagueWinners',
    args: [leagueId],
  });

  return winner === userAddress;
}
```

### Add Transaction Status Component

Create `components/TransactionStatus.tsx`:
```typescript
'use client';

import { useWaitForTransactionReceipt } from 'wagmi';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

interface TransactionStatusProps {
  hash?: `0x${string}`;
  successMessage?: string;
}

export function TransactionStatus({ hash, successMessage }: TransactionStatusProps) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  if (!hash) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm text-blue-500">Transaction pending...</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm text-green-500">{successMessage || 'Transaction confirmed!'}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-500">Transaction failed</span>
      </div>
    );
  }

  return null;
}
```

---

## Phase 3: Integrate into UI (Hours 16-24)

### Add Create League Contract Call

Edit `components/CreateLeagueModal.tsx` (Person 4 will create the base):
```typescript
import { useCreateLeague } from '@/lib/contracts/LeagueRegistryClient';
import { TransactionStatus } from './TransactionStatus';
import { useAccount } from 'wagmi';

export function CreateLeagueModal() {
  const { address } = useAccount();
  const { create, hash, isPending } = useCreateLeague();
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!address) return;

    // Calculate end time (1 day from now)
    const endTime = BigInt(Math.floor(Date.now() / 1000) + 86400);

    try {
      await create(name, endTime);
      // After tx confirms, call Person 3's API to store in Supabase
      // await fetch('/api/leagues/create', { ... })
    } catch (err) {
      console.error('Failed to create league:', err);
    }
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleCreate} disabled={isPending || !address}>
        {isPending ? 'Creating...' : 'Create League'}
      </button>
      <TransactionStatus hash={hash} successMessage="League created!" />
    </div>
  );
}
```

### Add Trophy Minting

Create `components/TrophyCard.tsx`:
```typescript
import { useMintTrophy, useIsWinner } from '@/lib/contracts/LeagueRegistryClient';
import { useAccount } from 'wagmi';
import { Trophy } from 'lucide-react';

interface TrophyCardProps {
  leagueId: bigint;
  leagueName: string;
}

export function TrophyCard({ leagueId, leagueName }: TrophyCardProps) {
  const { address } = useAccount();
  const { mint, hash, isPending } = useMintTrophy();
  const isWinner = useIsWinner(leagueId, address!);

  if (!isWinner) return null;

  return (
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
      <h3 className="font-bold">{leagueName} Winner</h3>
      <button onClick={() => mint(leagueId)} disabled={isPending}>
        {isPending ? 'Minting...' : 'Mint Trophy NFT'}
      </button>
      <TransactionStatus hash={hash} successMessage="Trophy minted!" />
    </div>
  );
}
```

### Update Profile Page

Edit `app/profile/page.tsx`:
```typescript
import { TrophyCard } from '@/components/TrophyCard';

// In the profile page, fetch user's won leagues and show trophy cards
<div className="grid grid-cols-1 gap-4">
  {wonLeagues.map((league) => (
    <TrophyCard key={league.id} leagueId={BigInt(league.onChainId)} leagueName={league.name} />
  ))}
</div>
```

---

## Your Checklist

**Hours 0-6:**
- [ ] Update `Providers.tsx` with Base Sepolia config
- [ ] Replace `ConnectWallet.tsx` with OnchainKit component
- [ ] Test wallet connection works

**Hours 6-12:**
- [ ] Wait for Person 1's ABI export
- [ ] Create `LeagueRegistryClient.ts` with contract hooks
- [ ] Create `TransactionStatus.tsx` component

**Hours 12-18:**
- [ ] Integrate `useCreateLeague` into league creation flow
- [ ] Test league creation transaction on Base Sepolia
- [ ] Add transaction status UI

**Hours 18-24:**
- [ ] Create `TrophyCard.tsx` component
- [ ] Integrate trophy minting into profile page
- [ ] Test full flow: create league → mint trophy

**Hours 24-36:**
- [ ] Polish transaction UI (loading states, error messages)
- [ ] Add Live Mode toggle UI (if doing Live Builder Mode)
- [ ] Help with final integration testing

---

## Key Contacts

- **Person 1 (Contracts):** Get ABI and contract address from them around Hour 12
- **Person 3 (Backend):** Coordinate on linking on-chain league IDs to Supabase records
- **Person 4 (Frontend):** They're building the modals you'll add contract logic to

---

## Troubleshooting

**"Contract address is undefined"**
→ Check `.env` has `NEXT_PUBLIC_LEAGUE_REGISTRY_ADDRESS`

**"User rejected transaction"**
→ That's normal, just show a friendly error message

**"Insufficient funds for gas"**
→ User needs testnet ETH, link them to Base Sepolia faucet

**Transaction stuck pending**
→ Base Sepolia is sometimes slow, be patient or check Basescan
