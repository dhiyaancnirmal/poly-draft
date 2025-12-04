"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <div className="p-4 space-y-6">
        {/* App Info */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-text">PolyDraft</h2>
          <Badge variant="info">Version 1.0.0</Badge>
          <p className="text-sm text-muted">
            Fantasy League Platform for Prediction Markets
          </p>
        </div>

        {/* Settings Options */}
        <div className="space-y-4">
          <div className="bg-surface/50 rounded-lg p-4">
            <h3 className="font-medium text-text mb-3">Account</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                👤 Profile Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                🔔 Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                🔒 Privacy
              </Button>
            </div>
          </div>

          <div className="bg-surface/50 rounded-lg p-4">
            <h3 className="font-medium text-text mb-3">App</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                🌙 Dark Mode
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                💾 Clear Cache
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                📊 Analytics
              </Button>
            </div>
          </div>

          <div className="bg-surface/50 rounded-lg p-4">
            <h3 className="font-medium text-text mb-3">Support</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                📚 Help Center
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                💬 Discord
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                🐛 Report Bug
              </Button>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-surface/20">
          <Button variant="outline" className="w-full">
            Sign Out
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted space-y-1">
          <p>Made with ❤️ for the Base ecosystem</p>
          <p>© 2024 PolyDraft</p>
        </div>
      </div>
    </AppLayout>
  );
}