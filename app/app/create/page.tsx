"use client";
 
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { createLeague } from "@/app/actions/leagues";
import { motion } from "framer-motion";
  
export default function CreateLeaguePage() {
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
 
     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!user) {
            alert('Please sign in to create a league');
            return;
        }

        setIsLoading(true);
        
        try {
            const formData = new FormData(e.currentTarget);
            const newLeague = await createLeague(formData);
            
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
            <motion.div
                className="p-4 space-y-6 pb-24"
                initial={{ y: 32, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
            >
                <Link href="/app/leagues" className="inline-flex items-center text-sm text-muted hover:text-text transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Leagues
                </Link>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text">Create New League</h1>
                    <p className="text-sm text-muted">Set up your fantasy league and invite friends.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-4 space-y-4">
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
 
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text">Entry Fee</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <Input
                                        name="entry_fee"
                                        type="number"
                                        className="pl-9"
                                        placeholder="10"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
 
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text">Max Players</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <Input
                                        name="max_players"
                                        type="number"
                                        className="pl-9"
                                        placeholder="100"
                                        min="2"
                                        max="100"
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
            </motion.div>
        </AppLayout>
    );
}
