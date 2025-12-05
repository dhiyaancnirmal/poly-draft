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
import { getOrCreateUserProxy } from "@/lib/bridgekit/proxy";

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
        const userId: string | undefined = payload?.userId;
        const walletAddress: string | undefined = payload?.walletAddress;

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

        // Check for existing transfer by idempotency key
        if (idempotencyKey) {
            const existing = await getTransferByIdempotency(idempotencyKey);
            if (existing) {
                return NextResponse.json(existing);
            }
        }

        // Determine destination address
        let destinationAddress = payload?.destinationAddress;

        // If userId provided, try to get/create their proxy
        if (!destinationAddress && userId && walletAddress) {
            try {
                const proxy = await getOrCreateUserProxy(userId, walletAddress);
                if (proxy.polygonProxyAddress) {
                    destinationAddress = proxy.polygonProxyAddress;
                }
            } catch (error) {
                console.warn("Failed to get user proxy:", error);
            }
        }

        // Fallback to env-configured destination
        if (!destinationAddress) {
            destinationAddress = process.env.BRIDGEKIT_POLYGON_DESTINATION;
        }

        if (!destinationAddress) {
            return badRequest("destination address is required for this phase");
        }

        // Determine chain names
        const fromChain = bridgeChains.from.name.toLowerCase().replace(" ", "-");
        const toChain = bridgeChains.to.name.toLowerCase().replace(" ", "-");

        // Create transfer record in Supabase
        const record = await createTransferRecord({
            amount,
            destinationAddress,
            userId: userId ?? null,
            walletAddress: walletAddress || destinationAddress,
            idempotencyKey,
            status: "pending",
            token: "USDC",
            fromChain,
            toChain,
        });

        // Fire-and-forget bridge execution; status updates will be reflected in the store
        void bridgeUsdcFromBaseToPolygon({
            amount,
            destinationAddress,
            idempotencyKey: record.id,
        })
            .then(async (result) => {
                const nextStatus =
                    result.state === "success"
                        ? ("minted" as const)
                        : result.state === "pending"
                            ? ("attesting" as const)
                            : ("failed" as const);

                await updateTransfer(record.id, {
                    status: nextStatus,
                    bridgeState: nextStatus,
                    bridgeResult: result,
                });
            })
            .catch(async (error: unknown) => {
                console.error("Bridge initiation failed", error);
                await updateTransfer(record.id, {
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
