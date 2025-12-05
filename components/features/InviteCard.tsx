"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Clock, Users, Check, X, Trophy } from "lucide-react";

interface InviteCardProps {
  invite: {
    id: string;
    leagueId: string;
    leagueName: string;
    inviterName: string;
    inviterAvatar?: string;
    memberCount: number;
    maxMembers: number;
    lockTime?: string; // ISO date string
    status: "pending" | "accepted" | "declined" | "expired";
    memberAvatars?: string[];
  };
  onAccept?: (inviteId: string) => void;
  onDecline?: (inviteId: string) => void;
  className?: string;
}

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft("");
      return;
    }

    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        return "Expired";
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export function InviteCard({ invite, onAccept, onDecline, className }: InviteCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const countdown = useCountdown(invite.lockTime);

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept?.(invite.id);
    setIsAccepting(false);
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    await onDecline?.(invite.id);
    setIsDeclining(false);
  };

  const isPending = invite.status === "pending";
  const isExpired = invite.status === "expired" || countdown === "Expired";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        isExpired && "opacity-60",
        className
      )}
    >
      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 0% 0%, hsl(var(--primary) / 0.1), transparent 50%)`
        }}
      />

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Lock time */}
            {invite.lockTime && (
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className={cn(
                  "text-xs font-semibold",
                  isExpired ? "text-error" : "text-primary"
                )}>
                  {isExpired ? "EXPIRED" : `LOCKS IN: ${countdown}`}
                </span>
              </div>
            )}

            {/* League name */}
            <h3 className="font-semibold text-foreground text-base truncate">
              {invite.leagueName}
            </h3>

            {/* Inviter */}
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {invite.inviterName}
              </span>
            </div>
          </div>

          {/* Status badge or info button */}
          <Badge variant="outline" size="sm">
            Slate Info
          </Badge>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {/* Member avatars */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {invite.memberAvatars?.slice(0, 3).map((avatar, idx) => (
                <div
                  key={idx}
                  className="h-8 w-8 rounded-full bg-accent border-2 border-card overflow-hidden"
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
              ))}
              {invite.memberCount > 3 && (
                <div className="h-8 w-8 rounded-full bg-accent border-2 border-card flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  +{invite.memberCount - 3}
                </div>
              )}
            </div>

            <span className="ml-2 text-xs text-muted-foreground">
              {invite.memberCount}/{invite.maxMembers}
            </span>
          </div>

          {/* Actions */}
          {isPending && !isExpired ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDecline}
                loading={isDeclining}
                className="h-9 w-9 p-0 rounded-xl text-error hover:bg-error/10"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAccept}
                loading={isAccepting}
                className="h-9 px-4 rounded-xl"
              >
                <Check className="h-4 w-4 mr-1" />
                Join
              </Button>
            </div>
          ) : (
            <Badge
              variant={
                invite.status === "accepted" ? "success" :
                invite.status === "declined" ? "error" :
                "default"
              }
              size="sm"
            >
              {invite.status === "accepted" && "Joined"}
              {invite.status === "declined" && "Declined"}
              {invite.status === "expired" && "Expired"}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

