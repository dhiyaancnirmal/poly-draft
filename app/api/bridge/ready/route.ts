import { NextRequest, NextResponse } from "next/server";
import { checkBridgeReadiness, getUserProxy, getUserProxyByWallet } from "@/lib/bridgekit/proxy";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/bridge/ready
 * 
 * Check if a user is ready for paid leagues (has proxy and sufficient balance)
 * 
 * Query params:
 * - userId: User ID to check
 * - walletAddress: Wallet address to check (alternative to userId)
 * - requiredAmount: Optional minimum USDC amount required
 * - leagueId: Optional league ID to check buy-in requirement
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const walletAddress = searchParams.get("walletAddress");
        const requiredAmountParam = searchParams.get("requiredAmount");
        const leagueId = searchParams.get("leagueId");

        // Determine required amount
        let requiredAmount: number | undefined;

        if (requiredAmountParam) {
            requiredAmount = parseFloat(requiredAmountParam);
            if (isNaN(requiredAmount) || requiredAmount < 0) {
                return NextResponse.json(
                    { error: "Invalid requiredAmount" },
                    { status: 400 }
                );
            }
        }

        // If leagueId provided, fetch the league's buy-in
        if (leagueId && !requiredAmount) {
            const supabase = await safeCreateClient();
            
            // Check paid_leagues table first
            const { data: paidLeague } = (await supabase
                .from("paid_leagues")
                .select("buy_in_usdc")
                .eq("league_id", leagueId)
                .maybeSingle()) as { data: { buy_in_usdc: string } | null };

            if (paidLeague?.buy_in_usdc) {
                requiredAmount = Number(paidLeague.buy_in_usdc);
            } else {
                // Fallback to leagues table
                const { data: league } = (await supabase
                    .from("leagues")
                    .select("total_buy_in_cents")
                    .eq("id", leagueId)
                    .maybeSingle()) as { data: { total_buy_in_cents: number } | null };

                if (league?.total_buy_in_cents) {
                    requiredAmount = league.total_buy_in_cents / 100; // Convert cents to USDC
                }
            }
        }

        // Get user ID from wallet if needed
        let effectiveUserId = userId;

        if (!effectiveUserId && walletAddress) {
            const proxy = await getUserProxyByWallet(walletAddress);
            if (proxy?.userId) {
                effectiveUserId = proxy.userId;
            }
        }

        if (!effectiveUserId) {
            // Try to find user by wallet
            if (walletAddress) {
                const supabase = await safeCreateClient();
                const { data: user } = (await supabase
                    .from("users")
                    .select("id")
                    .eq("wallet_address", walletAddress)
                    .maybeSingle()) as { data: { id: string } | null };

                if (user) {
                    effectiveUserId = user.id;
                }
            }
        }

        if (!effectiveUserId) {
            return NextResponse.json(
                { error: "userId or walletAddress is required" },
                { status: 400 }
            );
        }

        // Check readiness
        const readiness = await checkBridgeReadiness(effectiveUserId, requiredAmount);

        return NextResponse.json({
            ...readiness,
            userId: effectiveUserId,
            requiredAmount: requiredAmount || null,
            leagueId: leagueId || null,
        });
    } catch (error) {
        console.error("Error checking bridge readiness:", error);
        const message = error instanceof Error ? error.message : "Failed to check bridge readiness";
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
        console.error("Supabase init failed in /api/bridge/ready:", error);
        throw error;
    }
}

