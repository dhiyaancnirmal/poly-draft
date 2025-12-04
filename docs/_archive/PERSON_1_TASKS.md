# Your Tasks: Smart Contract Development
**Role:** Smart Contract Lead (Base/Solidity)
**Timeline:** 36 hours
**Core Deliverable:** LeagueRegistry.sol deployed on Base Sepolia with trophy NFT minting

---

## Your Mission
You're building the on-chain foundation for PolyDraft. Create a smart contract on Base that records leagues, commits winners, and mints trophy NFTs.

---

## Phase 1: Contract Development (Hours 0-12)

### Setup
```bash
# Choose your framework
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
# OR
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

### Create Contract: `contracts/LeagueRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LeagueRegistry is ERC721, Ownable {
    struct League {
        uint256 id;
        string name;
        address creator;
        uint256 endTime;
        address winner;
        bool settled;
    }

    uint256 public nextLeagueId;
    mapping(uint256 => League) public leagues;
    mapping(uint256 => address) public leagueWinners;
    mapping(address => bool) public authorizedBackends;

    event LeagueCreated(uint256 indexed leagueId, string name, address creator, uint256 endTime);
    event WinnerCommitted(uint256 indexed leagueId, address winner);
    event TrophyMinted(uint256 indexed leagueId, address winner);

    constructor() ERC721("PolyDraft Trophy", "PDTROPHY") Ownable(msg.sender) {}

    function authorizeBackend(address backend) external onlyOwner {
        authorizedBackends[backend] = true;
    }

    function createLeague(string calldata name, uint256 endTime) external returns (uint256) {
        require(endTime > block.timestamp, "End time must be in future");

        uint256 leagueId = nextLeagueId++;
        leagues[leagueId] = League({
            id: leagueId,
            name: name,
            creator: msg.sender,
            endTime: endTime,
            winner: address(0),
            settled: false
        });

        emit LeagueCreated(leagueId, name, msg.sender, endTime);
        return leagueId;
    }

    function commitWinner(uint256 leagueId, address winner) external {
        require(authorizedBackends[msg.sender], "Not authorized");
        require(!leagues[leagueId].settled, "Already settled");
        require(block.timestamp >= leagues[leagueId].endTime, "League not ended");

        leagues[leagueId].winner = winner;
        leagues[leagueId].settled = true;
        leagueWinners[leagueId] = winner;

        emit WinnerCommitted(leagueId, winner);
    }

    function mintTrophy(uint256 leagueId) external {
        require(leagues[leagueId].settled, "League not settled");
        require(leagueWinners[leagueId] == msg.sender, "Not the winner");
        require(balanceOf(msg.sender, leagueId) == 0, "Trophy already minted");

        _mint(msg.sender, leagueId);
        emit TrophyMinted(leagueId, msg.sender);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Return metadata URL (can be IPFS or centralized for MVP)
        return string(abi.encodePacked("https://polydraft.xyz/api/trophy/", tokenId));
    }
}
```

### Test Your Contract

Create `contracts/test/LeagueRegistry.t.sol`:
```solidity
// Write tests for:
// - createLeague (success and failure cases)
// - commitWinner (only authorized, can't double-commit)
// - mintTrophy (only winner, only once)
```

Run tests:
```bash
# Hardhat
npx hardhat test

# Foundry
forge test -vvv
```

---

## Phase 2: Deployment (Hours 12-18)

### Configure Base Sepolia

Add to `hardhat.config.ts` or `foundry.toml`:
```typescript
networks: {
  baseSepolia: {
    url: "https://sepolia.base.org",
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    chainId: 84532
  }
}
```

### Get Testnet ETH
- Visit https://www.alchemy.com/faucets/base-sepolia
- Get 0.1 ETH for deployment

### Deploy Script

Create `scripts/deploy.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  const LeagueRegistry = await ethers.getContractFactory("LeagueRegistry");
  const registry = await LeagueRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("LeagueRegistry deployed to:", address);

  // Authorize backend signer (get this address from Person 3)
  const backendSigner = process.env.BACKEND_SIGNER_ADDRESS;
  await registry.authorizeBackend(backendSigner);
  console.log("Authorized backend:", backendSigner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Deploy:
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Verify on Basescan
```bash
npx hardhat verify --network baseSepolia DEPLOYED_ADDRESS
```

---

## Phase 3: Export & Integration (Hours 18-24)

### Export ABI

Create `lib/contracts/LeagueRegistry.json`:
```bash
# Hardhat
cp artifacts/contracts/LeagueRegistry.sol/LeagueRegistry.json lib/contracts/

# Foundry
forge inspect LeagueRegistry abi > lib/contracts/LeagueRegistry.json
```

### Update Environment Variables

Add to `.env`:
```
NEXT_PUBLIC_LEAGUE_REGISTRY_ADDRESS=0x... (your deployed address)
BACKEND_SIGNER_ADDRESS=0x... (get from Person 3)
```

### Share with Team

Post in team channel:
```
✅ Smart Contract Deployed!
Address: 0x...
Network: Base Sepolia (84532)
Basescan: https://sepolia.basescan.org/address/0x...
ABI Location: lib/contracts/LeagueRegistry.json

@Person2 - You can now integrate contract calls
@Person3 - Use this address for commitWinner() calls
```

---

## Your Checklist

**Hours 0-12:**
- [ ] Set up Hardhat/Foundry
- [ ] Write LeagueRegistry.sol
- [ ] Write tests
- [ ] All tests pass locally

**Hours 12-18:**
- [ ] Get Base Sepolia testnet ETH
- [ ] Deploy to Base Sepolia
- [ ] Verify on Basescan
- [ ] Authorize backend signer address

**Hours 18-24:**
- [ ] Export ABI to `lib/contracts/LeagueRegistry.json`
- [ ] Update `.env` with contract address
- [ ] Share contract details with team
- [ ] Help Person 2 with integration issues

**Hours 24-36:**
- [ ] Test end-to-end flow with team
- [ ] Fix any contract bugs
- [ ] Add contract interaction helper functions if needed
- [ ] Support Live Mode if time permits

---

## Key Contacts

- **Person 3 (Backend Lead):** Get backend signer address from them around Hour 8
- **Person 2 (Integration):** They'll use your ABI starting Hour 12

---

## Troubleshooting

**"Insufficient funds for gas"**
→ Get more ETH from Base Sepolia faucet

**"Contract already deployed at address"**
→ That's fine, just use the existing address

**"Verification failed"**
→ Not critical for MVP, skip if it's taking too long

**Need help?**
→ Post in #contracts channel with error message
