import { PageHeader } from "@/components/shared/page-header";

export default function UTBenchmarksPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="UT Austin Benchmarks"
        description="UT Austin-specific acceptance data — GPA/MCAT distributions, top majors, and matriculation trends from HPO reports."
      />
      {/* TODO: Charts from UT HPO data — GPA distribution, MCAT distribution, outcomes by school */}
    </div>
  );
}
