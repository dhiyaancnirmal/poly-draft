import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/leagues
 * Lists leagues (social/live/paid). Use query params to filter.
 * - mode: optional filter (social|live|competitive|sim|paid)
 * - limit: optional limit (default 50, max 200)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode");
        const limitParam = searchParams.get("limit");

        const limit = Math.min(
            Math.max(Number(limitParam) || 50, 1),
            200
        );

        const supabase = await createClient();

        let query = (supabase.from("leagues") as any)
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (mode) {
            query = query.eq("mode", mode);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Failed to fetch leagues:", error);
            return NextResponse.json(
                { error: "Failed to fetch leagues" },
                { status: 500 }
            );
        }

        return NextResponse.json({ leagues: data ?? [] });
    } catch (error) {
        console.error("Error in /api/leagues:", error);
        return NextResponse.json(
            { error: "Internal error fetching leagues" },
            { status: 500 }
        );
    }
}

