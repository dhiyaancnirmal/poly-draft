"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { calculateLeagueDates, calculateTotalBuyInCents, formatDateOnly, LeagueType } from "@/lib/leagueDates";
import { createLeague } from "./actions";

type FormErrors = Partial<Record<string, string>>;

const PRICE_PER_MARKET_CENTS = 100;

const dailyPickOptions = [1, 2, 3];
const weeklyPickOptions = Array.from({ length: 13 }, (_, i) => i + 2); // 2..14

export function CreateLeagueForm() {
  const router = useRouter();
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
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!Number.isInteger(duration) || duration <= 0) nextErrors.duration = "Duration must be greater than 0";
    if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 12 || maxParticipants % 2 !== 0) {
      nextErrors.max_participants = "Must be even and between 2-12";
    }
    if (!Number.isInteger(picksPerPeriod) || picksPerPeriod <= 0) {
      nextErrors.picks_per_period = "Select a valid value";
    } else if (type === "daily" && !dailyPickOptions.includes(picksPerPeriod)) {
      nextErrors.picks_per_period = "Daily picks must be 1, 2, or 3";
    } else if (type === "weekly" && (picksPerPeriod < 2 || picksPerPeriod > 14)) {
      nextErrors.picks_per_period = "Weekly picks must be between 2 and 14";
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

    startTransition(async () => {
      const result = await createLeague(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setJoinCode(result.joinCode);
      router.push(`/app/leagues/${result.leagueId}`);
    });
  };

  const pickOptions = type === "daily" ? dailyPickOptions : weeklyPickOptions;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Create league</p>
          <h1 className="text-3xl font-bold text-foreground">Create League</h1>
        </div>
      </div>

      <Card className="border border-border/60 bg-surface/60 backdrop-blur">
        <CardHeader className="border-b border-border/50">
          <div className="flex gap-2 bg-muted/40 p-1 rounded-xl">
            {(["daily", "weekly"] as LeagueType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  type === option
                    ? "bg-primary text-primary-foreground shadow-[0_12px_28px_-18px_rgba(49,114,255,0.45)]"
                    : "text-foreground hover:bg-muted/70"
                }`}
              >
                {option === "daily" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              name="name"
              label="League name"
              placeholder="e.g., Alpha Signals Syndicate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="duration_periods"
                label={type === "daily" ? "How many days?" : "How many weeks?"}
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                error={errors.duration}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {type === "daily" ? "Daily picks" : "Weekly picks"}
                </label>
                <select
                  name="picks_per_period"
                  value={picksPerPeriod}
                  onChange={(e) => setPicksPerPeriod(Number(e.target.value))}
                  className="w-full h-11 rounded-lg border border-border/70 bg-surface/70 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {pickOptions.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
                {errors.picks_per_period ? <p className="text-sm text-red-500">{errors.picks_per_period}</p> : null}
              </div>
            </div>

            <Input
              name="max_participants"
              label="Max participants"
              type="number"
              min={2}
              max={12}
              step={2}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              error={errors.max_participants}
            />

            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2 text-sm text-foreground">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Schedule</span>
                <span>
                  {startDateText} → {endDateText}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Buy-in per participant</span>
                <span>${totalBuyInDollars}</span>
              </div>
              <p className="text-xs text-muted">
                Price per market is fixed at $1. Total = picks per {type === "daily" ? "day" : "week"} × duration × $1.
              </p>
            </div>

            {serverError ? <p className="text-sm text-red-500">{serverError}</p> : null}
            {joinCode ? (
              <div className="rounded-lg border border-green-500/60 bg-green-500/10 p-4 text-sm text-green-200">
                League created! Share this join code: <span className="font-semibold">{joinCode}</span>
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button type="submit" size="lg" loading={isPending} className="flex-1">
                Create league
              </Button>
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

