"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { InviteCard } from "@/components/features/InviteCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";

type InviteStatus = "pending" | "accepted" | "declined" | "expired";

type Invite = {
  id: string;
  leagueId: string;
  leagueName: string;
  inviterName: string;
  inviterAvatar?: string;
  memberCount: number;
  maxMembers: number;
  lockTime?: string;
  status: InviteStatus;
  memberAvatars?: string[];
};

// Mock invites data - in a real app this would come from the server
const mockInvites: Invite[] = [
  {
    id: "inv-1",
    leagueId: "league-1",
    leagueName: "Weekend Fun!",
    inviterName: "John Geller",
    memberCount: 4,
    maxMembers: 8,
    lockTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    status: "pending" as const,
    memberAvatars: [],
  },
  {
    id: "inv-2",
    leagueId: "league-2",
    leagueName: "Crypto Volatility Pool",
    inviterName: "Sarah Chen",
    memberCount: 6,
    maxMembers: 12,
    lockTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    status: "pending" as const,
    memberAvatars: [],
  },
  {
    id: "inv-3",
    leagueId: "league-3",
    leagueName: "Election Megapool",
    inviterName: "Mike Johnson",
    memberCount: 10,
    maxMembers: 12,
    status: "accepted" as const,
    memberAvatars: [],
  },
];

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState(mockInvites);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pendingInvites = invites.filter((inv) => inv.status === "pending");
  const pastInvites = invites.filter((inv) => inv.status !== "pending");

  const handleAccept = async (inviteId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setInvites((prev) =>
      prev.map((inv) =>
        inv.id === inviteId ? { ...inv, status: "accepted" as const } : inv
      )
    );

    // Navigate to the league
    const invite = invites.find((inv) => inv.id === inviteId);
    if (invite) {
      router.push(`/app/leagues/${invite.leagueId}`);
    }
  };

  const handleDecline = async (inviteId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setInvites((prev) =>
      prev.map((inv) =>
        inv.id === inviteId ? { ...inv, status: "declined" as const } : inv
      )
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <AppLayout 
      title="Invites" 
      showInvitesBadge={false}
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-10 w-10"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      }
    >
      <div className="p-4 space-y-6">
        {/* Pending Invites */}
        {pendingInvites.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pending Invites ({pendingInvites.length})
            </h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <InviteCard
                  key={invite.id}
                  invite={invite}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          </section>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">
                No Pending Invites
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                You&apos;re all caught up! Check back later for new league invitations.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/app/leagues")}
              >
                Browse Leagues
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Past Invites */}
        {pastInvites.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Past Invites
            </h2>
            <div className="space-y-3">
              {pastInvites.map((invite) => (
                <InviteCard
                  key={invite.id}
                  invite={invite}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

