import { PageHeader } from "@/components/shared/page-header";

export default function SchoolDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="p-8">
      <PageHeader
        title={`School Detail: ${params.id}`}
        description="Detailed school profile — admissions stats, secondary prompts, interview info, and UT acceptance data."
      />
      {/* TODO: School stats, secondary prompts, interview data, prereq checklist */}
    </div>
  );
}
