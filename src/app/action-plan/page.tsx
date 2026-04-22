"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PriorityActions } from "@/components/action-plan/priority-actions";
import { TaskCategories } from "@/components/action-plan/task-categories";

export default function ActionPlanPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Your Action Plan"
        description="Priority tasks and milestones for your med school application journey."
      />
      <PriorityActions />
      <TaskCategories />
    </div>
  );
}
