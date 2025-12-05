import { AppLayout } from "@/components/layout/AppLayout";
import { CreateLeagueForm } from "./CreateLeagueForm";

export default function CreateLeaguePage() {
  return (
    <AppLayout title="Create League">
      <div className="p-4 pb-32">
        <CreateLeagueForm />
      </div>
    </AppLayout>
  );
}
