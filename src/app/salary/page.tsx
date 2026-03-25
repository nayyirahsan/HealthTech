import { PageHeader } from "@/components/shared/page-header";

export default function SalaryPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Salary Explorer"
        description="Physician salary data by specialty, region, and career stage — with ROI calculations against tuition and debt."
      />
      {/* TODO: BLS wage data charts + tuition/debt ROI calculator */}
    </div>
  );
}
