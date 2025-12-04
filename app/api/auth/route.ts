import { Errors, createClient } from "@farcaster/quick-auth";
import { NextRequest, NextResponse } from "next/server";

const client = createClient();

// Simple per-process cache to avoid duplicate upstream calls per boot
const profileCache = new Map<number, { username: string | null; displayName: string | null; avatarUrl: string | null; walletAddress: string | null }>();
const ensCache = new Map<string, string | null>();

async function resolveEns(address: string | null | undefined) {
  if (!address) return null;
  const checksumAddress = address.toLowerCase();
  if (ensCache.has(checksumAddress)) return ensCache.get(checksumAddress) ?? null;

  try {
    const ensResp = await fetch(`https://api.ensideas.com/ens/resolve/${checksumAddress}`, {
      headers: { accept: "application/json" },
    });
    if (!ensResp.ok) {
      ensCache.set(checksumAddress, null);
      return null;
    }
    const ensData = await ensResp.json();
    const name = ensData?.name || null;
    ensCache.set(checksumAddress, name);
    return name;
  } catch (err) {
    console.warn("ENS lookup failed", err);
    ensCache.set(checksumAddress, null);
    return null;
  }
}

// Helper function to determine the correct domain for JWT verification
function getUrlHost(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const url = new URL(origin);
      return url.host;
    } catch (error) {
      console.warn("Invalid origin header:", origin, error);
    }
  }

  const host = request.headers.get("host");
  if (host) {
    return host;
  }

  let urlValue: string;
  if (process.env.VERCEL_ENV === "production") {
    urlValue = process.env.NEXT_PUBLIC_URL!;
  } else if (process.env.VERCEL_URL) {
    urlValue = `https://${process.env.VERCEL_URL}`;
  } else {
    urlValue = "http://localhost:3000";
  }

  const url = new URL(urlValue);
  return url.host;
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Missing token" }, { status: 401 });
  }

  try {
    const payload = await client.verifyJwt({
      token: authorization.split(" ")[1] as string,
      domain: getUrlHost(request),
    });

    const userFid = payload.sub;

    // Fetch user profile from Farcaster Neynar public API (no key required)
    let userProfile =
      profileCache.get(userFid) ?? {
        username: null as string | null,
        displayName: null as string | null,
        avatarUrl: null as string | null,
        walletAddress: null as string | null,
      };

    if (!profileCache.has(userFid)) {
      try {
        const profileResponse = await fetch(
          `https://api.neynar.com/v2/farcaster/user/bulk?fids=${userFid}`,
          { headers: { accept: "application/json" } }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const user = profileData.users?.[0];

          const username = user?.username || null;
          userProfile = {
            username,
            displayName: user?.display_name || username || null,
            avatarUrl: user?.pfp_url || null,
            walletAddress:
              user?.custody_address ||
              user?.verified_addresses?.eth_addresses?.[0] ||
              null,
          };
          profileCache.set(userFid, userProfile);
        }
      } catch (error) {
        console.error("Failed to fetch Farcaster profile:", error);
      }
    }

    const ensName = await resolveEns(userProfile.walletAddress);

    return NextResponse.json({
      success: true,
      user: {
        fid: userFid,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        profile: { ...userProfile, ensName },
      },
    });
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    if (e instanceof Error) {
      return NextResponse.json({ message: e.message }, { status: 500 });
    }
    throw e;
  }
}