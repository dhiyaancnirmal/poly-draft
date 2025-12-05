import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { settleLeagueOnChain, cancelLeagueOnChain, LeagueStatus } from "@/lib/onchain/leagueManager";
import { computeAndStoreScores } from "@/lib/simulated/scoring";
import type { Address } from "viem";

type SettlementResult = {
    userId: string;
    walletAddress: string;
    proxyAddress: string;
    points: number;
    payoutUsdc: number;
    rank: number;
};

type LeagueData = {
    id: string;
    status: string;
    paid_leagues: Array<{ id: string; buy_in_usdc: string; pool_usdc: string }> | { id: string; buy_in_usdc: string; pool_usdc: string } | null;
};

type ScoreData = {
    user_id: string;
    wallet_address: string;
    points: number;
    rank: number;
};

type ParticipantData = {
    user_id: string;
    proxy_address: string | null;
};

/**
 * POST /api/leagues/paid/settle
 * 
 * Settle a paid league by distributing payouts based on final standings
 * 
 * Payout distribution:
 * - Winner takes all: 1st place gets 100% of pool
 * - Top 2: 1st gets 70%, 2nd gets 30%
 * - Top 3: 1st gets 50%, 2nd gets 30%, 3rd gets 20%
 * (Configurable via payload)
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        const {
            leagueId,
            payoutDistribution, // Optional: custom distribution like [0.5, 0.3, 0.2]
            cancel = false, // If true, cancel and refund instead of settle
        } = payload;

        if (!leagueId) {
            return NextResponse.json(
                { error: "leagueId is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get league with paid info
        const { data: league, error: leagueError } = (await (supabase
            .from("leagues") as any)
            .select("*, paid_leagues(*)")
            .eq("id", leagueId)
            .eq("mode", "paid")
            .maybeSingle()) as { data: LeagueData | null; error: unknown };

        if (leagueError || !league) {
            return NextResponse.json({ error: "League not found" }, { status: 404 });
        }

        const paidLeague = Array.isArray(league.paid_leagues)
            ? league.paid_leagues[0]
            : league.paid_leagues;

        if (!paidLeague) {
            return NextResponse.json(
                { error: "Not a paid league" },
                { status: 400 }
            );
        }

        // Check league status
        if (!["active", "live", "ended"].includes(league.status)) {
            return NextResponse.json(
                { error: `League cannot be settled in status: ${league.status}` },
                { status: 400 }
            );
        }

        // Handle cancellation
        if (cancel) {
            return await handleCancellation(supabase, league, paidLeague);
        }

        // Compute final scores
        try {
            await computeAndStoreScores(supabase as any, leagueId);
        } catch (error) {
            console.error("Failed to compute scores:", error);
            return NextResponse.json(
                { error: "Failed to compute final scores" },
                { status: 500 }
            );
        }

        // Get final standings
        const { data: scores, error: scoresError } = (await (supabase
            .from("scores") as any)
            .select("user_id, wallet_address, points, rank")
            .eq("league_id", leagueId)
            .order("rank", { ascending: true })) as { data: ScoreData[] | null; error: unknown };

        if (scoresError || !scores || scores.length === 0) {
            return NextResponse.json(
                { error: "No scores found for settlement" },
                { status: 400 }
            );
        }

        // Get participant proxy addresses
        const { data: participants } = (await (supabase
            .from("paid_league_participants") as any)
            .select("user_id, proxy_address")
            .eq("paid_league_id", paidLeague.id)) as { data: ParticipantData[] | null };

        const proxyMap = new Map<string, string>();
        for (const p of participants || []) {
            if (p.proxy_address) {
                proxyMap.set(p.user_id, p.proxy_address);
            }
        }

        // Calculate payouts
        const poolUsdc = Number(paidLeague.pool_usdc) || (Number(paidLeague.buy_in_usdc) * scores.length);
        const distribution = payoutDistribution || getDefaultDistribution(scores.length);

        const settlements: SettlementResult[] = [];
        const winners: Address[] = [];
        const payouts: number[] = [];

        for (let i = 0; i < scores.length; i++) {
            const score = scores[i];
            const proxyAddress = proxyMap.get(score.user_id) || score.wallet_address;
            const payoutPercent = distribution[i] || 0;
            const payoutUsdc = poolUsdc * payoutPercent;

            settlements.push({
                userId: score.user_id,
                walletAddress: score.wallet_address,
                proxyAddress,
                points: score.points || 0,
                payoutUsdc,
                rank: score.rank || i + 1,
            });

            if (payoutUsdc > 0) {
                winners.push(proxyAddress as Address);
                payouts.push(payoutUsdc);
            }
        }

        // Settle on-chain
        let settlementTxHash: string | null = null;
        let onChainError: string | null = null;

        try {
            const result = await settleLeagueOnChain(leagueId, winners, payouts);
            settlementTxHash = result.txHash;
        } catch (error) {
            console.error("On-chain settlement failed:", error);
            onChainError = error instanceof Error ? error.message : "Settlement failed";
        }

        // Update paid_league status
        await (supabase
            .from("paid_leagues") as any)
            .update({
                status: settlementTxHash ? "settled" : "active",
                settlement_tx_hash: settlementTxHash,
            })
            .eq("id", paidLeague.id);

        // Update league status
        await (supabase
            .from("leagues") as any)
            .update({ status: settlementTxHash ? "finalized" : "ended" })
            .eq("id", leagueId);

        // Update participant payout records
        for (const settlement of settlements) {
            if (settlement.payoutUsdc > 0) {
                await (supabase
                    .from("paid_league_participants") as any)
                    .update({
                        payout_usdc: settlement.payoutUsdc,
                        payout_tx_hash: settlementTxHash,
                    })
                    .eq("paid_league_id", paidLeague.id)
                    .eq("user_id", settlement.userId);
            }
        }

        return NextResponse.json({
            success: !!settlementTxHash,
            leagueId,
            poolUsdc,
            settlements,
            txHash: settlementTxHash,
            error: onChainError,
        });
    } catch (error) {
        console.error("Error settling paid league:", error);
        return NextResponse.json(
            { error: "Failed to settle paid league" },
            { status: 500 }
        );
    }
}

/**
 * Handle league cancellation with refunds
 */
async function handleCancellation(
    supabase: Awaited<ReturnType<typeof createClient>>,
    league: LeagueData,
    paidLeague: { id: string }
) {
    let cancelTxHash: string | null = null;
    let onChainError: string | null = null;

    try {
        const result = await cancelLeagueOnChain(league.id);
        cancelTxHash = result.txHash;
    } catch (error) {
        console.error("On-chain cancellation failed:", error);
        onChainError = error instanceof Error ? error.message : "Cancellation failed";
    }

    // Update statuses
    await (supabase
        .from("paid_leagues") as any)
        .update({ status: "cancelled" })
        .eq("id", paidLeague.id);

    await (supabase
        .from("leagues") as any)
        .update({ status: "cancelled" })
        .eq("id", league.id);

    return NextResponse.json({
        success: !!cancelTxHash,
        cancelled: true,
        leagueId: league.id,
        txHash: cancelTxHash,
        error: onChainError,
        message: cancelTxHash
            ? "League cancelled. All participants will be refunded."
            : "Off-chain cancellation complete. On-chain refund may require manual intervention.",
    });
}

/**
 * Get default payout distribution based on player count
 */
function getDefaultDistribution(playerCount: number): number[] {
    if (playerCount <= 2) {
        return [1.0]; // Winner takes all
    } else if (playerCount <= 4) {
        return [0.7, 0.3]; // Top 2
    } else if (playerCount <= 8) {
        return [0.5, 0.3, 0.2]; // Top 3
    } else {
        return [0.4, 0.25, 0.2, 0.15]; // Top 4
    }
}
