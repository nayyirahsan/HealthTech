import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your premed journey — GPA, MCAT, activities, and timeline progress."
      />
      {/* TODO: Stats summary cards, quick actions, deadline alerts */}
    </div>
  );
}
