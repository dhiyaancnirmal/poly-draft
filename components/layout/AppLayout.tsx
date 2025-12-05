import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-surface/20">
          <div className="max-w-mobile mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-text">{title}</h1>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-mobile mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}