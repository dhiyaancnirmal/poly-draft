"use client";

import { useState, useTransition } from "react";
import { upsertTeamName } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Props = {
  leagueId: string;
  initialName?: string | null;
  onSaved?: (name: string) => void;
};

export function TeamNameForm({ leagueId, initialName = "", onSaved }: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await upsertTeamName(leagueId, name);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onSaved?.(result.teamName);
    });
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        label="Team name"
        placeholder="e.g., Moonshot Mavericks"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error || undefined}
      />
      <Button type="submit" size="lg" loading={isPending} className="w-full">
        {initialName ? "Update team name" : "Create team"}
      </Button>
    </form>
  );
}

