import { type BridgeResult } from "@circle-fin/bridge-kit";
import { createClient } from "@/lib/supabase/server";

export type TransferStatus = "pending" | "attesting" | "minted" | "failed";
export type BridgeState = "pending" | "attesting" | "minted" | "failed" | "error";

export type TransferRecord = {
    id: string;
    userId?: string | null;
    walletAddress: string;
    amount: string;
    destinationAddress: string;
    status: TransferStatus;
    bridgeState?: BridgeState;
    idempotencyKey?: string;
    token?: string;
    fromChain?: string;
    toChain?: string;
    txHashFrom?: string;
    txHashTo?: string;
    error?: string;
    bridgeResult?: BridgeResult;
    createdAt: string;
    updatedAt: string;
};

type CreateTransferInput = {
    amount: string;
    destinationAddress: string;
    userId?: string | null;
    walletAddress?: string;
    idempotencyKey?: string;
    status?: TransferStatus;
    token?: string;
    fromChain?: string;
    toChain?: string;
};

/**
 * Create a new transfer record in Supabase
 */
export async function createTransferRecord(
    input: CreateTransferInput
): Promise<TransferRecord> {
    const supabase = await createClient();

    const insertData = {
        amount: input.amount,
        dest_address: input.destinationAddress,
        wallet_address: input.walletAddress || input.destinationAddress,
        user_id: input.userId || null,
        idempotency_key: input.idempotencyKey || null,
        status: input.status || "pending",
        bridge_state: "pending" as BridgeState,
        token: input.token || "USDC",
        from_chain: input.fromChain || null,
        to_chain: input.toChain || null,
    };

    const { data, error } = (await (supabase
        .from("bridge_transfers") as any)
        .insert(insertData)
        .select()
        .single()) as { data: Record<string, unknown> | null; error: { message: string } | null };

    if (error || !data) {
        console.error("Failed to create transfer record:", error);
        throw new Error(`Failed to create transfer record: ${error?.message || "No data returned"}`);
    }

    return mapRowToRecord(data);
}

/**
 * Get a transfer by ID
 */
export async function getTransfer(id: string): Promise<TransferRecord | undefined> {
    const supabase = await createClient();

    const { data, error } = (await (supabase
        .from("bridge_transfers") as any)
        .select()
        .eq("id", id)
        .maybeSingle()) as { data: Record<string, unknown> | null; error: unknown };

    if (error) {
        console.error("Failed to get transfer:", error);
        return undefined;
    }

    return data ? mapRowToRecord(data) : undefined;
}

/**
 * Get a transfer by idempotency key
 */
export async function getTransferByIdempotency(
    idempotencyKey: string
): Promise<TransferRecord | undefined> {
    const supabase = await createClient();

    const { data, error } = (await (supabase
        .from("bridge_transfers") as any)
        .select()
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle()) as { data: Record<string, unknown> | null; error: unknown };

    if (error) {
        console.error("Failed to get transfer by idempotency:", error);
        return undefined;
    }

    return data ? mapRowToRecord(data) : undefined;
}

/**
 * Update a transfer record
 */
export async function updateTransfer(
    id: string,
    patch: Partial<{
        status: TransferStatus;
        bridgeState: BridgeState;
        txHashFrom: string;
        txHashTo: string;
        error: string;
        bridgeResult: BridgeResult;
    }>
): Promise<TransferRecord | undefined> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.bridgeState !== undefined) updateData.bridge_state = patch.bridgeState;
    if (patch.txHashFrom !== undefined) updateData.tx_hash_from = patch.txHashFrom;
    if (patch.txHashTo !== undefined) updateData.tx_hash_to = patch.txHashTo;
    if (patch.error !== undefined) updateData.bridge_result = { error: patch.error };
    if (patch.bridgeResult !== undefined) updateData.bridge_result = patch.bridgeResult;

    const { data, error } = (await (supabase
        .from("bridge_transfers") as any)
        .update(updateData)
        .eq("id", id)
        .select()
        .single()) as { data: Record<string, unknown> | null; error: unknown };

    if (error) {
        console.error("Failed to update transfer:", error);
        return undefined;
    }

    return data ? mapRowToRecord(data) : undefined;
}

/**
 * Get all transfers for a user
 */
export async function getTransfersByUser(
    userId: string
): Promise<TransferRecord[]> {
    const supabase = await createClient();

    const { data, error } = (await (supabase
        .from("bridge_transfers") as any)
        .select()
        .eq("user_id", userId)
        .order("created_at", { ascending: false })) as { data: Record<string, unknown>[] | null; error: unknown };

    if (error) {
        console.error("Failed to get transfers by user:", error);
        return [];
    }

    return (data || []).map(mapRowToRecord);
}

/**
 * Get pending transfers (for polling/cleanup)
 */
export async function getPendingTransfers(): Promise<TransferRecord[]> {
    const supabase = await createClient();

    const { data, error } = (await (supabase
        .from("bridge_transfers") as any)
        .select()
        .in("bridge_state", ["pending", "attesting"])
        .order("created_at", { ascending: true })) as { data: Record<string, unknown>[] | null; error: unknown };

    if (error) {
        console.error("Failed to get pending transfers:", error);
        return [];
    }

    return (data || []).map(mapRowToRecord);
}

/**
 * Map database row to TransferRecord
 */
function mapRowToRecord(row: Record<string, unknown>): TransferRecord {
    return {
        id: row.id as string,
        userId: row.user_id as string | null,
        walletAddress: row.wallet_address as string,
        amount: String(row.amount),
        destinationAddress: (row.dest_address || row.wallet_address) as string,
        status: (row.status || "pending") as TransferStatus,
        bridgeState: (row.bridge_state || "pending") as BridgeState,
        idempotencyKey: row.idempotency_key as string | undefined,
        token: (row.token || "USDC") as string,
        fromChain: row.from_chain as string | undefined,
        toChain: row.to_chain as string | undefined,
        txHashFrom: row.tx_hash_from as string | undefined,
        txHashTo: row.tx_hash_to as string | undefined,
        error: undefined, // Extracted from bridge_result if needed
        bridgeResult: row.bridge_result as BridgeResult | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}
