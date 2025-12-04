"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CreateLeaguePage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => setIsLoading(false), 2000);
    };

    return (
        <AppLayout title="Create League">
            <div className="p-4 space-y-6 pb-24">
                <Link href="/app" className="inline-flex items-center text-sm text-muted hover:text-text transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Home
                </Link>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text">Create New League</h1>
                    <p className="text-sm text-muted">Set up your fantasy league and invite friends.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-4 space-y-4">
                        <Input
                            label="League Name"
                            placeholder="e.g. Crypto Whales 2024"
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text">Entry Fee</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <Input
                                        type="number"
                                        className="pl-9"
                                        placeholder="10"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text">Max Players</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <Input
                                        type="number"
                                        className="pl-9"
                                        placeholder="100"
                                        min="2"
                                        required
                                    />
                                </div>
                            </div>
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
            </div>
        </AppLayout>
    );
}
