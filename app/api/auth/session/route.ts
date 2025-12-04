import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function deriveEmail(fid: number) {
    return `${fid}@farcaster.local`;
}

function derivePassword(fid: number) {
    const secret =
        process.env.FID_AUTH_SECRET ||
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secret) {
        throw new Error("Missing FID_AUTH_SECRET (or Supabase service key fallback)");
    }

    return crypto.createHmac("sha256", secret).update(String(fid)).digest("hex");
}

type ProfileInput = {
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
} | null;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const fid = body?.fid as number | undefined;
        const profile = (body?.profile ?? null) as ProfileInput;

        if (!fid || Number.isNaN(fid)) {
            return NextResponse.json(
                { success: false, message: "Missing Farcaster fid" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const email = deriveEmail(fid);
        const password = derivePassword(fid);

        const profileFields = {
            username: profile?.username ?? null,
            display_name: profile?.displayName ?? null,
            avatar_url: profile?.avatarUrl ?? null,
        };

        // Find existing user by fid
        const { data: existingUser, error: lookupError } = await supabase
            .from("users")
            .select("id")
            .eq("fid", fid)
            .maybeSingle<{ id: string }>();

        if (lookupError) {
            return NextResponse.json(
                { success: false, message: lookupError.message },
                { status: 500 }
            );
        }

    let userId: string | undefined;

    if (existingUser && "id" in existingUser) {
      userId = (existingUser as { id?: string | null }).id ?? undefined;
    }

        if (userId) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                userId,
                {
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { fid, ...profileFields },
                    app_metadata: { auth_method: "farcaster" },
                }
            );

            if (updateError) {
                return NextResponse.json(
                    { success: false, message: updateError.message },
                    { status: 500 }
                );
            }
        } else {
            const { data: created, error: createError } =
                await supabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { fid, ...profileFields },
                    app_metadata: { auth_method: "farcaster" },
                });

            if (createError || !created?.user?.id) {
                return NextResponse.json(
                    { success: false, message: createError?.message || "User creation failed" },
                    { status: 500 }
                );
            }

            userId = created.user.id;
        }

        // Upsert profile keyed by fid to avoid duplicates
        const { error: upsertError } = await supabase
            .from("users")
            // @ts-expect-error Supabase types sometimes misalign on upsert options
            .upsert(
                {
                    id: userId,
                    fid,
                    username: profileFields.username,
                    display_name: profileFields.display_name,
                    avatar_url: profileFields.avatar_url,
                    auth_method: "farcaster",
                    last_active: new Date().toISOString(),
                },
                { onConflict: "fid" }
            );

        if (upsertError) {
            return NextResponse.json(
                { success: false, message: upsertError.message },
                { status: 500 }
            );
        }

        // Create a session for this user (password is deterministic per fid+secret)
        const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (signInError || !signInData.session) {
            return NextResponse.json(
                { success: false, message: signInError?.message || "Failed to sign in" },
                { status: 500 }
            );
        }

        const { access_token, refresh_token, expires_at } = signInData.session;

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                fid,
                profile: {
                    username: profileFields.username,
                    displayName: profileFields.display_name,
                    avatarUrl: profileFields.avatar_url,
                },
            },
            session: {
                access_token,
                refresh_token,
                expires_at,
            },
        });
    } catch (error) {
        console.error("Farcaster session creation failed:", error);
        return NextResponse.json(
            { success: false, message: "Unexpected error" },
            { status: 500 }
        );
    }
}

