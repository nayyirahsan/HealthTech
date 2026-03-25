import { PageHeader } from "@/components/shared/page-header";

export default function ChancePage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Chance Calculator"
        description="See your competitiveness at target schools — input GPA and MCAT to view acceptance probability grids."
      />
      {/* TODO: GPA x MCAT acceptance grid with color-coded likelihood */}
    </div>
  );
}
