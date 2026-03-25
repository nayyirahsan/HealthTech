import { PageHeader } from "@/components/shared/page-header";

export default function ActivityTrackerPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Activity Tracker"
        description="Log and categorize your extracurriculars, clinical hours, research, and volunteering with benchmark comparisons."
      />
      {/* TODO: Hour logging forms + red/yellow/green benchmark indicators */}
    </div>
  );
}
