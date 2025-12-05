"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, Bell, Shield, Palette, HelpCircle, LogOut, ChevronRight, Wallet, Copy, ExternalLink } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMiniAppUser } from "@/lib/hooks";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

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
        { icon: Palette, label: "Appearance", value: "Dark" },
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
    <AppLayout title="Settings">
      <div className="p-4 space-y-6 pb-24">
        {/* Profile Section */}
        {loading || miniLoading ? (
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-surface-highlight rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-surface-highlight rounded w-32" />
                  <div className="h-4 bg-surface-highlight rounded w-24" />
                </div>
              </div>
            </div>
          </Card>
        ) : (miniUser || profile) ? (
          <Card className="p-6 space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <div className="relative">
                {(miniUser?.pfpUrl || profile?.avatar_url) ? (
                  <img
                    src={miniUser?.pfpUrl || profile?.avatar_url || ""}
                    alt={miniUser?.displayName || miniUser?.username || profile?.display_name || profile?.username || 'User'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center border-2 border-primary/20">
                    <span className="text-2xl font-bold text-white">
                      {(miniUser?.displayName || miniUser?.username || profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {profile?.auth_method === 'farcaster' && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center border-2 border-background">
                    <span className="text-xs">🟣</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-text truncate">
                  {miniUser?.displayName || miniUser?.username || profile?.display_name || profile?.username || (profile?.fid ? `FID ${profile.fid}` : 'Anonymous User')}
                </h2>
                {(miniUser?.username || profile?.username) && (
                  <p className="text-sm text-muted">@{miniUser?.username || profile?.username}</p>
                )}
                {(miniUser?.fid ?? profile?.fid) && (
                  <Badge variant="default" className="mt-2 bg-purple-500/10 text-purple-400 border-purple-500/20">
                    FID: {miniUser?.fid ?? profile?.fid}
                  </Badge>
                )}
                {miniError && (
                  <p className="text-xs text-destructive mt-1">{miniError}</p>
                )}
                {isInMiniApp === false && (
                  <p className="text-xs text-muted mt-1">Open in the Base app to see your live profile data.</p>
                )}
              </div>
            </div>

            {/* Stats */}
            {profile ? (
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-surface-highlight/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{profile.wins}</p>
                  <p className="text-xs text-muted">Wins</p>
                </div>
                <div className="text-center border-x border-surface-highlight/50">
                  <p className="text-2xl font-bold text-primary">{profile.total_leagues}</p>
                  <p className="text-xs text-muted">Leagues</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{profile.total_points}</p>
                  <p className="text-xs text-muted">Points</p>
                </div>
              </div>
            ) : null}

            {/* Wallet Address */}
            {profile?.wallet_address && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Wallet Address</p>
                <div className="flex items-center gap-2 p-3 bg-surface-highlight/30 rounded-lg">
                  <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
                  <code className="text-sm text-text font-mono flex-1 truncate">
                    {profile.wallet_address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(profile.wallet_address!)}
                    className="p-2 h-auto"
                  >
                    {copied ? (
                      <span className="text-xs text-success">✓</span>
                    ) : (
                      <Copy className="w-4 h-4 text-muted" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://basescan.org/address/${profile.wallet_address}`, '_blank')}
                    className="p-2 h-auto"
                  >
                    <ExternalLink className="w-4 h-4 text-muted" />
                  </Button>
                </div>
              </div>
            )}

            {/* Farcaster Link */}
            {profile?.username && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => window.open(`https://warpcast.com/${profile.username}`, '_blank')}
              >
                View on Warpcast
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </Card>
        ) : null}

        {/* Settings Groups */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="px-1 text-xs font-bold text-muted uppercase tracking-wider">{section.title}</h3>
              <Card className="divide-y divide-surface-highlight/50">
                {section.items.map((item, itemIdx) => (
                  <Button
                    key={itemIdx}
                    variant="ghost"
                    className="w-full justify-between px-4 py-4 h-auto hover:bg-surface-highlight/20 rounded-none first:rounded-t-card last:rounded-b-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${item.variant === 'danger' ? 'bg-error/10 text-error' : 'bg-surface-highlight/50 text-primary'}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={`font-medium ${item.variant === 'danger' ? 'text-error' : 'text-text'}`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-sm text-muted">{item.value}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted/50" />
                    </div>
                  </Button>
                ))}
              </Card>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 pt-4">
          <p className="text-xs text-muted">Made with ❤️ for Base</p>
          <p className="text-[10px] text-muted/50">© 2024 PolyDraft Inc.</p>
        </div>
      </div>
    </AppLayout>
  );
}