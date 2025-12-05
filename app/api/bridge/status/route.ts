import { NextRequest, NextResponse } from "next/server";

import { getTransfer, getTransfersByUser } from "@/lib/bridgekit/store";
import { checkPolygonBalance } from "@/lib/bridgekit/proxy";

/**
 * GET /api/bridge/status
 * 
 * Get the status of a bridge transfer
 * 
 * Query params:
 * - transferId: The transfer ID to check
 * - userId: (optional) Get all transfers for a user
 * - includeBalance: (optional) Include Polygon USDC balance
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transferId = searchParams.get("transferId");
        const userId = searchParams.get("userId");
        const includeBalance = searchParams.get("includeBalance") === "true";

        // Get transfers by user
        if (userId && !transferId) {
            const transfers = await getTransfersByUser(userId);
            return NextResponse.json({ transfers });
        }

        // Get single transfer
        if (!transferId) {
            return NextResponse.json(
                { error: "transferId is required" },
                { status: 400 }
            );
        }

        const record = await getTransfer(transferId);
        if (!record) {
            return NextResponse.json(
                { error: "transfer not found" },
                { status: 404 }
            );
        }

        // Optionally include balance
        let balance: { balance: string; balanceFormatted: string } | null = null;

        if (includeBalance && record.destinationAddress) {
            try {
                const chainName = (process.env.BRIDGEKIT_ENV || "testnet") === "mainnet"
                    ? "polygon"
                    : "polygon-amoy";

                balance = await checkPolygonBalance(
                    record.destinationAddress,
                    chainName
                );
            } catch (error) {
                console.warn("Failed to fetch balance:", error);
            }
        }

        return NextResponse.json({
            ...record,
            balance: balance?.balanceFormatted || null,
            balanceRaw: balance?.balance || null,
        });
    } catch (error) {
        console.error("Error fetching bridge status", error);
        return NextResponse.json(
            { error: "Failed to fetch status" },
            { status: 500 }
        );
    }
}
