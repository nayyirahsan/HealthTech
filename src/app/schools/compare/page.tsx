import { PageHeader } from "@/components/shared/page-header";

export default function SchoolComparePage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Compare Schools"
        description="Side-by-side comparison of up to 4 medical schools."
      />
      {/* TODO: Multi-school comparison table with key metrics */}
    </div>
  );
}
