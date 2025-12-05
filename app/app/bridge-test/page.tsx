"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type TransferStatus = "pending" | "attesting" | "minted" | "failed";

type TransferRecord = {
    id: string;
    amount: string;
    destinationAddress: string;
    status: TransferStatus;
    bridgeState?: string;
    error?: string;
    route?: string;
};

const STATUS_COPY: Record<TransferStatus, string> = {
    pending: "Bridging in progress",
    attesting: "Waiting for attestation",
    minted: "Minted on Polygon",
    failed: "Failed — retry",
};

export default function BridgeTestPage() {
    const [amount, setAmount] = useState("1");
    const [destination, setDestination] = useState("");
    const [transfer, setTransfer] = useState<TransferRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const envLabel = process.env.NEXT_PUBLIC_BRIDGE_ENV || "testnet";

    const canSubmit = useMemo(() => {
        return Number(amount) > 0 && !loading;
    }, [amount, loading]);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    useEffect(() => {
        if (!transfer?.id) return;
        if (pollRef.current) clearInterval(pollRef.current);

        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/bridge/status?transferId=${transfer.id}`
                );
                if (!res.ok) return;
                const data = (await res.json()) as TransferRecord;
                setTransfer(data);

                if (data.status === "minted" || data.status === "failed") {
                    if (pollRef.current) clearInterval(pollRef.current);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 4000);
    }, [transfer?.id]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/bridge/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    destinationAddress: destination || undefined,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                setError(json?.error || "Failed to start bridge");
                return;
            }

            setTransfer(json as TransferRecord);
        } catch (err) {
            console.error(err);
            setError("Unexpected error starting bridge");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Bridge Test">
            <div className="p-4 space-y-4">
                <Card className="space-y-4 p-4">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold text-foreground">
                            BridgeKit sandbox
                        </h1>
                        <p className="text-sm text-muted">
                            Sends USDC from Base ({envLabel}) to Polygon using the
                            env-configured destination address.
                        </p>
                    </div>

                    <Input
                        label="Amount (USDC)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <Input
                        label="Destination (optional override)"
                        placeholder="0x..."
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                    />

                    {error ? (
                        <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                            {error}
                        </div>
                    ) : null}

                    <Button onClick={handleSubmit} loading={loading} disabled={!canSubmit}>
                        Start bridge
                    </Button>
                </Card>

                {transfer ? (
                    <Card className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted">Transfer ID</p>
                                <p className="font-mono text-sm text-foreground break-all">
                                    {transfer.id}
                                </p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                {STATUS_COPY[transfer.status] ?? transfer.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted">Amount</p>
                                <p className="font-semibold text-foreground">
                                    {transfer.amount} USDC
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted">Route</p>
                                <p className="font-semibold text-foreground">
                                    {transfer.route || "Base → Polygon"}
                                </p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <p className="text-muted">Destination</p>
                                <p className="font-mono text-foreground break-all">
                                    {transfer.destinationAddress}
                                </p>
                            </div>
                        </div>

                        {transfer.error ? (
                            <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                                {transfer.error}
                            </div>
                        ) : null}
                    </Card>
                ) : null}
            </div>
        </AppLayout>
    );
}

