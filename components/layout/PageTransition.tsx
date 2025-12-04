"use client";

export function PageTransition({ children }: { children: React.ReactNode }) {
  // Simplify: keep navigation snappy by removing per-page motion animations.
  return <div className="w-full h-full">{children}</div>;
}
