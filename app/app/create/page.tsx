"use client";
 
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Users, CalendarRange, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase";
  
export default function CreateLeaguePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isCadenceModalOpen, setIsCadenceModalOpen] = useState(false);
    const [cadenceType, setCadenceType] = useState<"daily" | "weekly">("daily");
    const [marketsPerPeriod, setMarketsPerPeriod] = useState<number>(1);
    const [leagueMode, setLeagueMode] = useState<"polymarket" | "simulated">("polymarket");
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const cadenceOptions = useMemo(() => ({
        daily: [1, 2, 3],
        weekly: [3, 5, 7],
    }), []);

    const leagueModeOptions: Array<{
        id: "polymarket" | "simulated";
        title: string;
        description: string;
        badge: string;
    }> = [
        {
            id: "polymarket",
            title: "Polymarket Routing",
            description: "Send picks to real markets and track live pricing. Best for on-chain play.",
            badge: "Live markets"
        },
        {
            id: "simulated",
            title: "Simulated Picks",
            description: "Practice mode using in-app currency (coming soon). No real funds routed.",
            badge: "Sandbox"
        }
    ];
 
     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!user) {
            alert('Please sign in to create a league');
            return;
        }

        setIsLoading(true);
        
        try {
            const formData = new FormData(e.currentTarget);
            const maxPlayersValue = parseInt(formData.get('max_players') as string) || 10;
            const creatorAddress = (user.email || (user.user_metadata as any)?.wallet_address || user.id) as string;
            const seasonLengthDays = cadenceType === "daily" ? 7 : 28;
            const endTime = new Date(Date.now() + seasonLengthDays * 24 * 60 * 60 * 1000).toISOString();
            const leagueData: Database["public"]["Tables"]["leagues"]["Insert"] = {
                name: (formData.get('name') as string)?.trim(),
                description: (formData.get('description') as string)?.trim() || null,
                max_players: maxPlayersValue,
                creator_id: user.id,
                creator_address: creatorAddress,
                end_time: endTime,
                status: "open",
                mode: leagueMode === "polymarket" ? "live" : "social",
            };

            const { data: newLeague, error } = await supabase
                .from('leagues')
                .insert(leagueData as any)
                .select()
                .single();

            if (error) {
                throw error;
            }
            
            if (newLeague) {
                router.push('/app');
            }
        } catch (error) {
            console.error('Error creating league:', error);
            alert('Failed to create league. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout title="Create League">
            <div className="p-4 space-y-6 pb-24">
                <Link href="/app" className="inline-flex items-center text-sm text-muted transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Home
                </Link>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-4 space-y-5">
                        <div className="space-y-1">
                            <p className="text-xl font-semibold text-text">League basics</p>
                            <p className="text-sm text-muted">Pick a mode, name it, and choose cadence.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                League type
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {leagueModeOptions.map((option) => {
                                    const isActive = leagueMode === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setLeagueMode(option.id)}
                                            className={`
                                                flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all
                                                ${isActive ? "border-primary bg-primary/10 shadow-card" : "border-border/70 bg-surface/70 hover:border-primary/60"}
                                            `}
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-text">{option.title}</p>
                                                <p className="text-xs text-muted leading-relaxed">{option.description}</p>
                                            </div>
                                            <Badge className={isActive ? "bg-primary text-primary-foreground" : "bg-surface-highlight text-muted"}>
                                                {option.badge}
                                            </Badge>
                                        </button>
                                    );
                                })}
                            </div>
                            <input type="hidden" name="league_mode" value={leagueMode} />
                        </div>

                        <Input
                            name="name"
                            label="League Name"
                            placeholder="e.g. Crypto Whales 2024"
                            required
                        />

                        <Input
                            name="description"
                            label="Description (Optional)"
                            placeholder="A fun league for crypto enthusiasts"
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text">Max Players</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <Input
                                    name="max_players"
                                    type="number"
                                    className="pl-9"
                                    placeholder="10"
                                    min="2"
                                    max="100"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text flex items-center gap-2">
                                <CalendarRange className="w-4 h-4 text-primary" />
                                Draft cadence & markets
                            </label>
                            <p className="text-xs text-muted">
                                Everyone sees the same markets; each outcome can be picked once per market.
                            </p>
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface/70 px-3 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-text capitalize">{cadenceType}</p>
                                    <p className="text-xs text-muted">
                                        {cadenceType === "daily"
                                            ? `${marketsPerPeriod} market${marketsPerPeriod > 1 ? "s" : ""} per day`
                                            : `${marketsPerPeriod} markets per week`}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCadenceModalOpen(true)}
                                >
                                    Edit
                                </Button>
                            </div>
                            <input type="hidden" name="cadence_type" value={cadenceType} />
                            <input type="hidden" name="markets_per_period" value={marketsPerPeriod} />
                        </div>
                    </Card>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full shadow-lg shadow-primary/20"
                        loading={isLoading}
                    >
                        Create League
                    </Button>
                </form>

                {isCadenceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCadenceModalOpen(false)} />
                        <Card className="relative w-full max-w-md p-5 space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-text">Select cadence</p>
                                    <p className="text-xs text-muted">Choose period and markets per period.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCadenceModalOpen(false)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-highlight text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    aria-label="Close cadence modal"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {(["daily", "weekly"] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setCadenceType(type);
                                            const fallback = cadenceOptions[type][0];
                                            if (!cadenceOptions[type].includes(marketsPerPeriod)) {
                                                setMarketsPerPeriod(fallback);
                                            }
                                        }}
                                        className={`
                                            rounded-lg border px-3 py-3 text-left transition-colors
                                            ${cadenceType === type
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border/70 bg-surface/70 text-foreground"}
                                        `}
                                    >
                                        <p className="text-sm font-semibold capitalize">{type}</p>
                                        <p className="text-xs text-muted">
                                            {type === "daily" ? "Fixed markets each day" : "Fixed markets each week"}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-text uppercase tracking-wide">Markets per {cadenceType}</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {cadenceOptions[cadenceType].map((count) => (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => setMarketsPerPeriod(count)}
                                            className={`
                                                rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
                                                ${marketsPerPeriod === count
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border/70 bg-surface/70 text-foreground"}
                                            `}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCadenceModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setIsCadenceModalOpen(false)}
                                >
                                    Save
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
