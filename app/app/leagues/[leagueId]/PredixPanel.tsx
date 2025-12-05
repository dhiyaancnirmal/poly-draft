"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePredixTransparency } from "@/lib/hooks/usePredix";
import { cn } from "@/lib/utils";
import {
  Wallet,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";

interface PredixPanelProps {
  leagueId: string;
  userWalletAddress?: string | null;
}

function formatBalance(raw: string | undefined, formatted: string | undefined): string {
  if (formatted) {
    const num = parseFloat(formatted);
    if (!isNaN(num)) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
  }
  if (raw) {
    const num = parseFloat(raw) / 1e18;
    if (!isNaN(num)) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
  }
  return "0.00";
}

function getExplorerUrl(baseUrl: string, type: "address" | "tx", value: string): string {
  return `${baseUrl}/${type}/${value}`;
}

function SettlementStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;

  const config: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "default"; icon: React.ReactNode }> = {
    confirmed: { label: "Settled", variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
    sent: { label: "Pending", variant: "warning", icon: <Clock className="h-3 w-3" /> },
    pending: { label: "Queued", variant: "info", icon: <Clock className="h-3 w-3" /> },
    failed: { label: "Failed", variant: "error", icon: <XCircle className="h-3 w-3" /> },
  };

  const cfg = config[status] || { label: status, variant: "default" as const, icon: null };

  return (
    <Badge variant={cfg.variant} size="sm" className="gap-1">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

export function PredixPanel({ leagueId, userWalletAddress }: PredixPanelProps) {
  const { data, isLoading, error, refetch, isFetching } = usePredixTransparency(leagueId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Predix Settlement</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Predix Settlement</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl bg-error/10 border border-error/30 p-4">
            <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Unable to load settlement data</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {error?.message || "Authentication required or network error"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { chain, onchain, settlements, combined } = data;
  const explorerBase = chain?.explorerBaseUrl || "https://sepolia.basescan.org";
  const balance = onchain?.balance;
  const leagueSettlement = settlements?.find((s) => s.league_id === leagueId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Predix Settlement</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-xs text-muted-foreground mb-1">Predix Balance</p>
          <p className="text-2xl font-bold text-foreground">
            {formatBalance(balance?.raw, balance?.formatted)} <span className="text-sm font-normal text-muted-foreground">PREDIX</span>
          </p>
          {chain?.tokenAddress && (
            <a
              href={getExplorerUrl(explorerBase, "address", chain.tokenAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              View token contract <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Settlement Status */}
        {leagueSettlement && (
          <div className="rounded-xl bg-accent/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Settlement Status</span>
              <SettlementStatusBadge status={leagueSettlement.settlement_status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points Earned</span>
              <span className="text-sm font-semibold text-foreground">
                {leagueSettlement.points?.toFixed(2) ?? "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Settled Points</span>
              <span className="text-sm font-semibold text-foreground">
                {leagueSettlement.predix_settled_points?.toFixed(2) ?? "0.00"}
              </span>
            </div>
            {leagueSettlement.settlement_tx_hash && (
              <a
                href={getExplorerUrl(explorerBase, "tx", leagueSettlement.settlement_tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <span className="font-mono">
                  {leagueSettlement.settlement_tx_hash.slice(0, 10)}...{leagueSettlement.settlement_tx_hash.slice(-8)}
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {leagueSettlement.settlement_error && (
              <p className="text-xs text-error mt-1">Error: {leagueSettlement.settlement_error}</p>
            )}
          </div>
        )}

        {/* Contract Links */}
        {chain && (
          <div className="flex flex-wrap gap-2">
            {chain.managerAddress && (
              <a
                href={getExplorerUrl(explorerBase, "address", chain.managerAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Manager <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {chain.tokenAddress && (
              <a
                href={getExplorerUrl(explorerBase, "address", chain.tokenAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Token <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <span className="inline-flex items-center rounded-lg bg-accent/50 px-2.5 py-1.5 text-xs text-muted-foreground">
              Chain: {chain.chainId === 8453 ? "Base" : chain.chainId === 84532 ? "Base Sepolia" : chain.chainId}
            </span>
          </div>
        )}

        {/* Recent Activity */}
        {combined && combined.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {combined.slice(0, 5).map((event, idx) => (
                <div
                  key={`${event.txHash || event.id || idx}-${idx}`}
                  className="flex items-center gap-2 rounded-lg bg-accent/20 p-2 text-xs"
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md",
                    event.action === "pick" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"
                  )}>
                    {event.action === "pick" ? <TrendingUp className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="capitalize font-medium text-foreground">{event.action}</span>
                    <span className="text-muted-foreground ml-1.5">
                      {event.source === "onchain" ? "(on-chain)" : "(off-chain)"}
                    </span>
                  </div>
                  {event.txHash && (
                    <a
                      href={getExplorerUrl(explorerBase, "tx", event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!combined || combined.length === 0) && !leagueSettlement && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No settlement activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Settlements are processed when the league finalizes
            </p>
          </div>
        )}

        {/* On-chain error */}
        {onchain?.error && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-3">
            <p className="text-xs text-warning">On-chain data unavailable: {onchain.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

