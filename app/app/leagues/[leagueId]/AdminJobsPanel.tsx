"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Settings,
  RefreshCw,
  Calculator,
  FileCheck2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface AdminJobsPanelProps {
  leagueId: string;
  userWalletAddress?: string | null;
}

type JobName = "refresh-prices" | "resolutions" | "score" | "finalize" | "finalize-sweep";

type JobResult = {
  success: boolean;
  data?: any;
  error?: string;
  durationMs?: number;
};

const JOB_CONFIG: Record<JobName, { label: string; description: string; icon: React.ReactNode; endpoint: string; dangerous?: boolean }> = {
  "refresh-prices": {
    label: "Refresh Prices",
    description: "Fetch latest prices from Polymarket",
    icon: <RefreshCw className="h-4 w-4" />,
    endpoint: "/api/leagues/simulated/jobs/refresh-prices",
  },
  resolutions: {
    label: "Fetch Resolutions",
    description: "Check for resolved markets",
    icon: <FileCheck2 className="h-4 w-4" />,
    endpoint: "/api/leagues/simulated/jobs/resolutions",
  },
  score: {
    label: "Calculate Scores",
    description: "Compute scores for all picks",
    icon: <Calculator className="h-4 w-4" />,
    endpoint: "/api/leagues/simulated/jobs/score",
  },
  finalize: {
    label: "Finalize League",
    description: "Settle on-chain and close league",
    icon: <CheckCircle2 className="h-4 w-4" />,
    endpoint: "/api/leagues/simulated/jobs/finalize",
    dangerous: true,
  },
  "finalize-sweep": {
    label: "Sweep All Expired",
    description: "Finalize all expired leagues",
    icon: <Sparkles className="h-4 w-4" />,
    endpoint: "/api/leagues/simulated/jobs/finalize-sweep",
    dangerous: true,
  },
};

function isAdmin(walletAddress?: string | null): boolean {
  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;
  if (!adminWallet || !walletAddress) return false;
  return adminWallet.toLowerCase() === walletAddress.toLowerCase();
}

export function AdminJobsPanel({ leagueId, userWalletAddress }: AdminJobsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [runningJob, setRunningJob] = useState<JobName | null>(null);
  const [results, setResults] = useState<Record<JobName, JobResult>>({} as Record<JobName, JobResult>);

  // Gate access
  if (!isAdmin(userWalletAddress)) {
    return null;
  }

  const runJob = async (job: JobName) => {
    setRunningJob(job);
    setResults((prev) => ({ ...prev, [job]: undefined as any }));

    const config = JOB_CONFIG[job];
    const url = job === "finalize-sweep" 
      ? config.endpoint 
      : `${config.endpoint}?leagueId=${encodeURIComponent(leagueId)}`;

    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();

      setResults((prev) => ({
        ...prev,
        [job]: {
          success: res.ok && data.success !== false,
          data,
          error: data.error,
          durationMs: data.durationMs,
        },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [job]: {
          success: false,
          error: err?.message || "Network error",
        },
      }));
    } finally {
      setRunningJob(null);
    }
  };

  const jobs: JobName[] = ["refresh-prices", "resolutions", "score", "finalize"];

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-warning" />
            <h3 className="text-base font-semibold text-foreground">Admin / Test Controls</h3>
            <Badge variant="warning" size="sm">Dev Only</Badge>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 pt-0">
          <p className="text-xs text-muted-foreground">
            Trigger background jobs for this league. Results appear inline.
          </p>

          {/* Job Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {jobs.map((job) => {
              const config = JOB_CONFIG[job];
              const result = results[job];
              const isRunning = runningJob === job;
              const anyRunning = runningJob !== null;

              return (
                <div key={job} className="space-y-1.5">
                  <Button
                    variant={config.dangerous ? "destructive" : "outline"}
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => runJob(job)}
                    disabled={anyRunning}
                  >
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      config.icon
                    )}
                    <span className="truncate">{config.label}</span>
                  </Button>

                  {/* Result display */}
                  {result && (
                    <div
                      className={cn(
                        "rounded-lg p-2 text-xs",
                        result.success ? "bg-success/10 text-success" : "bg-error/10 text-error"
                      )}
                    >
                      {result.success ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                          <span>
                            OK{result.durationMs ? ` (${result.durationMs}ms)` : ""}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{result.error || "Failed"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sweep Button (full width) */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-2">
              Finalize all leagues past their end date:
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={() => runJob("finalize-sweep")}
              disabled={runningJob !== null}
            >
              {runningJob === "finalize-sweep" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Sweep All Expired Leagues
            </Button>

            {results["finalize-sweep"] && (
              <div
                className={cn(
                  "rounded-lg p-2 text-xs mt-2",
                  results["finalize-sweep"].success ? "bg-success/10 text-success" : "bg-error/10 text-error"
                )}
              >
                {results["finalize-sweep"].success ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                      <span>Sweep completed</span>
                    </div>
                    {results["finalize-sweep"].data?.processed !== undefined && (
                      <p className="text-muted-foreground">
                        Processed: {results["finalize-sweep"].data.processed} league(s)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{results["finalize-sweep"].error || "Failed"}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expanded result details */}
          {Object.entries(results).some(([_, r]) => r?.data && Object.keys(r.data).length > 2) && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View detailed results
              </summary>
              <pre className="mt-2 p-2 rounded-lg bg-accent/30 overflow-x-auto text-[10px] max-h-40">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      )}
    </Card>
  );
}

