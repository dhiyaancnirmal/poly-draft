import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLeagueOnChain, toLeagueIdBytes32, getContractInfo } from "@/lib/onchain/leagueManager";
import { generateJoinCode } from "@/lib/leagueCodes";

/**
 * POST /api/leagues/paid/create
 * 
 * Create a new paid league with USDC buy-in
 * Creates both the off-chain league record and the on-chain escrow
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        const {
            name,
            description,
            buyInUsdc, // Buy-in in USDC (e.g., 10 for 10 USDC)
            maxParticipants,
            creatorId,
            creatorAddress,
            startDate,
            endDate,
            durationPeriods = 1,
            picksPerPeriod = 3,
            cadence = "daily",
            type = "daily",
        } = payload;

        // Validate required fields
        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        if (!buyInUsdc || typeof buyInUsdc !== "number" || buyInUsdc <= 0) {
            return NextResponse.json({ error: "buyInUsdc must be a positive number" }, { status: 400 });
        }

        if (!maxParticipants || maxParticipants < 2 || maxParticipants > 20) {
            return NextResponse.json({ error: "maxParticipants must be between 2 and 20" }, { status: 400 });
        }

        if (!creatorId || !creatorAddress) {
            return NextResponse.json({ error: "creatorId and creatorAddress are required" }, { status: 400 });
        }

        const supabase = await safeCreateClient();

        // Generate join code
        const joinCode = generateJoinCode();

        // Calculate dates
        const now = new Date();
        const start = startDate ? new Date(startDate) : now;
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);

        // Create league in Supabase first
        const { data: league, error: leagueError } = (await (supabase
            .from("leagues") as any)
            .insert({
                name,
                description: description || null,
                creator_id: creatorId,
                creator_address: creatorAddress,
                creator_wallet: creatorAddress,
                max_players: maxParticipants,
                max_participants: maxParticipants,
                status: "open",
                mode: "paid",
                join_code: joinCode,
                type,
                cadence,
                duration_periods: durationPeriods,
                picks_per_period: picksPerPeriod,
                start_date: start.toISOString().split("T")[0],
                end_date: end.toISOString().split("T")[0],
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                created_by: creatorAddress,
                total_buy_in_cents: Math.round(buyInUsdc * 100),
                price_per_market_cents: 0,
                markets_per_period: picksPerPeriod,
            })
            .select()
            .single()) as { data: Record<string, unknown> | null; error: { message: string } | null };

        if (leagueError || !league) {
            console.error("Failed to create league:", leagueError);
            return NextResponse.json(
                { error: leagueError?.message || "Failed to create league" },
                { status: 500 }
            );
        }

        // Create on-chain league
        let onChainResult: { txHash: string; leagueIdBytes32: string } | null = null;
        let onChainError: string | null = null;
        const leagueId = league.id as string;

        try {
            onChainResult = await createLeagueOnChain(
                leagueId,
                buyInUsdc,
                maxParticipants
            );
        } catch (error) {
            console.error("Failed to create on-chain league:", error);
            onChainError = error instanceof Error ? error.message : "On-chain creation failed";
        }

        // Create paid_leagues record
        const contractInfo = getContractInfo();
        const { error: paidLeagueError } = await (supabase
            .from("paid_leagues") as any)
            .insert({
                league_id: leagueId,
                on_chain_league_id: onChainResult?.leagueIdBytes32 || toLeagueIdBytes32(leagueId),
                buy_in_cents: Math.round(buyInUsdc * 100),
                buy_in_usdc: buyInUsdc,
                max_players: maxParticipants,
                pool_usdc: 0,
                contract_address: contractInfo.leagueManager || "",
                chain: contractInfo.chain,
                status: onChainResult ? "open" : "pending",
            });

        if (paidLeagueError) {
            console.error("Failed to create paid_leagues record:", paidLeagueError);
            // Don't fail the request, but log the error
        }

        return NextResponse.json({
            success: true,
            league: {
                id: leagueId,
                name: league.name as string,
                joinCode: league.join_code as string,
                buyInUsdc,
                maxParticipants,
                status: league.status as string,
                mode: "paid",
            },
            onChain: onChainResult
                ? {
                    txHash: onChainResult.txHash,
                    leagueIdBytes32: onChainResult.leagueIdBytes32,
                    contractAddress: contractInfo.leagueManager,
                    chain: contractInfo.chain,
                }
                : null,
            error: onChainError,
        });
    } catch (error) {
        console.error("Error creating paid league:", error);
        const message = error instanceof Error ? error.message : "Failed to create paid league";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

async function safeCreateClient() {
    try {
        return await createClient();
    } catch (error) {
        console.error("Supabase init failed in /api/leagues/paid/create:", error);
        throw error;
    }
}

