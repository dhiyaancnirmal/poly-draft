import { NextRequest, NextResponse } from "next/server";

import { updateTransfer, getTransfer } from "@/lib/bridgekit/store";

type WebhookPayload = {
  transferId?: string;
  status?: "pending" | "attesting" | "minted" | "failed";
  txHash?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const provided = request.headers.get("x-webhook-secret");
      if (provided !== secret) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const payload = (await request.json().catch(() => null)) as
      | WebhookPayload
      | null;

    if (!payload?.transferId) {
      return NextResponse.json(
        { error: "transferId is required" },
        { status: 400 }
      );
    }

    const record = getTransfer(payload.transferId);
    if (!record) {
      return NextResponse.json(
        { error: "transfer not found" },
        { status: 404 }
      );
    }

    const status = payload.status || "attesting";
    const updated = updateTransfer(payload.transferId, {
      status,
      error: payload.message,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Bridge webhook error", error);
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 }
    );
  }
}

