import { createPublicClient, createWalletClient, http, type Chain, type Address, encodeFunctionData, keccak256, toHex, type Abi } from "viem";
import { polygon, polygonAmoy } from "viem/chains";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import LeagueManagerAbi from "@/contracts/abis/LeagueManager.json";

const leagueManagerAbi: Abi = (() => {
    const abi = (LeagueManagerAbi as { abi?: Abi | undefined }).abi;
    if (!abi || !Array.isArray(abi)) {
        throw new Error("LeagueManager ABI is missing or invalid at contracts/abis/LeagueManager.json");
    }
    return abi as Abi;
})();

// League status enum matching contract
export enum LeagueStatus {
    Open = 0,
    Active = 1,
    Settled = 2,
    Cancelled = 3,
}

export type LeagueManagerConfig = {
    contractAddress: Address;
    chainId: number;
    rpcUrl: string;
    chain: Chain;
    account: PrivateKeyAccount;
};

export type OnChainLeague = {
    buyIn: bigint;
    pool: bigint;
    maxPlayers: number;
    currentPlayers: number;
    status: LeagueStatus;
};

/**
 * Get LeagueManager configuration from environment
 */
export function getLeagueManagerConfig(): LeagueManagerConfig {
    const contractAddress = process.env.LEAGUE_MANAGER_ADDRESS as Address | undefined;
    const privateKey = process.env.LEAGUE_MANAGER_PRIVATE_KEY as `0x${string}` | undefined;
    const chainId = Number(process.env.POLYGON_CHAIN_ID ?? polygonAmoy.id);
    const rpcUrl = process.env.POLYGON_RPC_URL;

    if (!contractAddress || !privateKey || !rpcUrl) {
        const missing = [];
        if (!contractAddress) missing.push("LEAGUE_MANAGER_ADDRESS");
        if (!privateKey) missing.push("LEAGUE_MANAGER_PRIVATE_KEY");
        if (!rpcUrl) missing.push("POLYGON_RPC_URL");
        throw new Error(`LeagueManager config missing: ${missing.join(", ")}`);
    }

    const chain = chainId === polygon.id ? polygon : polygonAmoy;

    return {
        contractAddress,
        chainId,
        rpcUrl,
        chain,
        account: privateKeyToAccount(privateKey),
    };
}

/**
 * Get LeagueManager clients (wallet and public)
 */
export function getLeagueManagerClients() {
    try {
        const cfg = getLeagueManagerConfig();
        const transport = http(cfg.rpcUrl);

        const walletClient = createWalletClient({
            account: cfg.account,
            chain: cfg.chain,
            transport,
        });

        const publicClient = createPublicClient({
            chain: cfg.chain,
            transport,
        });

        return { cfg, walletClient, publicClient };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`LEAGUE_MANAGER_CONFIG_ERROR: ${message}`);
    }
}

/**
 * Convert a UUID or string to bytes32 for on-chain league ID
 */
export function toLeagueIdBytes32(leagueId: string): `0x${string}` {
    // If already hex, pad to 32 bytes
    if (leagueId.startsWith("0x")) {
        return leagueId.padEnd(66, "0") as `0x${string}`;
    }
    // Convert UUID to bytes32 via keccak256
    return keccak256(toHex(leagueId));
}

/**
 * Create a new league on-chain
 */
export async function createLeagueOnChain(
    leagueId: string,
    buyInUsdc: number, // In USDC units (e.g., 10 for 10 USDC)
    maxPlayers: number
): Promise<{ txHash: string; leagueIdBytes32: string }> {
    const { cfg, walletClient, publicClient } = getLeagueManagerClients();
    const leagueIdBytes32 = toLeagueIdBytes32(leagueId);

    // Convert USDC to smallest units (6 decimals)
    const buyInAmount = BigInt(Math.round(buyInUsdc * 1_000_000));

    const hash = await walletClient.writeContract({
        address: cfg.contractAddress,
        abi: leagueManagerAbi,
        functionName: "createLeague",
        args: [leagueIdBytes32, buyInAmount, BigInt(maxPlayers)],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return {
        txHash: hash,
        leagueIdBytes32,
    };
}

/**
 * Activate a league on-chain (close joining, start gameplay)
 */
export async function activateLeagueOnChain(
    leagueId: string
): Promise<{ txHash: string }> {
    const { cfg, walletClient, publicClient } = getLeagueManagerClients();
    const leagueIdBytes32 = toLeagueIdBytes32(leagueId);

    const hash = await walletClient.writeContract({
        address: cfg.contractAddress,
        abi: leagueManagerAbi,
        functionName: "activateLeague",
        args: [leagueIdBytes32],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
}

/**
 * Settle a league on-chain with payouts
 */
export async function settleLeagueOnChain(
    leagueId: string,
    winners: Address[],
    payoutsUsdc: number[] // In USDC units
): Promise<{ txHash: string }> {
    const { cfg, walletClient, publicClient } = getLeagueManagerClients();
    const leagueIdBytes32 = toLeagueIdBytes32(leagueId);

    // Convert payouts to smallest units
    const payouts = payoutsUsdc.map((p) => BigInt(Math.round(p * 1_000_000)));

    const hash = await walletClient.writeContract({
        address: cfg.contractAddress,
        abi: leagueManagerAbi,
        functionName: "settleLeague",
        args: [leagueIdBytes32, winners, payouts],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
}

/**
 * Cancel a league on-chain and refund participants
 */
export async function cancelLeagueOnChain(
    leagueId: string
): Promise<{ txHash: string }> {
    const { cfg, walletClient, publicClient } = getLeagueManagerClients();
    const leagueIdBytes32 = toLeagueIdBytes32(leagueId);

    const hash = await walletClient.writeContract({
        address: cfg.contractAddress,
        abi: leagueManagerAbi,
        functionName: "cancelLeague",
        args: [leagueIdBytes32],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
}

/**
 * Get league info from chain
 */
export async function getLeagueOnChain(
    leagueId: string
): Promise<OnChainLeague> {
    const { cfg, publicClient } = getLeagueManagerClients();
    const leagueIdBytes32 = toLeagueIdBytes32(leagueId);

    const result = await publicClient.readContract({
        address: cfg.contractAddress,
        abi: leagueManagerAbi,
        functionName: "getLeague",
        args: [leagueIdBytes32],
    }) as [bigint, bigint, bigint, bigint, number];

    return {
        buyIn: result[0],
        pool: result[1],
        maxPlayers: Number(result[2]),
        currentPlayers: Number(result[3]),
        status: result[4] as LeagueStatus,
    };
}

/**
 * Get participants for a league
 */
export async function getLeagueParticipants(
    leagueId: string
): Promise<Address[]> {
    const { cfg, publicClient } = getLeagueManagerClients();
    const leagueIdBytes32 = toLeagueIdBytes32(leagueId);

    const result = await publicClient.readContract({
        address: cfg.contractAddress,
        abi: leagueManagerAbi,
        functionName: "getParticipants",
        args: [leagueIdBytes32],
    }) as Address[];

    return result;
}

/**
 * Check if an address is a participant in a league
 */
export async function isParticipant(
    leagueId: string,
    address: Address
): Promise<boolean> {
    const { cfg, publicClient } = getLeagueManagerClients();
    const leagueIdBytes32 = toLeagueIdBytes32(leagueId);

    const result = await publicClient.readContract({
        address: cfg.contractAddress,
        abi: leagueManagerAbi,
        functionName: "isParticipant",
        args: [leagueIdBytes32, address],
    }) as boolean;

    return result;
}

/**
 * Get contract addresses for UI/debugging
 */
export function getContractInfo(): {
    leagueManager: string | undefined;
    usdc: string | undefined;
    chain: string;
} {
    return {
        leagueManager: process.env.LEAGUE_MANAGER_ADDRESS,
        usdc: process.env.USDC_POLYGON_ADDRESS,
        chain: (process.env.BRIDGEKIT_ENV || "testnet") === "mainnet" ? "polygon" : "polygon-amoy",
    };
}

