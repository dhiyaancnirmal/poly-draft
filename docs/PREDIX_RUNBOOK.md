# Predix On-Chain Runbook (Base networks)

## Prereqs
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`), then `foundryup`.
- RPC URL + funded deployer key. Base Sepolia recommended for first deploy.
- Env vars: see `env.example`.

## Build & test
- `npm run onchain:build`
- `npm run onchain:test`

## Deploy
- Export RPC and key: `export BASE_SEPOLIA_RPC_URL=... DEPLOYER_PRIVATE_KEY=0x...`
- Dry-run (simulation only): `forge script contracts/script/DeployPredix.s.sol:DeployPredix --rpc-url $BASE_SEPOLIA_RPC_URL`
- Broadcast (real deploy): `forge script contracts/script/DeployPredix.s.sol:DeployPredix --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast`
- Broadcast logs land in `contracts/broadcast/`.
- After deploy, update `contracts/manifest.json` and env (`PREDIX_TOKEN_ADDRESS`, `PREDIX_MANAGER_ADDRESS`, `PREDIX_CHAIN_ID`).

## Env keys
- RPC: `PREDIX_RPC_URL` (or `BASE_SEPOLIA_RPC_URL` / `BASE_MAINNET_RPC_URL`)
- Keys: `DEPLOYER_PRIVATE_KEY` (deploy), `PREDIX_MANAGER_PRIVATE_KEY` (settlement signer)
- Contracts: `PREDIX_TOKEN_ADDRESS` (Predix token – *token*, not “points”), `PREDIX_MANAGER_ADDRESS`, `PREDIX_CHAIN_ID`
- Optional: `PREDIX_LOG_LOOKBACK_BLOCKS` to bound explorer log scans in `/api/leagues/simulated/predix`.

## Addresses & ABIs
- Manifest: `contracts/manifest.json` (Base Sepolia/Mainnet slots). Use placeholders until mainnet deployment is finalized.
- ABIs: `contracts/abis/Predix.json`, `contracts/abis/PredixManager.json`.
- Explorer links: Base mainnet `https://basescan.org`, Base Sepolia `https://sepolia.basescan.org`. Token and tx links surfaced in the app UI and `/api/leagues/simulated/predix`.

## Rotation / key hygiene
- Rotate by deploying a new `PredixManager` with the new owner key, then call `Predix.setManager(newManager)` from the current manager key.
- Update env + manifest and restart backend jobs to pick up the new addresses.

## Notes
- Mint/burn are only callable by `PredixManager`; transfers/approvals revert.
- Transparency events: `PickLogged` / `SwapLogged` emit from `PredixManager`.
- Foundry deployment notes sourced from Foundry Book (`forge script --broadcast` safety flag, broadcast logs in `broadcast/`).


