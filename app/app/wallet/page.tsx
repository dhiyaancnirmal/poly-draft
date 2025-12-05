"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  ShieldCheck,
  Wallet,
  X,
  AlertCircle,
  Activity,
} from "lucide-react";
import { usePredixTransparency } from "@/lib/hooks/usePredix";

type TxType = "entry" | "prize" | "transfer";

type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: TxType;
  status: "Completed" | "Pending" | "Failed";
  dateISO: string;
  chain?: string;
  reference?: string;
};

const walletBalance = {
  total: 123.45,
  currency: "USDC",
  pendingPrizes: 10.0,
  inLeagues: 25.0,
};

const proxyBalance = {
  total: 42.75,
  currency: "USDC",
};

const proxyWallet = {
  chain: "Polygon",
  address: "0x12d4c7eA91b0F28d2bC9c83989AF",
  explorerUrl: "https://polygonscan.com/address/0x12d4c7eA91b0F28d2bC9c83989AF",
};

const transactions: Transaction[] = [
  {
    id: "t1",
    title: "League entry – Election Megapool",
    subtitle: "Today · 2:14 PM",
    amount: -5.0,
    type: "entry",
    status: "Completed",
    dateISO: new Date().toISOString(),
    chain: "Polygon",
    reference: "0xabc123",
  },
  {
    id: "t2",
    title: "Prize – Crypto Volatility League",
    subtitle: "Today · 10:02 AM",
    amount: 20.0,
    type: "prize",
    status: "Completed",
    dateISO: new Date().toISOString(),
    chain: "Polygon",
    reference: "0xdef456",
  },
  {
    id: "t3",
    title: "On-chain transfer – Polygon",
    subtitle: "Yesterday · 6:31 PM",
    amount: -2.5,
    type: "transfer",
    status: "Pending",
    dateISO: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    chain: "Polygon",
    reference: "0xghi789",
  },
  {
    id: "t4",
    title: "League entry – Finals Pool",
    subtitle: "2 days ago · 8:05 PM",
    amount: -10.0,
    type: "entry",
    status: "Completed",
    dateISO: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    chain: "Polygon",
    reference: "0xjkl101",
  },
  {
    id: "t5",
    title: "Prize – MLB Friday Pick",
    subtitle: "3 days ago · 9:12 AM",
    amount: 14.5,
    type: "prize",
    status: "Completed",
    dateISO: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    chain: "Polygon",
    reference: "0xjkl102",
  },
];

const transactionFilters: { key: "all" | TxType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "entry", label: "Entries" },
  { key: "prize", label: "Prizes" },
  { key: "transfer", label: "Transfers" },
];

function formatAmount(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount > 0 ? "+" : amount < 0 ? "-" : ""}${formatter.format(Math.abs(amount))} ${currency}`;
}

function formatAmountNoSign(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatter.format(Math.abs(amount))} ${currency}`;
}

function dayLabel(dateISO: string) {
  const date = new Date(dateISO);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date.setHours(0, 0, 0, 0)).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This week";
  return "Earlier";
}

function amountColor(amount: number) {
  if (amount > 0) return "text-success";
  if (amount < 0) return "text-error";
  return "text-foreground";
}

export default function WalletPage() {
  const [filter, setFilter] = useState<"all" | TxType>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const {
    data: predix,
    isLoading: predixLoading,
    error: predixError,
  } = usePredixTransparency();

  const groupedTransactions = useMemo(() => {
    const filtered = filter === "all" ? transactions : transactions.filter((tx) => tx.type === filter);
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      const label = dayLabel(tx.dateISO);
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });
    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }, [filter]);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(proxyWallet.address).catch(() => {});
    }
  };

  return (
    <AppLayout title="Wallet">
      <div className="p-4 space-y-5 pb-8">
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Need help?
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-lg font-semibold text-foreground">Base</p>
              <p className="text-3xl font-bold text-foreground">
                {formatAmountNoSign(walletBalance.total, walletBalance.currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-lg font-semibold text-foreground">Polygon</p>
              <p className="text-3xl font-bold text-foreground">
                {formatAmountNoSign(proxyBalance.total, proxyBalance.currency)}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="font-mono">{`${proxyWallet.address.slice(0, 6)}...${proxyWallet.address.slice(-4)}`}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full p-1.5 text-muted hover:text-foreground hover:bg-surface-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <Link
                  href={proxyWallet.explorerUrl}
                  className="rounded-full p-1.5 text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  target="_blank"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-foreground">Predix (Base)</p>
              <p className="text-xs text-muted">On-chain balance, settlements, transparency</p>
            </div>
            <Badge variant="outline">Transparency</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {predixError ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{predixError.message}</span>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-surface/80 p-3 space-y-1">
                <p className="text-xs uppercase font-semibold text-muted">Balance</p>
                {predixLoading ? (
                  <div className="h-6 w-24 rounded bg-surface-highlight animate-pulse" />
                ) : (
                  <p className="text-xl font-bold text-foreground">
                    {predix?.onchain?.balance?.formatted ?? "—"}
                  </p>
                )}
                {predix?.chain?.tokenAddress && predix?.chain?.explorerBaseUrl ? (
                  <Link
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    href={`${predix.chain.explorerBaseUrl}/token/${predix.chain.tokenAddress}`}
                    target="_blank"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Token on BaseScan
                  </Link>
                ) : null}
              </div>

              <div className="rounded-lg border border-border/60 bg-surface/80 p-3 space-y-2">
                <p className="text-xs uppercase font-semibold text-muted">Settlement status</p>
                {predixLoading ? (
                  <div className="h-10 rounded bg-surface-highlight animate-pulse" />
                ) : predix?.settlements && predix.settlements.length > 0 ? (
                  <div className="space-y-1">
                    {predix.settlements.slice(0, 3).map((s: any) => (
                      <div key={s.league_id} className="flex items-center justify-between text-sm">
                        <span className="text-muted">{s.league_id.slice(0, 6)}…</span>
                        <Badge
                          variant={
                            s.settlement_status === "confirmed"
                              ? "success"
                              : s.settlement_status === "failed"
                                ? "error"
                                : "default"
                          }
                        >
                          {s.settlement_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">No settlements yet</p>
                )}
              </div>

              <div className="rounded-lg border border-border/60 bg-surface/80 p-3 space-y-2">
                <p className="text-xs uppercase font-semibold text-muted">Links</p>
                <div className="space-y-1 text-sm">
                  {predix?.chain?.managerAddress && predix?.chain?.explorerBaseUrl ? (
                    <Link
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      href={`${predix.chain.explorerBaseUrl}/address/${predix.chain.managerAddress}`}
                      target="_blank"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Predix Manager
                    </Link>
                  ) : (
                    <p className="text-muted text-sm">Manager address pending</p>
                  )}
                  {predix?.combined?.find((e: any) => e.txHash && predix.chain?.explorerBaseUrl) ? (
                    <Link
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      href={`${predix?.chain?.explorerBaseUrl}/tx/${predix?.combined?.find(
                        (e: any) => e.txHash
                      )?.txHash}`}
                      target="_blank"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Latest tx
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Recent Predix events</p>
              </div>
              {predixLoading ? (
                <div className="space-y-2">
                  <div className="h-10 rounded bg-surface-highlight animate-pulse" />
                  <div className="h-10 rounded bg-surface-highlight animate-pulse" />
                </div>
              ) : predix?.combined && predix.combined.length > 0 ? (
                <div className="space-y-2">
                  {predix.combined.slice(0, 6).map((event: any, idx: number) => {
                    const explorer = predix?.chain?.explorerBaseUrl
                    const txLink = explorer && event.txHash ? `${explorer}/tx/${event.txHash}` : null
                    const status =
                      event.txStatus ||
                      (event.txHash ? 'confirmed' : event.blockNumber ? 'confirmed' : 'pending')
                    const statusVariant =
                      status === 'confirmed'
                        ? 'success'
                        : status === 'failed'
                          ? 'error'
                          : 'default'
                    return (
                      <div
                        key={event.id || event.txHash || idx}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/70 px-3 py-2 text-sm"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant={event.source === 'onchain' ? "outline" : "info"}>
                              {event.source}
                            </Badge>
                            <span className="font-semibold capitalize text-foreground">
                              {event.action}
                            </span>
                          </div>
                          <div className="text-xs text-muted">
                            {event.outcomeSide || event.outcome_hash ? event.outcomeSide : '—'} •{" "}
                            {event.leagueId || event.leagueHash ? (event.leagueId || event.leagueHash).toString().slice(0, 8) : 'league'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant}>{status}</Badge>
                          {txLink ? (
                            <Link href={txLink} target="_blank" className="text-primary hover:underline">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">No Predix events yet.</p>
              )}
              {predix?.onchain?.error ? (
                <p className="text-xs text-warning">On-chain fetch warning: {predix.onchain.error}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-foreground">Recent activity</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {transactionFilters.map((option) => (
                <Button
                  key={option.key}
                  variant={filter === option.key ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFilter(option.key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {groupedTransactions.map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="sticky top-0 z-10 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-muted backdrop-blur">
                    {group.label}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="w-full text-left rounded-lg border border-border/70 bg-surface/80 p-3 hover:border-primary/50 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{tx.title}</p>
                            <p className="text-xs text-muted">{tx.subtitle} · {tx.status}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-base font-bold ${amountColor(tx.amount)}`}>
                              {formatAmount(tx.amount, walletBalance.currency)}
                            </p>
                            {tx.chain ? <p className="text-[11px] text-muted">{tx.chain}</p> : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedTx ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-mobile rounded-t-2xl border border-border/60 bg-surface p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-lg font-semibold text-foreground">Transaction details</p>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="rounded-full p-2 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-foreground">
              <div className="flex justify-between">
                <span>Type</span>
                <span className="font-semibold capitalize">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Title</span>
                <span className="font-semibold text-right">{selectedTx.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-semibold">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className={`font-bold ${amountColor(selectedTx.amount)}`}>
                  {formatAmount(selectedTx.amount, walletBalance.currency)}
                </span>
              </div>
              {selectedTx.reference ? (
                <div className="flex items-center justify-between">
                  <span>Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{selectedTx.reference}</span>
                    <Link
                      href={`https://polygonscan.com/tx/${selectedTx.reference}`}
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      View on PolygonScan
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

