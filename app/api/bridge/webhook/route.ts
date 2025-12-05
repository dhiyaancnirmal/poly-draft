import { NextRequest, NextResponse } from "next/server";

import { updateTransfer, getTransfer } from "@/lib/bridgekit/store";
import type { TransferStatus, BridgeState } from "@/lib/bridgekit/store";

type WebhookPayload = {
    transferId?: string;
    status?: TransferStatus;
    bridgeState?: BridgeState;
    txHashFrom?: string;
    txHashTo?: string;
    message?: string;
    error?: string;
};

/**
 * POST /api/bridge/webhook
 * 
 * Handle Circle/BridgeKit webhook notifications
 * Updates transfer status in Supabase
 */
export async function POST(request: NextRequest) {
    try {
        // Verify webhook secret
        const secret = process.env.WEBHOOK_SECRET;
        if (secret) {
            const provided = request.headers.get("x-webhook-secret");
            if (provided !== secret) {
                console.warn("Webhook unauthorized: invalid secret");
                return NextResponse.json({ error: "unauthorized" }, { status: 401 });
            }
        }

        const payload = (await request.json().catch(() => null)) as
            | WebhookPayload
            | null;

        if (!payload?.transferId) {
            return NextResponse.json(
                { error: "transferId is required" },
                { status: 400 }
            );
        }

        // Get existing transfer
        const record = await getTransfer(payload.transferId);
        if (!record) {
            // Log but don't error - might be a stale webhook
            console.warn(`Webhook for unknown transfer: ${payload.transferId}`);
            return NextResponse.json(
                { error: "transfer not found", acknowledged: true },
                { status: 404 }
            );
        }

        // Map webhook status to our status
        const status = payload.status || payload.bridgeState || "attesting";
        const bridgeState = payload.bridgeState || status;

        // Update transfer
        const updated = await updateTransfer(payload.transferId, {
            status: status as TransferStatus,
            bridgeState: bridgeState as BridgeState,
            txHashFrom: payload.txHashFrom,
            txHashTo: payload.txHashTo,
            error: payload.error || payload.message,
        });

        // Log for audit trail
        console.log(`Bridge webhook processed: ${payload.transferId}`, {
            previousStatus: record.status,
            newStatus: status,
            bridgeState,
            txHashTo: payload.txHashTo,
        });

        return NextResponse.json({
            success: true,
            transferId: payload.transferId,
            status: updated?.status,
            bridgeState: updated?.bridgeState,
        });
    } catch (error) {
        console.error("Bridge webhook error", error);
        return NextResponse.json(
            { error: "Webhook handling failed" },
            { status: 500 }
        );
    }
}
