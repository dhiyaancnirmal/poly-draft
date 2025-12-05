import { NextRequest, NextResponse } from "next/server";

import { getTransfer } from "@/lib/bridgekit/store";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transferId = searchParams.get("transferId");

        if (!transferId) {
            return NextResponse.json(
                { error: "transferId is required" },
                { status: 400 }
            );
        }

        const record = getTransfer(transferId);
        if (!record) {
            return NextResponse.json(
                { error: "transfer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(record);
    } catch (error) {
        console.error("Error fetching bridge status", error);
        return NextResponse.json(
            { error: "Failed to fetch status" },
            { status: 500 }
        );
    }
}

