"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { usePredixTransparency } from "@/lib/hooks/usePredix";
import { cn } from "@/lib/utils";
import {
  Wallet,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";

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

// Static wallet cards (placeholder for future bridge/USDC integration)
const staticWallets = [
  {
    chain: "Base",
    balance: 0,
    currency: "USDC",
    color: "from-blue-600 to-blue-800",
    patternColor: "text-blue-400/20",
  },
  {
    chain: "Polygon",
    balance: 0,
    currency: "USDC",
    color: "from-purple-600 to-purple-800",
    patternColor: "text-purple-400/20",
  },
];

export default function WalletPage() {
  const { data, isLoading, error, refetch, isFetching } = usePredixTransparency();

  const chain = data?.chain;
  const balance = data?.onchain?.balance;
  const settlements = data?.settlements || [];
  const combined = data?.combined || [];
  const explorerBase = chain?.explorerBaseUrl || "https://sepolia.basescan.org";

  return (
    <AppLayout title="Wallet">
      <div className="p-4 space-y-6">
        {/* Predix Balance Card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Predix Token</h2>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-[170px] w-full rounded-2xl" />
          ) : error || !data?.success ? (
            <div className="rounded-2xl border border-error/30 bg-error/5 p-5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-error flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Unable to load Predix data</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {error?.message || "Sign in to view your balance"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative min-w-[300px] h-[170px] rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-primary/80 to-primary">
              {/* Background pattern */}
              <div className="absolute inset-0 overflow-hidden select-none pointer-events-none text-white/10">
                <div className="absolute -top-4 -left-4 text-[80px] font-mono font-bold leading-none opacity-50">
                  0101<br/>1010<br/>0101
                </div>
                <div className="absolute -bottom-4 -right-4 text-[80px] font-mono font-bold leading-none opacity-50">
                  1010<br/>0101<br/>1010
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-white/70" />
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                      {chain?.chainId === 8453 ? "Base" : chain?.chainId === 84532 ? "Base Sepolia" : "Predix"}
                    </p>
                  </div>
                  <p className="text-white text-3xl font-bold tracking-tight">
                    {formatBalance(balance?.raw, balance?.formatted)}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    PREDIX
                  </p>
                </div>

                {/* Contract links */}
                <div className="flex gap-2 flex-wrap">
                  {chain?.tokenAddress && (
                    <a
                      href={getExplorerUrl(explorerBase, "address", chain.tokenAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] text-white/80 hover:bg-white/20 transition-colors"
                    >
                      Token <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {chain?.managerAddress && (
                    <a
                      href={getExplorerUrl(explorerBase, "address", chain.managerAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] text-white/80 hover:bg-white/20 transition-colors"
                    >
                      Manager <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* USDC Wallet Cards (placeholder) */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">USDC Balances</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
            {staticWallets.map((wallet) => (
              <div
                key={wallet.chain}
                className={cn(
                  "relative min-w-[260px] h-[140px] flex-shrink-0 snap-start rounded-2xl p-5 overflow-hidden",
                  "bg-gradient-to-br",
                  wallet.color
                )}
              >
                {/* Background pattern */}
                <div className={cn("absolute inset-0 overflow-hidden select-none pointer-events-none", wallet.patternColor)}>
                  <div className="absolute -top-4 -left-4 text-[60px] font-mono font-bold leading-none opacity-50">
                    0101<br/>1010
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[60px] font-mono font-bold leading-none opacity-50">
                    1010<br/>0101
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                    {wallet.chain}
                  </p>
                  <p className="text-white text-2xl font-bold tracking-tight">
                    ${wallet.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {wallet.currency}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Bridge integration coming soon
          </p>
        </div>

        {/* Settlements Section */}
        {settlements.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-base font-semibold text-foreground">League Settlements</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {settlements.map((settlement, idx) => (
                <div
                  key={`${settlement.league_id}-${idx}`}
                  className="flex items-center justify-between rounded-xl bg-accent/30 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      League {settlement.league_id?.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {settlement.points?.toFixed(2) ?? "0"} pts earned
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SettlementStatusBadge status={settlement.settlement_status} />
                    {settlement.settlement_tx_hash && (
                      <a
                        href={getExplorerUrl(explorerBase, "tx", settlement.settlement_tx_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {combined.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {combined.slice(0, 10).map((event, idx) => (
                <div
                  key={`${event.txHash || event.id || idx}-${idx}`}
                  className="flex items-center gap-3 rounded-xl bg-accent/20 p-3"
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    event.action === "pick" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"
                  )}>
                    {event.action === "pick" ? <TrendingUp className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.source === "onchain" ? "On-chain" : "Off-chain"}
                      {event.createdAt && ` • ${new Date(event.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {event.txHash && (
                    <a
                      href={getExplorerUrl(explorerBase, "tx", event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && data?.success && settlements.length === 0 && combined.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Wallet className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No settlement activity yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Join a league and make picks to earn Predix tokens
              </p>
            </CardContent>
          </Card>
        )}

        {/* On-chain error warning */}
        {data?.onchain?.error && (
          <div className="rounded-xl bg-warning/10 border border-warning/30 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">On-chain data unavailable</p>
                <p className="text-xs text-muted-foreground mt-0.5">{data.onchain.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
