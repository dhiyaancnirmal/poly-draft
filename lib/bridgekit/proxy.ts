import { createPublicClient, http, formatUnits, type Address } from "viem";
import { polygon, polygonAmoy } from "viem/chains";
import { createClient } from "@/lib/supabase/server";

// USDC has 6 decimals
const USDC_DECIMALS = 6;

// USDC contract addresses
const USDC_ADDRESSES: Record<string, Address> = {
    polygon: (process.env.USDC_POLYGON_ADDRESS as Address) || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    "polygon-amoy": (process.env.USDC_POLYGON_ADDRESS as Address) || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
};

// Minimal ERC20 ABI for balance check
const ERC20_ABI = [
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;

export type UserProxy = {
    id: string;
    userId: string | null;
    walletAddress: string | null;
    polygonProxyAddress: string | null;
    proxyStatus: "pending" | "ready" | "error";
    lastCheckedAt: string | null;
    proxyError: string | null;
    createdAt: string;
    updatedAt: string;
};

/**
 * Get or create a user proxy record
 * For now, we create a placeholder and expect the proxy to be set up externally
 * (e.g., via Polymarket relayer or manual setup)
 */
export async function getOrCreateUserProxy(
    userId: string,
    walletAddress: string
): Promise<UserProxy> {
    const supabase = await createClient();

    // Check for existing proxy
    const { data: existing } = (await (supabase
        .from("user_proxies") as any)
        .select()
        .eq("user_id", userId)
        .maybeSingle()) as { data: Record<string, unknown> | null };

    if (existing && existing.polygon_proxy_address) {
        return mapRowToProxy(existing);
    }

    // Create or update proxy record
    const upsertData = {
        user_id: userId,
        wallet_address: walletAddress,
        proxy_status: "pending" as const,
        last_checked_at: new Date().toISOString(),
    };

    const { data, error } = (await (supabase
        .from("user_proxies") as any)
        .upsert(upsertData, { onConflict: "user_id,wallet_address" })
        .select()
        .single()) as { data: Record<string, unknown> | null; error: { message: string } | null };

    if (error) {
        console.error("Failed to upsert user proxy:", error);
        throw new Error(`Failed to create user proxy: ${error.message}`);
    }

    return mapRowToProxy(data!);
}

/**
 * Update a user's proxy address and status
 */
export async function updateUserProxy(
    userId: string,
    update: {
        polygonProxyAddress?: string;
        proxyStatus?: "pending" | "ready" | "error";
        proxyError?: string;
    }
): Promise<UserProxy | null> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
        last_checked_at: new Date().toISOString(),
    };

    if (update.polygonProxyAddress !== undefined) {
        updateData.polygon_proxy_address = update.polygonProxyAddress;
    }
    if (update.proxyStatus !== undefined) {
        updateData.proxy_status = update.proxyStatus;
    }
    if (update.proxyError !== undefined) {
        updateData.proxy_error = update.proxyError;
    }

    const { data, error } = (await (supabase
        .from("user_proxies") as any)
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single()) as { data: Record<string, unknown> | null; error: unknown };

    if (error) {
        console.error("Failed to update user proxy:", error);
        return null;
    }

    return data ? mapRowToProxy(data) : null;
}

/**
 * Get a user's proxy by user ID
 */
export async function getUserProxy(userId: string): Promise<UserProxy | null> {
    const supabase = await createClient();

    const { data, error } = (await (supabase
        .from("user_proxies") as any)
        .select()
        .eq("user_id", userId)
        .maybeSingle()) as { data: Record<string, unknown> | null; error: unknown };

    if (error || !data) {
        return null;
    }

    return mapRowToProxy(data);
}

/**
 * Get a user's proxy by wallet address
 */
export async function getUserProxyByWallet(
    walletAddress: string
): Promise<UserProxy | null> {
    const supabase = await createClient();

    const { data, error } = (await (supabase
        .from("user_proxies") as any)
        .select()
        .eq("wallet_address", walletAddress)
        .maybeSingle()) as { data: Record<string, unknown> | null; error: unknown };

    if (error || !data) {
        return null;
    }

    return mapRowToProxy(data);
}

/**
 * Check USDC balance on Polygon for an address
 */
export async function checkPolygonBalance(
    address: string,
    chainName: "polygon" | "polygon-amoy" = "polygon-amoy"
): Promise<{ balance: string; balanceFormatted: string }> {
    const chain = chainName === "polygon" ? polygon : polygonAmoy;
    const rpcUrl = process.env.POLYGON_RPC_URL;

    if (!rpcUrl) {
        throw new Error("POLYGON_RPC_URL not configured");
    }

    const client = createPublicClient({
        chain,
        transport: http(rpcUrl),
    });

    const usdcAddress = USDC_ADDRESSES[chainName];

    try {
        const balance = await client.readContract({
            address: usdcAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as Address],
        });

        const formatted = formatUnits(balance, USDC_DECIMALS);

        return {
            balance: balance.toString(),
            balanceFormatted: formatted,
        };
    } catch (error) {
        console.error("Failed to check Polygon balance:", error);
        throw new Error("Failed to check Polygon USDC balance");
    }
}

/**
 * Check if a user is ready for paid leagues
 * (has proxy and sufficient balance)
 */
export async function checkBridgeReadiness(
    userId: string,
    requiredAmount?: number
): Promise<{
    ready: boolean;
    proxyAddress: string | null;
    proxyStatus: string;
    balance: string | null;
    balanceFormatted: string | null;
    message: string;
}> {
    const proxy = await getUserProxy(userId);

    if (!proxy) {
        return {
            ready: false,
            proxyAddress: null,
            proxyStatus: "none",
            balance: null,
            balanceFormatted: null,
            message: "No proxy found. Please set up your Polygon wallet first.",
        };
    }

    if (proxy.proxyStatus === "error") {
        return {
            ready: false,
            proxyAddress: proxy.polygonProxyAddress,
            proxyStatus: "error",
            balance: null,
            balanceFormatted: null,
            message: proxy.proxyError || "Proxy setup failed. Please try again.",
        };
    }

    if (proxy.proxyStatus === "pending" || !proxy.polygonProxyAddress) {
        return {
            ready: false,
            proxyAddress: null,
            proxyStatus: "pending",
            balance: null,
            balanceFormatted: null,
            message: "Proxy setup in progress. Please wait.",
        };
    }

    // Check balance
    try {
        const chainName = (process.env.BRIDGEKIT_ENV || "testnet") === "mainnet" 
            ? "polygon" 
            : "polygon-amoy";

        const { balance, balanceFormatted } = await checkPolygonBalance(
            proxy.polygonProxyAddress,
            chainName
        );

        const balanceNum = parseFloat(balanceFormatted);
        const required = requiredAmount || 0;

        if (balanceNum < required) {
            return {
                ready: false,
                proxyAddress: proxy.polygonProxyAddress,
                proxyStatus: "ready",
                balance,
                balanceFormatted,
                message: `Insufficient balance. Have ${balanceFormatted} USDC, need ${required} USDC.`,
            };
        }

        return {
            ready: true,
            proxyAddress: proxy.polygonProxyAddress,
            proxyStatus: "ready",
            balance,
            balanceFormatted,
            message: "Ready for paid leagues.",
        };
    } catch (error) {
        return {
            ready: false,
            proxyAddress: proxy.polygonProxyAddress,
            proxyStatus: "ready",
            balance: null,
            balanceFormatted: null,
            message: "Failed to check balance. Please try again.",
        };
    }
}

/**
 * Map database row to UserProxy
 */
function mapRowToProxy(row: Record<string, unknown>): UserProxy {
    return {
        id: row.id as string,
        userId: row.user_id as string | null,
        walletAddress: row.wallet_address as string | null,
        polygonProxyAddress: row.polygon_proxy_address as string | null,
        proxyStatus: (row.proxy_status || "pending") as "pending" | "ready" | "error",
        lastCheckedAt: row.last_checked_at as string | null,
        proxyError: row.proxy_error as string | null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

