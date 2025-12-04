"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, Bell, Shield, Palette, HelpCircle, LogOut, ChevronRight, Wallet } from "lucide-react";

import { LucideIcon } from "lucide-react";

interface SettingsItem {
  icon: LucideIcon;
  label: string;
  value?: string;
  variant?: 'default' | 'danger';
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function SettingsPage() {
  const sections: SettingsSection[] = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile Settings", value: "CryptoKing.eth" },
        { icon: Wallet, label: "Connected Wallet", value: "0x12...5678" },
        { icon: Bell, label: "Notifications", value: "On" },
      ]
    },
    {
      title: "App Preferences",
      items: [
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
        {/* App Info */}
        <div className="text-center space-y-2 py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-2xl font-bold text-white">P</span>
          </div>
          <h2 className="text-xl font-bold text-text">PolyDraft</h2>
          <Badge variant="default" className="bg-surface-highlight/50">v1.0.0 (Beta)</Badge>
        </div>

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