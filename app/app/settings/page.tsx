"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, Bell, Shield, Palette, HelpCircle, LogOut } from "lucide-react";

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
                <User className="w-4 h-4 mr-3" />
                Profile Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Bell className="w-4 h-4 mr-3" />
                Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-3" />
                Privacy
              </Button>
            </div>
          </div>

          <div className="bg-surface/50 rounded-lg p-4">
            <h3 className="font-medium text-text mb-3">App</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <Palette className="w-4 h-4 mr-3" />
                Dark Mode
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Clear Cache
              </Button>
            </div>
          </div>

          <div className="bg-surface/50 rounded-lg p-4">
            <h3 className="font-medium text-text mb-3">Support</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-3" />
                Help Center
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted space-y-1">
          <p>Made with ❤️ for Base ecosystem</p>
          <p>© 2024 PolyDraft</p>
        </div>
      </div>
    </AppLayout>
  );
}