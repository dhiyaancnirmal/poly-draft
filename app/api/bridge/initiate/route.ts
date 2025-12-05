import { NextRequest, NextResponse } from "next/server";

import {
    bridgeUsdcFromBaseToPolygon,
    bridgeChains,
} from "@/lib/bridgekit/client";
import {
    createTransferRecord,
    getTransferByIdempotency,
    updateTransfer,
} from "@/lib/bridgekit/store";

const MAX_AMOUNT_USDC = 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_COUNT = 10;

const rateBucket = new Map<
    string,
    { count: number; windowStartedAt: number }
>();

function getClientId(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for") ||
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

function checkRateLimit(request: NextRequest): boolean {
    const clientId = getClientId(request);
    const now = Date.now();
    const entry = rateBucket.get(clientId);

    if (!entry) {
        rateBucket.set(clientId, { count: 1, windowStartedAt: now });
        return true;
    }

    const withinWindow = now - entry.windowStartedAt < RATE_LIMIT_WINDOW_MS;
    if (!withinWindow) {
        rateBucket.set(clientId, { count: 1, windowStartedAt: now });
        return true;
    }

    if (entry.count >= RATE_LIMIT_COUNT) {
        return false;
    }

    entry.count += 1;
    rateBucket.set(clientId, entry);
    return true;
}

function badRequest(message: string) {
    return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
    try {
        if (!checkRateLimit(request)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again shortly." },
                { status: 429 }
            );
        }

        const payload = await request.json().catch(() => null);
        const amount = payload?.amount;
        const idempotencyKey: string | undefined =
            payload?.idempotencyKey || payload?.transferId;

        if (!amount || typeof amount !== "string") {
            return badRequest("amount (string) is required");
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return badRequest("amount must be greater than 0");
        }
        if (parsedAmount > MAX_AMOUNT_USDC) {
            return badRequest(`amount exceeds max of ${MAX_AMOUNT_USDC} USDC`);
        }

        const fallbackDestination = process.env.BRIDGEKIT_POLYGON_DESTINATION;
        const destinationAddress =
            payload?.destinationAddress || fallbackDestination;
        if (!destinationAddress) {
            return badRequest("destination address is required for this phase");
        }

        if (idempotencyKey) {
            const existing = getTransferByIdempotency(idempotencyKey);
            if (existing) {
                return NextResponse.json(existing);
            }
        }

        const record = createTransferRecord({
            amount,
            destinationAddress,
            userId: payload?.userId ?? null,
            idempotencyKey,
            status: "pending",
        });

        // Fire-and-forget bridge execution; status updates will be reflected in the store
        void bridgeUsdcFromBaseToPolygon({
            amount,
            destinationAddress,
            idempotencyKey: record.id,
        })
            .then((result) => {
                const nextStatus =
                    result.state === "success"
                        ? ("minted" as const)
                        : result.state === "pending"
                            ? ("attesting" as const)
                            : ("failed" as const);

                updateTransfer(record.id, {
                    status: nextStatus,
                    bridgeState: result.state,
                    bridgeResult: result,
                });
            })
            .catch((error: unknown) => {
                console.error("Bridge initiation failed", error);
                updateTransfer(record.id, {
                    status: "failed",
                    bridgeState: "error",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unexpected bridge execution error",
                });
            });

        return NextResponse.json({
            ...record,
            route: `${bridgeChains.from.name} -> ${bridgeChains.to.name}`,
        });
    } catch (error) {
        console.error("Unexpected bridge initiate error", error);
        return NextResponse.json(
            { error: "Failed to initiate bridge" },
            { status: 500 }
        );
    }
}

