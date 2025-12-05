import { type BridgeResult } from "@circle-fin/bridge-kit";
import { randomUUID } from "crypto";

export type TransferStatus = "pending" | "attesting" | "minted" | "failed";

export type TransferRecord = {
    id: string;
    userId?: string | null;
    amount: string;
    destinationAddress: string;
    status: TransferStatus;
    bridgeState?: BridgeResult["state"];
    idempotencyKey?: string;
    error?: string;
    bridgeResult?: BridgeResult;
    createdAt: number;
    updatedAt: number;
};

const transfers = new Map<string, TransferRecord>();
const idempotencyIndex = new Map<string, string>();

export function createTransferRecord(
    input: Omit<
        TransferRecord,
        "id" | "createdAt" | "updatedAt" | "status"
    > & { status?: TransferStatus }
): TransferRecord {
    const id = randomUUID();
    const now = Date.now();
    const record: TransferRecord = {
        id,
        status: input.status ?? "pending",
        createdAt: now,
        updatedAt: now,
        ...input,
    };

    transfers.set(id, record);
    if (record.idempotencyKey) {
        idempotencyIndex.set(record.idempotencyKey, id);
    }
    return record;
}

export function getTransfer(id: string): TransferRecord | undefined {
    return transfers.get(id);
}

export function getTransferByIdempotency(
    idempotencyKey: string
): TransferRecord | undefined {
    const id = idempotencyIndex.get(idempotencyKey);
    return id ? transfers.get(id) : undefined;
}

export function updateTransfer(
    id: string,
    patch: Partial<Omit<TransferRecord, "id" | "createdAt">>
): TransferRecord | undefined {
    const existing = transfers.get(id);
    if (!existing) return undefined;

    const updated: TransferRecord = {
        ...existing,
        ...patch,
        updatedAt: Date.now(),
    };

    transfers.set(id, updated);
    if (updated.idempotencyKey) {
        idempotencyIndex.set(updated.idempotencyKey, updated.id);
    }
    return updated;
}

