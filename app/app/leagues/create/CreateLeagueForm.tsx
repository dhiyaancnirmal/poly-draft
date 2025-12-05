"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { calculateLeagueDates, calculateTotalBuyInCents, formatDateOnly, LeagueType } from "@/lib/leagueDates";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { createLeague as createPaidLeague } from "./actions";

type FormErrors = Partial<Record<string, string>>;

const PRICE_PER_MARKET_CENTS = 100;

const dailyPickOptions = [1, 2, 3];
const weeklyPickOptions = Array.from({ length: 13 }, (_, i) => i + 2);

export function CreateLeagueForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"sim" | "paid">("sim");
  const [type, setType] = useState<LeagueType>("daily");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState<number>(7);
  const [picksPerPeriod, setPicksPerPeriod] = useState<number>(2);
  const [maxParticipants, setMaxParticipants] = useState<number>(8);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { startDateText, endDateText, totalBuyInDollars } = useMemo(() => {
    const { startDate, endDate } = calculateLeagueDates(type, Math.max(duration, 1));
    const total = calculateTotalBuyInCents(picksPerPeriod, Math.max(duration, 1), PRICE_PER_MARKET_CENTS);
    return {
      startDateText: formatDateOnly(startDate),
      endDateText: formatDateOnly(endDate),
      totalBuyInDollars: (total / 100).toFixed(2),
    };
  }, [type, duration, picksPerPeriod]);

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = "Required";
    if (!Number.isInteger(duration) || duration <= 0) nextErrors.duration = "Must be > 0";
    if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 12 || maxParticipants % 2 !== 0) {
      nextErrors.max_participants = "Even, 2-12";
    }
    if (!Number.isInteger(picksPerPeriod) || picksPerPeriod <= 0) {
      nextErrors.picks_per_period = "Invalid";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    setJoinCode(null);

    if (!validate()) return;

    const formData = new FormData(event.currentTarget);
    formData.set("type", type);
    formData.set("duration_periods", String(duration));
    formData.set("picks_per_period", String(picksPerPeriod));
    formData.set("max_participants", String(maxParticipants));
    formData.set("mode", mode);

    startTransition(async () => {
      try {
        if (mode === "sim") {
          const res = await fetch("/api/leagues/simulated/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              type,
              durationPeriods: duration,
              picksPerPeriod,
              maxParticipants,
              cadence: type,
              marketsPerPeriod: picksPerPeriod,
            }),
          });
          const data = await res.json();
          if (!res.ok || data?.success === false) {
            throw new Error(data?.error || "Failed to create league");
          }

          setJoinCode(data.league?.joinCode || data.league?.join_code);
          router.push(`/app/leagues/${data.league?.id}`);
          return;
        }

        const result = await createPaidLeague(formData);
        if (!result.success) {
          throw new Error(result.error);
        }
        setJoinCode(result.joinCode);
        router.push(`/app/leagues/${result.leagueId}`);
      } catch (err: any) {
        setServerError(err?.message || "Failed to create league");
      }
    });
  };

  const pickOptions = type === "daily" ? dailyPickOptions : weeklyPickOptions;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-accent/50">
        {(["sim", "paid"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium",
              mode === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {option === "sim" ? "Sim (free)" : "Paid"}
          </button>
        ))}
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-accent/50">
        {(["daily", "weekly"] as LeagueType[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium",
              type === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {option === "daily" ? "Daily" : "Weekly"}
          </button>
        ))}
      </div>

      <Input
        name="name"
        label="League name"
        placeholder="e.g., Alpha Signals"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />

      <div className="grid gap-3 grid-cols-2">
        <Input
          name="duration_periods"
          label={type === "daily" ? "Days" : "Weeks"}
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          error={errors.duration}
        />
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Picks/{type === "daily" ? "day" : "week"}</label>
          <select
            name="picks_per_period"
            value={picksPerPeriod}
            onChange={(e) => setPicksPerPeriod(Number(e.target.value))}
            className="w-full h-11 rounded-xl border border-border/70 bg-card/50 px-3 text-sm text-foreground"
          >
            {pickOptions.map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        name="max_participants"
        label="Max players (even, 2-12)"
        type="number"
        min={2}
        max={12}
        step={2}
        value={maxParticipants}
        onChange={(e) => setMaxParticipants(Number(e.target.value))}
        error={errors.max_participants}
      />

      {/* Summary */}
      <Card variant="outline" className="bg-accent/20">
        <CardContent className="p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Schedule</span>
            <span className="text-foreground">{startDateText} → {endDateText}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Buy-in</span>
            <span className="text-foreground">${totalBuyInDollars}/player</span>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <p className="text-sm text-error">{serverError}</p>
      )}

      {joinCode && (
        <div className="flex items-center gap-2 text-sm text-success">
          <Check className="h-4 w-4" />
          Created! Code: {joinCode}
        </div>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Create League
      </Button>
    </form>
  );
}
