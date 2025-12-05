"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Wallet, 
  Copy, 
  ExternalLink,
  Check
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMiniAppUser } from "@/lib/hooks";
import { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/hooks/useTheme";
import { cn } from "@/lib/utils";

interface SettingsItem {
  icon: LucideIcon;
  label: string;
  value?: string;
  variant?: 'default' | 'danger';
  onClick?: () => void;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function SettingsPage() {
  const { profile, loading } = useUserProfile();
  const { user: miniUser, isInMiniApp, loading: miniLoading, error: miniError } = useMiniAppUser();
  const [copied, setCopied] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections: SettingsSection[] = [
    {
      title: "App Preferences",
      items: [
        { icon: Bell, label: "Notifications", value: "On" },
        {
          icon: Palette,
          label: "Appearance",
          value: resolvedTheme === "dark" ? "Dark" : "Light",
          onClick: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
        },
        { icon: Shield, label: "Privacy & Security" },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center" },
        { icon: LogOut, label: "Sign Out", variant: "danger" },
      ]
    }
  ];

  return (
    <AppLayout title="Settings" showInvitesBadge={false}>
      <div className="p-4 space-y-6 pb-24">
        {/* Profile Section */}
        {loading || miniLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-accent rounded w-32" />
                    <div className="h-4 bg-accent rounded w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (miniUser || profile) ? (
          <Card>
            <CardContent className="p-5 space-y-5">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  {(miniUser?.pfpUrl || profile?.avatar_url) ? (
                    <img
                      src={miniUser?.pfpUrl || profile?.avatar_url || ""}
                      alt={miniUser?.displayName || miniUser?.username || profile?.display_name || profile?.username || 'User'}
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary/15 rounded-xl flex items-center justify-center ring-2 ring-primary/20">
                      <span className="text-xl font-bold text-primary">
                        {(miniUser?.displayName || miniUser?.username || profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {profile?.auth_method === 'farcaster' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center ring-2 ring-card">
                      <span className="text-xs">🟣</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">
                    {miniUser?.displayName || miniUser?.username || profile?.display_name || profile?.username || (profile?.fid ? `FID ${profile.fid}` : 'Anonymous User')}
                  </h2>
                  {(miniUser?.username || profile?.username) && (
                    <p className="text-sm text-muted-foreground">@{miniUser?.username || profile?.username}</p>
                  )}
                  {(miniUser?.fid ?? profile?.fid) && (
                    <Badge variant="info" size="sm" className="mt-1.5">
                      FID: {miniUser?.fid ?? profile?.fid}
                    </Badge>
                  )}
                  {miniError && (
                    <p className="text-xs text-error mt-1">{miniError}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {profile && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-accent/30 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{profile.wins}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Wins</p>
                  </div>
                  <div className="rounded-xl bg-accent/30 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{profile.total_leagues}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Leagues</p>
                  </div>
                  <div className="rounded-xl bg-accent/30 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{profile.total_points}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Points</p>
                  </div>
                </div>
              )}

              {/* Wallet Address */}
              {profile?.wallet_address && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Wallet Address
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-accent/30 rounded-xl">
                    <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
                    <code className="text-sm text-foreground font-mono flex-1 truncate">
                      {profile.wallet_address}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(profile.wallet_address!)}
                      className="h-8 w-8"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://basescan.org/address/${profile.wallet_address}`, '_blank')}
                      className="h-8 w-8"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Farcaster Link */}
              {profile?.username && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`https://warpcast.com/${profile.username}`, '_blank')}
                >
                  View on Warpcast
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Settings Groups */}
        <div className="space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {section.title}
              </h3>
              <Card>
                <div className="divide-y divide-border/40">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      type="button"
                      onClick={item.onClick}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 transition-colors",
                        "hover:bg-accent/50",
                        "first:rounded-t-2xl last:rounded-b-2xl"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-xl",
                          item.variant === 'danger' 
                            ? 'bg-error/10 text-error' 
                            : 'bg-accent text-primary'
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className={cn(
                          "font-medium",
                          item.variant === 'danger' ? 'text-error' : 'text-foreground'
                        )}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.value && (
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 pt-4">
          <p className="text-xs text-muted-foreground">Made with ❤️ for Base</p>
          <p className="text-[10px] text-muted-foreground/50">© 2024 PolyDraft Inc.</p>
        </div>
      </div>
    </AppLayout>
  );
}
