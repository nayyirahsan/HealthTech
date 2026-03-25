import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Settings"
        description="Account settings, profile updates, and notification preferences."
      />
      {/* TODO: Profile edit form, notification toggles, saved schools management */}
    </div>
  );
}
