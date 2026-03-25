import { PageHeader } from "@/components/shared/page-header";

export default function TimelinePage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Application Timeline"
        description="Interactive timeline with AMCAS, TMDSAS, and AACOMAS deadlines, milestones, and reminders."
      />
      {/* TODO: Visual timeline with deadline alerts and progress tracking */}
    </div>
  );
}
