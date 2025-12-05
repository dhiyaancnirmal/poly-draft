import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBridgeReadiness } from "@/lib/bridgekit/proxy";
import { isParticipant, getLeagueOnChain, LeagueStatus } from "@/lib/onchain/leagueManager";
import type { Address } from "viem";

type LeagueData = {
    id: string;
    name: string;
    status: string;
    max_players: number;
    total_buy_in_cents: number;
    paid_leagues: Array<{ id: string; buy_in_usdc: string }> | { id: string; buy_in_usdc: string } | null;
};

/**
 * POST /api/leagues/paid/join
 * 
 * Join a paid league
 * Verifies user has sufficient balance and proxy is ready
 * 
 * Note: The actual on-chain join (USDC transfer) must be done by the user
 * via their wallet, calling LeagueManager.joinLeague() directly.
 * This endpoint validates readiness and creates the off-chain membership.
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        const {
            leagueId,
            joinCode,
            userId,
            walletAddress,
            teamName,
        } = payload;

        if (!userId || !walletAddress) {
            return NextResponse.json(
                { error: "userId and walletAddress are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Find the league
        let league: LeagueData | null = null;
        if (leagueId) {
            const { data, error } = (await (supabase
                .from("leagues") as any)
                .select("*, paid_leagues(*)")
                .eq("id", leagueId)
                .eq("mode", "paid")
                .maybeSingle()) as { data: LeagueData | null; error: unknown };

            if (error || !data) {
                return NextResponse.json({ error: "League not found" }, { status: 404 });
            }
            league = data;
        } else if (joinCode) {
            const { data, error } = (await (supabase
                .from("leagues") as any)
                .select("*, paid_leagues(*)")
                .eq("join_code", joinCode)
                .eq("mode", "paid")
                .maybeSingle()) as { data: LeagueData | null; error: unknown };

            if (error || !data) {
                return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
            }
            league = data;
        } else {
            return NextResponse.json(
                { error: "leagueId or joinCode is required" },
                { status: 400 }
            );
        }

        if (!league) {
            return NextResponse.json({ error: "League not found" }, { status: 404 });
        }

        // Check league status
        if (league.status !== "open") {
            return NextResponse.json(
                { error: `League is not open for joining (status: ${league.status})` },
                { status: 400 }
            );
        }

        // Check if already a member
        const { data: existingMember } = (await (supabase
            .from("league_members") as any)
            .select("id")
            .eq("league_id", league.id)
            .eq("user_id", userId)
            .maybeSingle()) as { data: { id: string } | null };

        if (existingMember) {
            return NextResponse.json(
                { error: "Already a member of this league" },
                { status: 400 }
            );
        }

        // Check member count
        const { count: memberCount } = await (supabase
            .from("league_members") as any)
            .select("*", { count: "exact", head: true })
            .eq("league_id", league.id);

        if ((memberCount || 0) >= league.max_players) {
            return NextResponse.json(
                { error: "League is full" },
                { status: 400 }
            );
        }

        // Get buy-in amount
        const paidLeague = Array.isArray(league.paid_leagues)
            ? league.paid_leagues[0]
            : league.paid_leagues;
        const buyInUsdc = paidLeague?.buy_in_usdc 
            ? Number(paidLeague.buy_in_usdc) 
            : league.total_buy_in_cents / 100;

        // Check bridge readiness
        const readiness = await checkBridgeReadiness(userId, buyInUsdc);

        if (!readiness.ready) {
            return NextResponse.json({
                error: "Not ready for paid leagues",
                readiness,
                requiredAction: readiness.proxyStatus === "none" || readiness.proxyStatus === "pending"
                    ? "setup_proxy"
                    : readiness.balanceFormatted !== null
                        ? "bridge_funds"
                        : "unknown",
            }, { status: 400 });
        }

        // Check on-chain state if available
        let onChainState = null;
        try {
            onChainState = await getLeagueOnChain(league.id);

            if (onChainState.status !== LeagueStatus.Open) {
                return NextResponse.json(
                    { error: "On-chain league is not open" },
                    { status: 400 }
                );
            }

            // Check if already joined on-chain
            if (readiness.proxyAddress) {
                const alreadyJoinedOnChain = await isParticipant(
                    league.id,
                    readiness.proxyAddress as Address
                );

                if (alreadyJoinedOnChain) {
                    // They've already joined on-chain, just sync the off-chain state
                }
            }
        } catch (error) {
            console.warn("Could not check on-chain state:", error);
            // Continue anyway - on-chain might not be deployed yet
        }

        // Create league member record
        const { data: member, error: memberError } = (await (supabase
            .from("league_members") as any)
            .insert({
                league_id: league.id,
                user_id: userId,
                wallet_address: walletAddress,
                team_name: teamName || null,
            })
            .select()
            .single()) as { data: { id: string; team_name: string | null } | null; error: { message: string } | null };

        if (memberError || !member) {
            console.error("Failed to create league member:", memberError);
            return NextResponse.json(
                { error: memberError?.message || "Failed to join league" },
                { status: 500 }
            );
        }

        // Create paid_league_participants record
        if (paidLeague?.id) {
            await (supabase
                .from("paid_league_participants") as any)
                .insert({
                    paid_league_id: paidLeague.id,
                    user_id: userId,
                    wallet_address: walletAddress,
                    proxy_address: readiness.proxyAddress,
                });
        }

        return NextResponse.json({
            success: true,
            league: {
                id: league.id,
                name: league.name,
                buyInUsdc,
            },
            member: {
                id: member.id,
                teamName: member.team_name,
            },
            onChain: {
                proxyAddress: readiness.proxyAddress,
                balance: readiness.balanceFormatted,
                requiresJoinTransaction: true,
                message: "Please approve USDC and call joinLeague() on the LeagueManager contract",
            },
        });
    } catch (error) {
        console.error("Error joining paid league:", error);
        return NextResponse.json(
            { error: "Failed to join paid league" },
            { status: 500 }
        );
    }
}
